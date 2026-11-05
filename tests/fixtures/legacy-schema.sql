-- Local fixture baseline ONLY. Do not apply this baseline to production.
CREATE TABLE email_codes (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  purpose    TEXT NOT NULL,             -- signup | reset
  code_hash  TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE phones (
  id           TEXT PRIMARY KEY,
  brand        TEXT NOT NULL,                -- Apple | Samsung | Other | Accessory
  model        TEXT NOT NULL,
  condition    TEXT NOT NULL,                -- certified_refurbished | pre_owned | accessory
  colour       TEXT NOT NULL,
  description  TEXT,
  grade        TEXT,                         -- cosmetic grade (pre-owned): Excellent | Good | Fair
  battery      INTEGER,                      -- battery health %, pre-owned only
  photos       TEXT NOT NULL DEFAULT '[]',   -- JSON array of R2 object keys
  demo         INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL
);
CREATE TABLE photo_blobs (
  key          TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  bytes        BLOB NOT NULL,
  created_at   INTEGER NOT NULL
);
CREATE TABLE sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,              -- pbkdf2$<iterations>$<salt-b64>$<hash-b64>
  created_at    INTEGER NOT NULL
, role TEXT NOT NULL DEFAULT 'owner', recovery_hash TEXT, email_verified INTEGER NOT NULL DEFAULT 0);
CREATE TABLE variants (
  id         TEXT PRIMARY KEY,
  phone_id   TEXT NOT NULL,
  storage    TEXT NOT NULL,
  price      INTEGER NOT NULL,
  was_price  INTEGER,
  in_stock   INTEGER NOT NULL DEFAULT 0,
  position   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_email_codes_lookup ON email_codes (email, purpose);
CREATE INDEX idx_phones_brand ON phones (brand);
CREATE INDEX idx_phones_condition ON phones (condition);
CREATE INDEX idx_phones_created ON phones (created_at DESC);
CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_variants_phone ON variants (phone_id);