import {
  HttpError,
  productEditingReady,
  json,
  body,
  origin,
  session,
  allowedOwners,
  rateLimit,
  verifyPassword,
  sha,
  token,
  now,
  text,
  integer,
  id,
  guard,
  atomic,
} from "./core.js";
import {
  products,
  settings,
  filterProducts,
  saveProduct,
  adjustStock,
} from "./data.js";
import { validateCart, createOrder, order, updateOrder } from "./orders.js";
import { recover } from "./recovery.js";
export async function api(request, env) {
  const u = new URL(request.url),
    p = u.pathname,
    m = request.method;
  origin(request);
  if (p === "/api/auth/me" && m === "GET") {
    const user = await session(request, env);
    return json(
      user
        ? { isOwner: true, email: user.email, csrfToken: user.csrf_token }
        : { isOwner: false },
      user ? 200 : 401,
    );
  }
  if (p === "/api/auth/login" && m === "POST") {
    const input = await body(request),
      email = text(input.email, "Email", 200, true).toLowerCase(),
      password = text(input.password, "Password", 512, true);
    await rateLimit(request, env, "login-ip", 12);
    await rateLimit(request, env, "login-account", 6, 900, email);
    if (!allowedOwners(env).length)
      throw new HttpError(
        503,
        "Owner access is not configured. Contact the store administrator.",
      );
    const user = await env.DB.prepare(
      "SELECT id,email,password_hash,role,email_verified FROM users WHERE lower(email)=?",
    )
      .bind(email)
      .first();
    const hash =
      user?.password_hash ||
      "pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    const valid = await verifyPassword(password, hash);
    if (
      !valid ||
      !user ||
      !allowedOwners(env).includes(email) ||
      user.role !== "owner" ||
      !user.email_verified
    )
      throw new HttpError(
        401,
        "Email or password is incorrect, or this account is not authorised.",
      );
    const raw = token(),
      csrf = token(),
      t = now();
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO cc_sessions(session_hash,user_id,csrf_token,created_at,expires_at) VALUES(?,?,?,?,?)",
      ).bind(await sha(raw), user.id, csrf, t, t + 8 * 3600000),
      env.DB.prepare("DELETE FROM cc_sessions WHERE expires_at<?").bind(t),
      env.DB.prepare("DELETE FROM cc_rate_limits WHERE expires_at<?").bind(t),
    ]);
    return json({ isOwner: true, csrfToken: csrf }, 200, {
      "Set-Cookie": `cc_store_session=${raw}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`,
    });
  }
  if (p === "/api/auth/logout" && m === "POST") {
    const user = await session(request, env, true);
    await env.DB.prepare("DELETE FROM cc_sessions WHERE session_hash=?")
      .bind(user.session_hash)
      .run();
    return json({ success: true }, 200, {
      "Set-Cookie":
        "cc_store_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    });
  }
  if (p === "/api/auth/forgot" && m === "POST")
    return json(await recover(request, env, await body(request)));
  if (p === "/api/phones" && m === "GET") {
    return json(await products(env), 200, {
      "Cache-Control": "public, max-age=0, must-revalidate",
    });
  }
  if (p === "/api/catalogue" && m === "GET")
    return json(filterProducts(await products(env), u.searchParams));
  if (p.startsWith("/api/phones/") && m === "GET") {
    const product = (await products(env)).find(
      (x) => x.id === decodeURIComponent(p.slice(12)),
    );
    if (!product) throw new HttpError(404, "Product not found.");
    return json(product);
  }
  if (p.startsWith("/api/photos/") && (m === "GET" || m === "HEAD")) {
    const key = decodeURIComponent(p.slice(12));
    if (!/^[a-zA-Z0-9_.-]{1,180}$/.test(key))
      throw new HttpError(404, "Image not found.");
    const photo = await env.DB.prepare(
      "SELECT content_type,bytes FROM photo_blobs WHERE key=?",
    )
      .bind(key)
      .first();
    if (!photo) throw new HttpError(404, "Image not found.");
    return new Response(
      m === "HEAD"
        ? null
        : Array.isArray(photo.bytes)
          ? new Uint8Array(photo.bytes)
          : photo.bytes,
      {
        headers: {
          "Content-Type": photo.content_type,
          "Cache-Control": "public,max-age=31536000,immutable",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
  if (p === "/api/cart/validate" && m === "POST") {
    const input = await body(request);
    return json(await validateCart(env, input.items));
  }
  if (p === "/api/orders" && m === "POST") {
    await rateLimit(request, env, "checkout", 12, 3600);
    const input = await body(request);
    const orderId = await createOrder(
      env,
      input,
      request.headers.get("idempotency-key"),
      request.headers.get("x-order-token"),
    );
    const recorded = await env.DB.prepare(
      "SELECT status,payment_status FROM cc_orders WHERE id=?",
    )
      .bind(orderId)
      .first();
    return json(
      {
        id: orderId,
        status: recorded.status,
        paymentStatus: recorded.payment_status,
      },
      201,
    );
  }
  if (/^\/api\/orders\/[^/]+$/.test(p) && m === "GET") {
    const orderId = p.split("/").pop(),
      receipt = request.headers.get("x-order-token");
    if (!receipt)
      throw new HttpError(401, "The private order link is required.");
    const row = await env.DB.prepare(
      "SELECT receipt_hash FROM cc_orders WHERE id=?",
    )
      .bind(orderId)
      .first();
    if (!row || row.receipt_hash !== (await sha(receipt)))
      throw new HttpError(404, "Order not found.");
    return json(await order(env, orderId));
  }
  if (p === "/api/payments/session")
    throw new HttpError(
      503,
      "Online payments are not configured. Submit an order request and arrange payment directly with Cell Connecta.",
    );
  if (p.startsWith("/api/admin/")) {
    const owner = await session(request, env, true),
      actor = owner.email;
    if (
      m !== "GET" &&
      (p.startsWith("/api/admin/products") || p === "/api/admin/photos") &&
      !productEditingReady(env)
    )
      throw new HttpError(
        503,
        "Product editing is locked until legacy deployment URLs are protected. Contact your deployment administrator.",
      );
    if (p === "/api/admin/overview" && m === "GET") {
      const all = await products(env, true),
        { results: recentOrders } = await env.DB.prepare(
          "SELECT id,status,payment_status,customer_name,subtotal_cents,created_at FROM cc_orders ORDER BY created_at DESC LIMIT 30",
        ).all();
      return json({
        productEditingReady: productEditingReady(env),
        products: all,
        orders: recentOrders,
        settings: await settings(env),
      });
    }
    if (p === "/api/admin/products" && m === "POST") {
      const productId = await saveProduct(env, await body(request), actor);
      return json({ id: productId }, 201);
    }
    if (/^\/api\/admin\/products\/[^/]+\/archive$/.test(p) && m === "POST") {
      const productId = p.split("/")[4],
        input = await body(request),
        version = integer(input.version, "Version", 1),
        g = id();
      await atomic(env.DB, [
        guard(
          env.DB,
          g,
          "EXISTS(SELECT 1 FROM cc_product_details WHERE product_id=? AND version=?)",
          [productId, version],
        ),
        env.DB.prepare(
          "UPDATE cc_product_details SET status='archived',featured=0,updated_at=?,version=version+1 WHERE product_id=?",
        ).bind(now(), productId),
        env.DB.prepare("DELETE FROM cc_transaction_guards WHERE key=?").bind(g),
      ]);
      return json({ success: true });
    }
    if (p === "/api/admin/stock" && m === "POST")
      return json(await adjustStock(env, await body(request), actor));
    if (p === "/api/admin/history" && m === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT m.*,p.model,v.storage FROM cc_inventory_movements m LEFT JOIN phones p ON p.id=m.product_id LEFT JOIN variants v ON v.id=m.variant_id ORDER BY m.created_at DESC LIMIT 150",
      ).all();
      return json(results);
    }
    if (p === "/api/admin/photos" && m === "POST") {
      const declared = (request.headers.get("content-type") || "").split(
        ";",
      )[0];
      if (!["image/jpeg", "image/png", "image/webp"].includes(declared))
        throw new HttpError(415, "Upload a JPEG, PNG or WebP image.");
      if (Number(request.headers.get("content-length")) > 1500000)
        throw new HttpError(413, "Image must be smaller than 1.5 MB.");
      const bytes = new Uint8Array(await request.arrayBuffer());
      if (bytes.length < 24 || bytes.length > 1500000)
        throw new HttpError(413, "Image must be smaller than 1.5 MB.");
      const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
        png = [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v),
        webp =
          String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
          String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
      const actual = jpg
        ? "image/jpeg"
        : png
          ? "image/png"
          : webp
            ? "image/webp"
            : null;
      if (!actual || actual !== declared)
        throw new HttpError(415, "The file is not a supported image.");
      const key =
        "photo-" +
        id() +
        { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" }[
          actual
        ];
      await env.DB.prepare(
        "INSERT INTO photo_blobs(key,content_type,bytes,created_at) VALUES(?,?,?,?)",
      )
        .bind(key, actual, bytes.buffer, now())
        .run();
      return json({ key, url: "/api/photos/" + key }, 201);
    }
    if (p === "/api/admin/settings" && m === "POST") {
      const input = await body(request);
      const promo = input.promotion;
      if (!promo || typeof promo.enabled !== "boolean")
        throw new HttpError(400, "Invalid promotion.");
      const promotion = {
        enabled: promo.enabled,
        eyebrow: text(promo.eyebrow, "Eyebrow", 100),
        title: text(promo.title, "Title", 150),
        body: text(promo.body, "Promotion text", 700),
        label: text(promo.label, "Button label", 60),
        href: text(promo.href, "Button link", 300),
      };
      if (promotion.href) {
        let link;
        try {
          link = new URL(promotion.href, "https://cell-connecta.pages.dev");
        } catch {
          throw new HttpError(400, "Invalid promotion link.");
        }
        if (
          link.origin !== "https://cell-connecta.pages.dev" &&
          !(
            link.protocol === "https:" &&
            link.hostname === "wa.me" &&
            /^\/\d+$/.test(link.pathname)
          )
        )
          throw new HttpError(
            400,
            "Use an internal shop link or a WhatsApp link.",
          );
      }
      const business = input.business;
      if (!business)
        throw new HttpError(400, "Business settings are required.");
      const b = {
        name: "Cell Connecta",
        location: text(business.location, "Location", 150, true),
        phone: text(business.phone, "Phone", 30, true),
        whatsapp: text(business.whatsapp, "WhatsApp number", 20, true),
        email: text(business.email, "Email", 200),
        delivery: text(business.delivery, "Delivery policy", 4000, true),
        warranty: text(business.warranty, "Warranty policy", 4000, true),
        returns: text(business.returns, "Returns policy", 4000, true),
      };
      if (!/^\+?[\d -]{8,25}$/.test(b.phone) || !/^\d{8,15}$/.test(b.whatsapp))
        throw new HttpError(
          400,
          "Use valid phone and international WhatsApp numbers.",
        );
      if (b.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email))
        throw new HttpError(400, "Invalid business email.");
      await env.DB.batch(
        Object.entries({ promotion, business: b }).map(([k, v]) =>
          env.DB.prepare(
            "UPDATE cc_settings SET value=?,updated_at=? WHERE key=?",
          ).bind(JSON.stringify(v), now(), k),
        ),
      );
      return json({ success: true });
    }
    if (p === "/api/admin/orders" && m === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT id,status,payment_status,customer_name,customer_phone,subtotal_cents,created_at,updated_at FROM cc_orders ORDER BY created_at DESC LIMIT 200",
      ).all();
      return json(results);
    }
    if (/^\/api\/admin\/orders\/[^/]+$/.test(p)) {
      const orderId = p.split("/").pop();
      if (m === "GET") {
        const value = await order(env, orderId);
        if (!value) throw new HttpError(404, "Order not found.");
        return json(value);
      }
      if (m === "POST")
        return json(
          await updateOrder(env, orderId, await body(request), actor),
        );
    }
    if (p === "/api/admin/export" && m === "GET") {
      const all = await products(env, true),
        safe = (v) =>
          '"' +
          String(v ?? "")
            .replace(/^[=+@-]/, "'$&")
            .replace(/"/g, '""') +
          '"';
      const rows = [
        [
          "Product ID",
          "SKU",
          "Brand",
          "Model",
          "Category",
          "Condition",
          "Colour",
          "Status",
          "Storage",
          "Price ZAR",
          "Stock",
        ],
      ];
      for (const product of all)
        for (const v of product.variants)
          rows.push([
            product.id,
            product.sku,
            product.brand,
            product.model,
            product.category,
            product.condition,
            product.colour,
            product.status,
            v.storage,
            v.price,
            v.inStock,
          ]);
      return new Response(rows.map((r) => r.map(safe).join(",")).join("\r\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="cell-connecta-inventory.csv"',
          "Cache-Control": "no-store",
        },
      });
    }
    throw new HttpError(404, "Admin endpoint not found.");
  }
  throw new HttpError(404, "Endpoint not found.");
}
