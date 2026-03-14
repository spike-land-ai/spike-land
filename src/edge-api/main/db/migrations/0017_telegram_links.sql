-- Telegram account linking table (mirrors whatsapp_links pattern)
CREATE TABLE IF NOT EXISTS telegram_links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  telegram_user_id TEXT,
  link_code TEXT,
  link_code_expires_at INTEGER,
  verified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telegram_links_user_id ON telegram_links(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_links_telegram_user_id ON telegram_links(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_links_link_code ON telegram_links(link_code);
