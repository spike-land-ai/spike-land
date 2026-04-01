-- Migration: Secure donated token storage
-- Adds encryption columns to donated_tokens table.
-- Safe for both fresh DBs and legacy DBs with pre-existing table.

-- Create table if it does not yet exist (fresh deployments)
CREATE TABLE IF NOT EXISTS donated_tokens (
  id                     TEXT    PRIMARY KEY,
  donor_user_id          TEXT    NOT NULL,
  provider               TEXT    NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'xai')),
  encrypted_key          TEXT    NOT NULL,
  donated_at             INTEGER NOT NULL,
  active                 INTEGER NOT NULL DEFAULT 1,
  total_calls            INTEGER NOT NULL DEFAULT 0,
  last_used_at           INTEGER,
  key_validated_at       INTEGER,
  migrated_from_plaintext INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_donated_tokens_provider_active
  ON donated_tokens (provider, active);

CREATE INDEX IF NOT EXISTS idx_donated_tokens_donor
  ON donated_tokens (donor_user_id);
