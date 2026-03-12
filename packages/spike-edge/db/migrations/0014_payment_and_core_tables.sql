-- Create missing payment and core tables referenced by checkout/billing/credit code
-- Source schemas: src/edge-api/spike-land/db/db/schema.ts

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  image TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  plan TEXT NOT NULL DEFAULT 'free',
  current_period_end INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions (user_id);

CREATE TABLE IF NOT EXISTS credit_balances (
  user_id TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER NOT NULL DEFAULT 50,
  last_daily_grant TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  reference_id TEXT,
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON credit_ledger (user_id, created_at);

CREATE TABLE IF NOT EXISTS access_grants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grant_type TEXT NOT NULL,
  tier TEXT NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS access_grants_user_id_idx ON access_grants (user_id);
CREATE INDEX IF NOT EXISTS access_grants_user_expires_idx ON access_grants (user_id, expires_at);

CREATE TABLE IF NOT EXISTS user_api_key_vault (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS user_api_key_vault_user_provider_idx ON user_api_key_vault (user_id, provider);

CREATE TABLE IF NOT EXISTS registered_tools (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  schema TEXT NOT NULL DEFAULT '{}',
  endpoint TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  version TEXT NOT NULL DEFAULT '1.0.0',
  stability TEXT NOT NULL DEFAULT 'stable',
  install_count INTEGER NOT NULL DEFAULT 0,
  price_cents INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS registered_tools_user_id_idx ON registered_tools (user_id);
CREATE INDEX IF NOT EXISTS registered_tools_name_idx ON registered_tools (name);
