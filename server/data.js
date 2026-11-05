import {
  HttpError,
  text,
  integer,
  amount,
  id,
  now,
  guard,
  atomic,
  audit,
} from "./core.js";
const parse = (s, fallback = []) => {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
};
export async function products(env, admin = false) {
  const [{ results: rows }, { results: variants }] = await env.DB.batch([
    env.DB.prepare(
      `SELECT p.*,d.sku,d.category,d.status,d.featured,d.warranty_months,d.specifications,d.currency,d.updated_at,d.version FROM phones p JOIN cc_product_details d ON d.product_id=p.id ${admin ? "" : "WHERE d.status='published'"} ORDER BY d.updated_at DESC,p.created_at DESC`,
    ),
    env.DB.prepare(
      `SELECT v.* FROM variants v JOIN cc_product_details d ON d.product_id=v.phone_id ${admin ? "" : "WHERE d.status='published'"} ORDER BY v.position,v.id`,
    ),
  ]);
  const grouped = new Map();
  for (const v of variants) {
    const list = grouped.get(v.phone_id) || [];
    list.push({
      id: v.id,
      storage: v.storage,
      price: v.price,
      wasPrice: v.was_price ?? null,
      inStock: v.in_stock,
    });
    grouped.set(v.phone_id, list);
  }
  return rows.map((p) => ({
    _id: p.id,
    id: p.id,
    brand: p.brand,
    model: p.model,
    condition: p.condition,
    colour: p.colour,
    description: p.description || "",
    grade: p.grade || "",
    battery: p.battery ?? null,
    photos: parse(p.photos),
    photoUrls: parse(p.photos).map(
      (k) => "/api/photos/" + encodeURIComponent(k),
    ),
    variants: grouped.get(p.id) || [],
    sku: p.sku,
    category: p.category,
    status: p.status,
    featured: !!p.featured,
    warrantyMonths: p.warranty_months,
    specifications: parse(p.specifications),
    currency: p.currency,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    version: p.version,
  }));
}
export async function settings(env) {
  const { results } = await env.DB.prepare(
    "SELECT key,value FROM cc_settings",
  ).all();
  return Object.fromEntries(results.map((r) => [r.key, parse(r.value, {})]));
}
export const conditionName = (c) =>
  ({
    new: "New",
    certified_refurbished: "Certified refurbished",
    pre_owned: "Pre-owned",
    accessory: "Accessory",
  })[c] || c;
export const stock = (p) => p.variants.reduce((n, v) => n + v.inStock, 0);
export const first = (p) =>
  p.variants.find((v) => v.inStock > 0) || p.variants[0];
