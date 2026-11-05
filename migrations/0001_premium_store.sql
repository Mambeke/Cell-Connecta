-- Additive migration. Existing phones, variants, photo_blobs and users are retained.
CREATE TABLE IF NOT EXISTS cc_product_details (
 product_id TEXT PRIMARY KEY REFERENCES phones(id),
 sku TEXT NOT NULL UNIQUE,
 category TEXT NOT NULL DEFAULT 'phones' CHECK(category IN ('phones','laptops','accessories')),
 status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published','archived')),
 featured INTEGER NOT NULL DEFAULT 0 CHECK(featured IN(0,1)),
 warranty_months INTEGER CHECK(warranty_months IS NULL OR warranty_months BETWEEN 0 AND 120),
 specifications TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(specifications)),
 currency TEXT NOT NULL DEFAULT 'ZAR' CHECK(currency='ZAR'),
 updated_at INTEGER NOT NULL,
 version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS cc_product_visibility ON cc_product_details(status,featured,category);
INSERT OR IGNORE INTO cc_product_details(product_id,sku,category,status,featured,warranty_months,updated_at)
 SELECT id,'CC-'||upper(replace(id,'-','')),
 CASE WHEN lower(brand) IN('accessory','accessories') OR condition='accessory' THEN 'accessories' WHEN lower(model) LIKE '%macbook%' OR lower(model) LIKE '%laptop%' THEN 'laptops' ELSE 'phones' END,
 'published',CASE WHEN model IN('iPhone 16 Pro','iPhone 15','iPhone 14') OR id='353a0c24-ba24-4b25-9c79-f83dfcca3082' THEN 1 ELSE 0 END,
 CASE WHEN condition='certified_refurbished' THEN 6 WHEN condition='pre_owned' THEN 2 ELSE NULL END,created_at FROM phones;
CREATE TABLE IF NOT EXISTS cc_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL CHECK(json_valid(value)),updated_at INTEGER NOT NULL);
INSERT OR IGNORE INTO cc_settings VALUES('promotion','{"enabled":true,"eyebrow":"FIND YOUR NEXT PHONE","title":"Have a model in mind?","body":"Tell us the model, colour and storage you want. We’ll help you source it.","label":"Ask on WhatsApp","href":"https://wa.me/27685302223"}',unixepoch()*1000);
INSERT OR IGNORE INTO cc_settings VALUES('business','{"name":"Cell Connecta","phone":"+27685302223","whatsapp":"27685302223","location":"Cape Town, South Africa","email":"","delivery":"Free delivery in Cape Town. Delivery elsewhere is quoted and agreed before your order is confirmed.","warranty":"Certified refurbished phones include a 6-month warranty. Pre-owned phones include a 2-month warranty. Check the individual listing for its applicable coverage. Contact us for warranty assistance.","returns":"Contact Cell Connecta within 3 days of delivery if your purchase is not right for you. We will confirm the return process and applicable refund arrangements. Your statutory consumer rights are not limited by this policy."}',unixepoch()*1000);
CREATE TABLE IF NOT EXISTS cc_sessions (
 session_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),csrf_token TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS cc_session_expiry ON cc_sessions(expires_at);
CREATE TABLE IF NOT EXISTS cc_rate_limits(key TEXT PRIMARY KEY,hits INTEGER NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS cc_inventory_movements (
 id TEXT PRIMARY KEY,product_id TEXT NOT NULL,variant_id TEXT NOT NULL,quantity_change INTEGER NOT NULL,quantity_after INTEGER NOT NULL,reason TEXT NOT NULL,actor TEXT NOT NULL,created_at INTEGER NOT NULL,order_id TEXT
);
CREATE INDEX IF NOT EXISTS cc_inventory_history ON cc_inventory_movements(product_id,created_at DESC);
CREATE TABLE IF NOT EXISTS cc_orders (
 id TEXT PRIMARY KEY,idempotency_key TEXT NOT NULL UNIQUE,receipt_hash TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN('requested','confirmed','fulfilled','cancelled')),
 payment_status TEXT NOT NULL DEFAULT 'not_collected' CHECK(payment_status IN('not_collected','paid_manual')),
 payment_reference TEXT,customer_name TEXT NOT NULL,customer_phone TEXT NOT NULL,customer_email TEXT,
 city TEXT NOT NULL,address TEXT NOT NULL,delivery_method TEXT NOT NULL CHECK(delivery_method IN('cape_town','quote')),
 subtotal_cents INTEGER NOT NULL CHECK(subtotal_cents>=0),currency TEXT NOT NULL DEFAULT 'ZAR' CHECK(currency='ZAR'),
 created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,notes TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS cc_order_recent ON cc_orders(created_at DESC);
CREATE TABLE IF NOT EXISTS cc_order_items (
 id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES cc_orders(id),product_id TEXT NOT NULL,variant_id TEXT NOT NULL,
 model TEXT NOT NULL,storage TEXT NOT NULL,colour TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity>0),unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents>=0)
);
CREATE INDEX IF NOT EXISTS cc_order_items_order ON cc_order_items(order_id);
-- A failing guard aborts an entire D1 batch, including all stock/audit writes.
CREATE TABLE IF NOT EXISTS cc_transaction_guards(key TEXT PRIMARY KEY,ok INTEGER NOT NULL CHECK(ok=1));
CREATE TABLE IF NOT EXISTS cc_recovery_codes(email TEXT PRIMARY KEY,nonce TEXT NOT NULL,code_hash TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL);
