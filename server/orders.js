import {
  HttpError,
  text,
  integer,
  id,
  now,
  sha,
  guard,
  atomic,
} from "./core.js";
export async function validateCart(env, items) {
  if (!Array.isArray(items) || !items.length || items.length > 30)
    throw new HttpError(400, "Your bag must contain between 1 and 30 items.");
  const combined = new Map();
  for (const i of items) {
    const variantId = text(i.variantId, "Variant", 80, true),
      quantity = integer(i.quantity, "Quantity", 1, 100);
    combined.set(variantId, (combined.get(variantId) || 0) + quantity);
  }
  const result = [];
  for (const [variantId, quantity] of combined) {
    integer(quantity, "Quantity", 1, 100);
    const row = await env.DB.prepare(
      "SELECT v.*,p.model,p.colour,p.photos,d.status,d.category FROM variants v JOIN phones p ON p.id=v.phone_id JOIN cc_product_details d ON d.product_id=p.id WHERE v.id=? AND d.status='published'",
    )
      .bind(variantId)
      .first();
    if (!row)
      throw new HttpError(
        409,
        "An item in your bag is no longer available. Remove it to continue.",
      );
    if (quantity > row.in_stock)
      throw new HttpError(
        409,
        `${row.model} ${row.storage}: only ${row.in_stock} available. Update your bag.`,
      );
    result.push({
      variantId: row.id,
      productId: row.phone_id,
      model: row.model,
      colour: row.colour,
      storage: row.storage,
      quantity,
      unitPriceCents: Math.round(row.price * 100),
      stock: row.in_stock,
      photoUrl:
        "/api/photos/" + encodeURIComponent(JSON.parse(row.photos)[0] || ""),
    });
  }
  return {
    items: result,
    subtotalCents: result.reduce(
      (s, i) => s + i.quantity * i.unitPriceCents,
      0,
    ),
    currency: "ZAR",
  };
}
export async function createOrder(env, input, key, receiptToken) {
  if (
    !/^[a-f0-9-]{20,80}$/i.test(key || "") ||
    !/^[a-f0-9]{64}$/i.test(receiptToken || "")
  )
    throw new HttpError(
      400,
      "Invalid checkout request key. Refresh and try again.",
    );
  const receiptHash = await sha(receiptToken);
  const existing = await env.DB.prepare(
    "SELECT id,receipt_hash FROM cc_orders WHERE idempotency_key=?",
  )
    .bind(key)
    .first();
  if (existing) {
    if (existing.receipt_hash !== receiptHash)
      throw new HttpError(409, "Checkout key was already used.");
    return existing.id;
  }
  const cart = await validateCart(env, input.items),
    name = text(input.name, "Name", 120, true),
    phone = text(input.phone, "Phone number", 30, true),
    email = text(input.email, "Email", 200),
    city = text(input.city, "City", 100, true),
    address = text(input.address, "Delivery address", 700, true),
    notes = text(input.notes, "Notes", 1000);
  if (!/^[+0-9 ()-]{8,30}$/.test(phone))
    throw new HttpError(400, "Enter a valid contact number.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new HttpError(400, "Enter a valid email address.");
  if (!["cape_town", "quote"].includes(input.deliveryMethod))
    throw new HttpError(400, "Choose a delivery option.");
  if (input.deliveryMethod === "cape_town" && !/cape town/i.test(city))
    throw new HttpError(
      400,
      "For free Cape Town delivery, enter Cape Town as your city. Otherwise choose a delivery quote.",
    );
  if (input.acknowledged !== true)
    throw new HttpError(400, "Please accept the order-request terms.");
  if (input.expectedSubtotalCents !== cart.subtotalCents)
    throw new HttpError(
      409,
      "Prices changed. Refresh your bag to review the current total.",
    );
  const orderId = id(),
    t = now(),
    g = id(),
    conditions = cart.items
      .map(
        () =>
          "EXISTS(SELECT 1 FROM variants v JOIN cc_product_details d ON d.product_id=v.phone_id WHERE v.id=? AND v.in_stock>=? AND v.price=? AND d.status='published')",
      )
      .join(" AND ");
  const params = cart.items.flatMap((i) => [
    i.variantId,
    i.quantity,
    i.unitPriceCents / 100,
  ]);
  const statements = [
    guard(env.DB, g, conditions, params),
    env.DB.prepare(
      "INSERT INTO cc_orders(id,idempotency_key,receipt_hash,customer_name,customer_phone,customer_email,city,address,delivery_method,subtotal_cents,created_at,updated_at,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
    ).bind(
      orderId,
      key,
      receiptHash,
      name,
      phone,
      email || null,
      city,
      address,
      input.deliveryMethod,
      cart.subtotalCents,
      t,
      t,
      notes,
    ),
  ];
  for (const i of cart.items)
    statements.push(
      env.DB.prepare(
        "INSERT INTO cc_order_items(id,order_id,product_id,variant_id,model,storage,colour,quantity,unit_price_cents) VALUES(?,?,?,?,?,?,?,?,?)",
      ).bind(
        id(),
        orderId,
        i.productId,
        i.variantId,
        i.model,
        i.storage,
        i.colour,
        i.quantity,
        i.unitPriceCents,
      ),
    );
  statements.push(
    env.DB.prepare("DELETE FROM cc_transaction_guards WHERE key=?").bind(g),
  );
  try {
    await atomic(
      env.DB,
      statements,
      "Prices or stock changed. Refresh your bag and try again.",
    );
  } catch (e) {
    const duplicate = await env.DB.prepare(
      "SELECT id,receipt_hash FROM cc_orders WHERE idempotency_key=?",
    )
      .bind(key)
      .first();
    if (duplicate?.receipt_hash === receiptHash) return duplicate.id;
    throw e;
  }
  return orderId;
}
export async function order(env, orderId, privateData = true) {
  const row = await env.DB.prepare("SELECT * FROM cc_orders WHERE id=?")
    .bind(orderId)
    .first();
  if (!row) return null;
  const { results: items } = await env.DB.prepare(
    "SELECT product_id,variant_id,model,storage,colour,quantity,unit_price_cents FROM cc_order_items WHERE order_id=?",
  )
    .bind(orderId)
    .all();
  delete row.receipt_hash;
  delete row.idempotency_key;
  if (!privateData) {
    delete row.address;
    delete row.customer_email;
  }
  return { ...row, items };
}
export async function updateOrder(env, orderId, input, actor) {
  const existing = await order(env, orderId);
  if (!existing) throw new HttpError(404, "Order not found.");
  const target = input.status;
  if (!["confirmed", "fulfilled", "cancelled"].includes(target))
    throw new HttpError(400, "Invalid order status.");
  if (existing.status === target) return { status: target };
  const allowed = {
    requested: ["confirmed", "cancelled"],
    confirmed: ["fulfilled", "cancelled"],
    fulfilled: [],
    cancelled: [],
  };
  if (!allowed[existing.status].includes(target))
    throw new HttpError(409, "This order cannot make that status change.");
  const db = env.DB,
    g = id(),
    statements = [
      guard(db, g, "EXISTS(SELECT 1 FROM cc_orders WHERE id=? AND status=?)", [
        orderId,
        existing.status,
      ]),
    ];
  if (target === "confirmed")
    for (const item of existing.items) {
      const k = id();
      statements.push(
        guard(
          db,
          k,
          "EXISTS(SELECT 1 FROM variants v JOIN cc_product_details d ON d.product_id=v.phone_id WHERE v.id=? AND v.in_stock>=? AND d.status='published')",
          [item.variant_id, item.quantity],
        ),
        db
          .prepare("UPDATE variants SET in_stock=in_stock-? WHERE id=?")
          .bind(item.quantity, item.variant_id),
        db
          .prepare(
            "INSERT INTO cc_inventory_movements(id,product_id,variant_id,quantity_change,quantity_after,reason,actor,created_at,order_id) SELECT ?,phone_id,id,?,in_stock,?,?,?,? FROM variants WHERE id=?",
          )
          .bind(
            id(),
            -item.quantity,
            "Order confirmed",
            actor,
            now(),
            orderId,
            item.variant_id,
          ),
        db
          .prepare(
            "UPDATE cc_product_details SET version=version+1,updated_at=? WHERE product_id=?",
          )
          .bind(now(), item.product_id),
        db.prepare("DELETE FROM cc_transaction_guards WHERE key=?").bind(k),
      );
    }
  if (target === "cancelled" && existing.status === "confirmed")
    for (const item of existing.items) {
      const k = id();
      statements.push(
        guard(db, k, "EXISTS(SELECT 1 FROM variants WHERE id=?)", [
          item.variant_id,
        ]),
        db
          .prepare("UPDATE variants SET in_stock=in_stock+? WHERE id=?")
          .bind(item.quantity, item.variant_id),
        db
          .prepare(
            "INSERT INTO cc_inventory_movements(id,product_id,variant_id,quantity_change,quantity_after,reason,actor,created_at,order_id) SELECT ?,phone_id,id,?,in_stock,?,?,?,? FROM variants WHERE id=?",
          )
          .bind(
            id(),
            item.quantity,
            "Confirmed order cancelled — stock returned",
            actor,
            now(),
            orderId,
            item.variant_id,
          ),
        db
          .prepare(
            "UPDATE cc_product_details SET version=version+1,updated_at=? WHERE product_id=?",
          )
          .bind(now(), item.product_id),
        db.prepare("DELETE FROM cc_transaction_guards WHERE key=?").bind(k),
      );
    }
  statements.push(
    db
      .prepare("UPDATE cc_orders SET status=?,updated_at=? WHERE id=?")
      .bind(target, now(), orderId),
    db.prepare("DELETE FROM cc_transaction_guards WHERE key=?").bind(g),
  );
  await atomic(
    db,
    statements,
    "Order changed or there is insufficient stock. No inventory was deducted.",
  );
  return { status: target };
}
