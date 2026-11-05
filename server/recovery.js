import {
  HttpError,
  text,
  rateLimit,
  allowedOwners,
  token,
  sha,
  now,
  encoder,
  guard,
  atomic,
  id,
} from "./core.js";
export async function recover(request, env, input) {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL)
    throw new HttpError(
      503,
      "Email recovery is not configured. Use your existing password or contact the deployment administrator.",
    );
  const email = text(input.email, "Email", 200, true).toLowerCase();
  await rateLimit(request, env, "password-recovery-ip", 8, 900);
  const user = await env.DB.prepare(
    "SELECT id FROM users WHERE lower(email)=? AND email_verified=1 AND role='owner'",
  )
    .bind(email)
    .first();
  if (input.code) {
    const code = text(input.code, "Verification code", 12, true),
      password = text(input.password, "New password", 512, true);
    if (password.length < 12)
      throw new HttpError(
        400,
        "Use at least 12 characters for your new password.",
      );
    const row = await env.DB.prepare(
      "UPDATE cc_recovery_codes SET attempts=attempts+1 WHERE email=? AND attempts<5 AND expires_at>? RETURNING *",
    )
      .bind(email, now())
      .first();
    if (
      !row ||
      !user ||
      !allowedOwners(env).includes(email) ||
      (await sha(code + ":" + row.nonce)) !== row.code_hash
    )
      throw new HttpError(
        400,
        "The verification code is incorrect or expired.",
      );
    const salt = crypto.getRandomValues(new Uint8Array(16)),
      key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"],
      ),
      hash = new Uint8Array(
        await crypto.subtle.deriveBits(
          { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
          key,
          256,
        ),
      ),
      b64 = (bytes) => btoa(String.fromCharCode(...bytes)),
      encoded = "pbkdf2$100000$" + b64(salt) + "$" + b64(hash),
      g = id();
    await atomic(
      env.DB,
      [
        guard(
          env.DB,
          g,
          "EXISTS(SELECT 1 FROM cc_recovery_codes WHERE email=? AND nonce=? AND code_hash=? AND expires_at>?)",
          [email, row.nonce, row.code_hash, now()],
        ),
        env.DB.prepare("UPDATE users SET password_hash=? WHERE id=?").bind(
          encoded,
          user.id,
        ),
        env.DB.prepare("DELETE FROM cc_sessions WHERE user_id=?").bind(user.id),
        env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(user.id),
        env.DB.prepare("DELETE FROM cc_recovery_codes WHERE email=?").bind(
          email,
        ),
        env.DB.prepare("DELETE FROM cc_transaction_guards WHERE key=?").bind(g),
      ],
      "The verification code has already been used or expired.",
    );
    return { success: true };
  }
  await rateLimit(request, env, "password-recovery-email", 3, 3600, email);
  if (!user || !allowedOwners(env).includes(email))
    return {
      success: true,
      message: "If this account is eligible, a verification code will be sent.",
    };
  const code = String(
      crypto.getRandomValues(new Uint32Array(1))[0] % 100000000,
    ).padStart(8, "0"),
    nonce = token(),
    t = now();
  await env.DB.prepare(
    "INSERT INTO cc_recovery_codes(email,nonce,code_hash,attempts,expires_at,created_at) VALUES(?,?,?,0,?,?) ON CONFLICT(email) DO UPDATE SET nonce=excluded.nonce,code_hash=excluded.code_hash,attempts=0,expires_at=excluded.expires_at,created_at=excluded.created_at",
  )
    .bind(email, nonce, await sha(code + ":" + nonce), t + 600000, t)
    .run();
  let sent = false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [email],
        subject: "Cell Connecta owner password recovery",
        text:
          "Your Cell Connecta verification code is " +
          code +
          ". It expires in 10 minutes. If you did not request this, ignore this email. Never share the code.",
      }),
    });
    sent = r.ok;
  } catch {}
  if (!sent) {
    await env.DB.prepare(
      "DELETE FROM cc_recovery_codes WHERE email=? AND nonce=?",
    )
      .bind(email, nonce)
      .run();
    throw new HttpError(
      503,
      "The recovery email could not be sent. Please try again later or contact your deployment administrator.",
    );
  }
  return {
    success: true,
    message: "If this account is eligible, a verification code will be sent.",
  };
}