export function filterProducts(all, q) {
  let items = all;
  const search = q.get("q")?.trim().toLowerCase();
  if (search) {
    const terms = search.split(/\s+/);
    items = items.filter((p) =>
      terms.every((term) =>
        [p.model, p.brand, p.colour, ...p.variants.map((v) => v.storage)]
          .join(" ")
          .toLowerCase()
          .includes(term),
      ),
    );
  }
  for (const field of ["brand", "category", "model", "colour", "condition"]) {
    const values = [...new Set(q.getAll(field).filter(Boolean))];
    if (values.length) items = items.filter((p) => values.includes(p[field]));
  }
  const match = (v) =>
    (!q.get("storage") || v.storage === q.get("storage")) &&
    (!q.get("min") || v.price >= Number(q.get("min"))) &&
    (!q.get("max") || v.price <= Number(q.get("max"))) &&
    (q.get("available") !== "1" || v.inStock > 0) &&
    (q.get("deals") !== "1" || v.wasPrice > v.price);
  items = items
    .filter((p) => p.variants.some(match))
    .map((p) => ({
      ...p,
      displayVariantId: (
        p.variants.find((v) => match(v) && v.inStock > 0) ||
        p.variants.find(match)
      ).id,
    }));
  const sort = q.get("sort") || "featured",
    price = (p) => p.variants.find((v) => v.id === p.displayVariantId).price;
  items.sort(
    sort === "price-low"
      ? (a, b) => price(a) - price(b)
      : sort === "price-high"
        ? (a, b) => price(b) - price(a)
        : sort === "newest"
          ? (a, b) => b.createdAt - a.createdAt
          : (a, b) =>
              Number(b.featured) - Number(a.featured) ||
              b.updatedAt - a.updatedAt,
  );
  const count = items.length,
    page = Math.max(1, Number.parseInt(q.get("page") || "1") || 1),
    pageSize = 12;
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    count,
    page,
    pages: Math.ceil(count / pageSize),
    pageSize,
  };
}
export function validateProduct(input) {
  const p = {};
  p.brand = text(input.brand, "Brand", 60, true);
  p.model = text(input.model, "Model", 120, true);
  p.colour = text(input.colour, "Colour", 60);
  p.description = text(input.description, "Description", 6000);
  p.category = input.category;
  if (!["phones", "laptops", "accessories"].includes(p.category))
    throw new HttpError(400, "Choose a valid category.");
  p.condition = input.condition;
  if (
    !["new", "certified_refurbished", "pre_owned", "accessory"].includes(
      p.condition,
    )
  )
    throw new HttpError(400, "Choose a valid condition.");
  p.status = input.status;
  if (!["draft", "published", "archived"].includes(p.status))
    throw new HttpError(400, "Choose a valid publication status.");
  p.sku = text(input.sku, "SKU", 80, true).toUpperCase();
  p.featured = input.featured === true;
  p.warrantyMonths =
    input.warrantyMonths === null || input.warrantyMonths === ""
      ? null
      : integer(input.warrantyMonths, "Warranty months", 0, 120);
  p.grade = text(input.grade, "Grade", 60);
  p.battery =
    input.battery == null || input.battery === ""
      ? null
      : integer(input.battery, "Battery health", 0, 100);
  if (
    !Array.isArray(input.photos) ||
    input.photos.length > 10 ||
    input.photos.some(
      (k) => typeof k !== "string" || !/^[a-zA-Z0-9_.-]{1,180}$/.test(k),
    )
  )
    throw new HttpError(400, "Choose up to 10 uploaded product photos.");
  p.photos = input.photos;
  if (p.status === "published" && !p.photos.length)
    throw new HttpError(400, "A published product needs at least one photo.");
  if (
    !Array.isArray(input.variants) ||
    !input.variants.length ||
    input.variants.length > 20
  )
    throw new HttpError(400, "Add between 1 and 20 product variants.");
  p.variants = input.variants.map((v) => ({
    id: v.id ? text(v.id, "Variant ID", 80) : id(),
    storage: text(v.storage, "Storage or variant label", 80, true),
    price: amount(v.price),
    wasPrice:
      v.wasPrice === null || v.wasPrice === "" || v.wasPrice === undefined
        ? null
        : amount(v.wasPrice, "Previous price"),
    inStock: integer(v.inStock, "Stock", 0, 100000),
  }));
  if (
    new Set(p.variants.map((v) => v.id)).size !== p.variants.length ||
    new Set(p.variants.map((v) => v.storage.toLowerCase())).size !==
      p.variants.length
  )
    throw new HttpError(400, "Variant identifiers and labels must be unique.");
  if (p.variants.some((v) => v.wasPrice != null && v.wasPrice <= v.price))
    throw new HttpError(
      400,
      "A genuine previous price must be higher than the current price.",
    );
  if (!Array.isArray(input.specifications) || input.specifications.length > 30)
    throw new HttpError(400, "Provide up to 30 specifications.");
  p.specifications = input.specifications.map((s) => ({
    label: text(s.label, "Specification label", 80, true),
    value: text(s.value, "Specification value", 300, true),
  }));
  return p;
}
export async function saveProduct(env, input, actor) {
  const p = validateProduct(input),
    existingId = input.id ? text(input.id, "Product ID", 80) : null;
  const productId = existingId || id(),
    t = now(),
    key = id();
  const old = existingId
    ? (await products(env, true)).find((p) => p.id === existingId)
    : null;
  if (existingId && !old) throw new HttpError(404, "Product not found.");
  if (old && old.version !== input.version)
    throw new HttpError(
      409,
      "Someone else updated this product. Reload before saving.",
    );
  for (const photo of p.photos) {
    if (
      !(await env.DB.prepare("SELECT key FROM photo_blobs WHERE key=?")
        .bind(photo)
        .first())
    )
      throw new HttpError(
        400,
        "One of the product photos is missing. Upload it again.",
      );
  }
  if (
    old &&
    old.variants.some(
      (v) => v.inStock > 0 && !p.variants.some((x) => x.id === v.id),
    )
  )
    throw new HttpError(
      400,
      "Set a variant’s stock to zero and save before removing it.",
    );
  if (old) {
    const { n } = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM cc_order_items i JOIN cc_orders o ON o.id=i.order_id WHERE i.product_id=? AND o.status='confirmed'",
    )
      .bind(old.id)
      .first();
    if (n && old.variants.some((v) => !p.variants.some((x) => x.id === v.id)))
      throw new HttpError(
        409,
        "A confirmed order uses this product. Retain its existing variants.",
      );
  }
  for (const v of p.variants) {
    const row = await env.DB.prepare("SELECT phone_id FROM variants WHERE id=?")
      .bind(v.id)
      .first();
    if (row && row.phone_id !== productId)
      throw new HttpError(400, "Variant belongs to a different product.");
  }
  const db = env.DB,
    statements = [];
  if (old) {
    statements.push(
      guard(
        db,
        key,
        "EXISTS(SELECT 1 FROM cc_product_details WHERE product_id=? AND version=?)",
        [productId, input.version],
      ),
    );
    statements.push(
      db
        .prepare(
          "UPDATE phones SET brand=?,model=?,condition=?,colour=?,description=?,grade=?,battery=?,photos=?,demo=0 WHERE id=?",
        )
        .bind(
          p.brand,
          p.model,
          p.condition,
          p.colour,
          p.description,
          p.grade || null,
          p.battery,
          JSON.stringify(p.photos),
          productId,
        ),
    );
    statements.push(
      db
        .prepare(
          "UPDATE cc_product_details SET sku=?,category=?,status=?,featured=?,warranty_months=?,specifications=?,updated_at=?,version=version+1 WHERE product_id=?",
        )
        .bind(
          p.sku,
          p.category,
          p.status,
          +p.featured,
          p.warrantyMonths,
          JSON.stringify(p.specifications),
          t,
          productId,
        ),
    );
    statements.push(
      db
        .prepare(
          `DELETE FROM variants WHERE phone_id=? AND id NOT IN(${p.variants.map(() => "?").join(",")})`,
        )
        .bind(productId, ...p.variants.map((v) => v.id)),
    );
  } else {
    statements.push(
      db
        .prepare(
          "INSERT INTO phones(id,brand,model,condition,colour,description,grade,battery,photos,demo,created_at) VALUES(?,?,?,?,?,?,?,?,?,0,?)",
        )
        .bind(
          productId,
          p.brand,
          p.model,
          p.condition,
          p.colour,
          p.description,
          p.grade || null,
          p.battery,
          JSON.stringify(p.photos),
          t,
        ),
    );
    statements.push(
      db
        .prepare(
          "INSERT INTO cc_product_details(product_id,sku,category,status,featured,warranty_months,specifications,updated_at) VALUES(?,?,?,?,?,?,?,?)",
        )
        .bind(
          productId,
          p.sku,
          p.category,
          p.status,
          +p.featured,
          p.warrantyMonths,
          JSON.stringify(p.specifications),
          t,
        ),
    );
  }
  for (let i = 0; i < p.variants.length; i++) {
    const v = p.variants[i],
      previous = old?.variants.find((o) => o.id === v.id)?.inStock || 0;
    statements.push(
      db
        .prepare(
          "INSERT INTO variants(id,phone_id,storage,price,was_price,in_stock,position) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET storage=excluded.storage,price=excluded.price,was_price=excluded.was_price,in_stock=excluded.in_stock,position=excluded.position",
        )
        .bind(v.id, productId, v.storage, v.price, v.wasPrice, v.inStock, i),
    );
    if (v.inStock !== previous)
      statements.push(
        audit(db, {
          productId,
          variantId: v.id,
          delta: v.inStock - previous,
          after: v.inStock,
          reason: old ? "Product editor stock update" : "Initial stock",
          actor,
        }),
      );
  }
  if (old)
    statements.push(
      db.prepare("DELETE FROM cc_transaction_guards WHERE key=?").bind(key),
    );
  await atomic(
    db,
    statements,
    "Product changed, a SKU is already in use, or a variant is linked elsewhere. Refresh and try again.",
  );
  return productId;
}
export async function adjustStock(env, input, actor) {
  const variantId = text(input.variantId, "Variant", 80, true),
    quantity = integer(input.quantity, "Quantity", 0, 100000),
    reason = text(input.reason, "Reason", 250, true);
  if (!["add", "remove", "set"].includes(input.action))
    throw new HttpError(400, "Invalid stock action.");
  const v = await env.DB.prepare(
    "SELECT v.*,d.version FROM variants v JOIN cc_product_details d ON d.product_id=v.phone_id WHERE v.id=?",
  )
    .bind(variantId)
    .first();
  if (!v) throw new HttpError(404, "Variant not found.");
  const after =
    input.action === "add"
      ? v.in_stock + quantity
      : input.action === "remove"
        ? v.in_stock - quantity
        : quantity;
  integer(after, "Resulting stock", 0, 100000);
  const k = id();
  await atomic(env.DB, [
    guard(
      env.DB,
      k,
      "EXISTS(SELECT 1 FROM variants v JOIN cc_product_details d ON d.product_id=v.phone_id WHERE v.id=? AND v.in_stock=? AND d.version=?)",
      [v.id, v.in_stock, input.version],
    ),
    env.DB.prepare("UPDATE variants SET in_stock=? WHERE id=?").bind(
      after,
      v.id,
    ),
    env.DB.prepare(
      "UPDATE cc_product_details SET version=version+1,updated_at=? WHERE product_id=?",
    ).bind(now(), v.phone_id),
    audit(env.DB, {
      productId: v.phone_id,
      variantId: v.id,
      delta: after - v.in_stock,
      after,
      reason,
      actor,
    }),
    env.DB.prepare("DELETE FROM cc_transaction_guards WHERE key=?").bind(k),
  ]);
  return { stock: after };
}
