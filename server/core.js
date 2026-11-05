export class HttpError extends Error {
  constructor(status, message, code = "") {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const json = (data, status = 200, headers = {}) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
export const now = () => Date.now();
export const id = () => crypto.randomUUID();
export const encoder = new TextEncoder();
export async function sha(value) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(value)),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export const token = () =>
  [...crypto.getRandomValues(new Uint8Array(32))]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
export function text(value, name, max = 200, required = false) {
  if (value == null) value = "";
  if (typeof value !== "string" || value.length > max)
    throw new HttpError(
      400,
      `${name} must be text of at most ${max} characters.`,
    );
  value = value.trim();
  if (required && !value) throw new HttpError(400, `${name} is required.`);
  return value;
}
export function integer(value, name, min = 0, max = 100000) {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  )
    throw new HttpError(
      400,
      `${name} must be a whole number between ${min} and ${max}.`,
    );
  return value;
}
export function amount(value, name = "Price") {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0 ||
    value > 1000000 ||
    Math.abs(value * 100 - Math.round(value * 100)) > 0.00001
  )
    throw new HttpError(
      400,
      `${name} must be a valid positive ZAR amount (at most two decimals).`,
    );
  return value;
}
export async function body(request, max = 100000) {
  const length = Number(request.headers.get("content-length"));
  if (length > max) throw new HttpError(413, "Request too large.");
  if (!(request.headers.get("content-type") || "").includes("application/json"))
    throw new HttpError(415, "Send JSON data.");
  const raw = await request.text();
  if (raw.length > max) throw new HttpError(413, "Request too large.");
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw Error();
    return value;
  } catch {
    throw new HttpError(400, "Invalid JSON data.");
  }
}
export function requestOrigin(request) {
  const url = new URL(request.url);
  // Arena's local preview terminates TLS before the local HTTP dev server.
  if (url.hostname.endsWith(".e2b.app")) return "https://" + url.host;
  return url.origin;
}
export function origin(request) {
  if (!["GET", "HEAD"].includes(request.method)) {
    const o = request.headers.get("origin");
    if (o !== requestOrigin(request))
      throw new HttpError(403, "This request must come from the shop website.");
    if (request.headers.get("sec-fetch-site") === "cross-site")
      throw new HttpError(403, "Cross-site request rejected.");
  }
}
export function allowedOwners(env) {
  try {
    const parsed = JSON.parse(env.OWNER_EMAILS || "");
    if (Array.isArray(parsed))
      return parsed.map((x) => String(x).toLowerCase().trim());
  } catch {}
  return (env.OWNER_EMAILS || "")
    .split(/[,;\s]+/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}
export async function session(request, env, required = false) {
  const raw = (request.headers.get("cookie") || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("cc_store_session="))
    ?.slice(17);
  if (!raw) {
    if (required) throw new HttpError(401, "Please sign in as the owner.");
    return null;
  }
  const row = await env.DB.prepare(
    "SELECT s.*,u.email,u.role,u.email_verified FROM cc_sessions s JOIN users u ON u.id=s.user_id WHERE s.session_hash=? AND s.expires_at>?",
  )
    .bind(await sha(raw), now())
    .first();
  if (
    !row ||
    !allowedOwners(env).includes(row.email.toLowerCase()) ||
    !row.email_verified ||
    row.role !== "owner"
  ) {
    if (required)
      throw new HttpError(
        401,
        "Your session has expired. Please sign in again.",
      );
    return null;
  }
  if (required && !["GET", "HEAD"].includes(request.method)) {
    origin(request);
    if (request.headers.get("x-csrf-token") !== row.csrf_token)
      throw new HttpError(
        403,
        "Security token expired. Refresh and try again.",
      );
  }
  return row;
}
export async function rateLimit(
  request,
  env,
  scope,
  limit = 10,
  seconds = 900,
  extra = "",
) {
  const bucket = Math.floor(now() / (seconds * 1000));
  const key = await sha(
    scope +
      ":" +
      (request.headers.get("cf-connecting-ip") || "unknown") +
      ":" +
      extra +
      ":" +
      bucket,
  );
  const row = await env.DB.prepare(
    "INSERT INTO cc_rate_limits(key,hits,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits",
  )
    .bind(key, now() + seconds * 1000)
    .first();
  if (row.hits > limit)
    throw new HttpError(429, "Too many attempts. Please wait and try again.");
}
export async function verifyPassword(password, encoded) {
  const [kind, n, salt, hash] = encoded.split("$");
  if (kind !== "pbkdf2" || !/^\d+$/.test(n) || Number(n) > 1000000)
    return false;
  try {
    const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const expected = unb64(hash);
    const actual = new Uint8Array(
      await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: unb64(salt),
          iterations: Number(n),
          hash: "SHA-256",
        },
        key,
        expected.length * 8,
      ),
    );
    let diff = actual.length ^ expected.length;
    for (let i = 0; i < expected.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
}
export function guard(db, key, sql, params = []) {
  return db
    .prepare(
      `INSERT INTO cc_transaction_guards(key,ok) SELECT ?,CASE WHEN (${sql}) THEN 1 ELSE 0 END`,
    )
    .bind(key, ...params);
}
export async function atomic(
  db,
  statements,
  message = "The record changed or stock is no longer sufficient. Refresh and try again.",
) {
  try {
    return await db.batch(statements);
  } catch (e) {
    if (/CHECK constraint|UNIQUE constraint|FOREIGN KEY/i.test(String(e)))
      throw new HttpError(409, message);
    throw e;
  }
}
export function audit(
  db,
  { productId, variantId, delta, after, reason, actor, orderId = null },
) {
  return db
    .prepare(
      "INSERT INTO cc_inventory_movements(id,product_id,variant_id,quantity_change,quantity_after,reason,actor,created_at,order_id) VALUES(?,?,?,?,?,?,?,?,?)",
    )
    .bind(
      id(),
      productId,
      variantId,
      delta,
      after,
      reason,
      actor,
      now(),
      orderId,
    );
}

export function productEditingReady(env) {
  return (
    env.CF_PAGES_BRANCH === "local" || env.LEGACY_CATALOGUE_PROTECTED === "true"
  );
}
