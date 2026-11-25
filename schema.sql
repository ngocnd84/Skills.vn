-- Cơ sở dữ liệu D1 cho skills.vn. Chạy một lần sau khi tạo D1:
--   npx wrangler d1 execute skillsvn --remote --file=schema.sql
CREATE TABLE IF NOT EXISTS orders (
  code TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_amount INTEGER,
  sepay_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email, created_at);

CREATE TABLE IF NOT EXISTS payments (
  sepay_id INTEGER PRIMARY KEY,
  order_code TEXT,
  amount INTEGER NOT NULL,
  content TEXT,
  gateway TEXT,
  raw TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,
  need TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
