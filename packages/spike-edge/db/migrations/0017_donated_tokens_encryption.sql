-- Migration: Secure donated token storage
--
-- Phase 1 of Token Bank security hardening (OWASP A02:2021):
--
-- 1. Create the donated_tokens table with an encrypted_key column only
--    (no plaintext column — keys are AES-256-GCM encrypted before insert)
-- 2. If the table already exists from an earlier ad-hoc migration that used
--    a plaintext `api_key` column, the ALTER TABLE statements below add the
--    new `encrypted_key` column and mark old rows as inactive so they are
--    not consumed until re-encrypted by an operator migration script.
--
-- The application layer (token-encryption.ts) is solely responsible for
-- encryption/decryption. The DB schema stores only the opaque base64 blob.
--
-- Security properties guaranteed by this schema:
--   - No plaintext key column exists in the target schema
--   - `key_validated_at` records when the upstream provider last confirmed the key
--   - `migrated_from_plaintext` flags rows that must be reviewed/re-encrypted

-- Create table if it does not yet exist (fresh deployments)
CREATE TABLE IF NOT EXISTS donated_tokens (
  id                     TEXT    PRIMARY KEY,
  donor_user_id          TEXT    NOT NULL,
  provider               TEXT    NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'xai')),
  -- AES-256-GCM encrypted blob: base64(iv[12] || ciphertext || tag[16])
  -- Decryption requires TOKEN_ENCRYPTION_KEY env var
  encrypted_key          TEXT    NOT NULL,
  donated_at             INTEGER NOT NULL,
  active                 INTEGER NOT NULL DEFAULT 1,
  total_calls            INTEGER NOT NULL DEFAULT 0,
  last_used_at           INTEGER,
  -- Set when the upstream provider confirms the key is valid
  key_validated_at       INTEGER,
  -- Set to 1 for rows created before this migration (plaintext era)
  -- Operator must re-encrypt these rows and clear this flag before enabling them
  migrated_from_plaintext INTEGER NOT NULL DEFAULT 0
);

-- Index for pool-selection queries: pick active, validated keys per provider
CREATE INDEX IF NOT EXISTS idx_donated_tokens_provider_active
  ON donated_tokens (provider, active, key_validated_at);

-- Index for donor lookup (deduplication, stats)
CREATE INDEX IF NOT EXISTS idx_donated_tokens_donor
  ON donated_tokens (donor_user_id);

-- ── Handle existing tables from earlier ad-hoc schema ────────────────────────
--
-- If `donated_tokens` was created previously with a plaintext `api_key` column,
-- we add the new columns and immediately deactivate all legacy rows.
-- The `IF NOT EXISTS` on the CREATE TABLE above means it is a no-op for fresh DBs.
--
-- SQLite does not support DROP COLUMN in all versions, so we keep the legacy
-- `api_key` column in place and simply stop reading it. Operators should run a
-- separate one-time script to re-encrypt and clear `api_key` values.

-- Add encrypted_key column if table pre-exists without it
-- (SQLite silently ignores duplicate column errors when using "IF NOT EXISTS" syntax
--  via the application migration runner; raw SQLite requires a try/catch approach)
ALTER TABLE donated_tokens ADD COLUMN encrypted_key          TEXT;
ALTER TABLE donated_tokens ADD COLUMN key_validated_at       INTEGER;
ALTER TABLE donated_tokens ADD COLUMN migrated_from_plaintext INTEGER NOT NULL DEFAULT 0;

-- Mark all legacy rows (those without an encrypted_key) as inactive and flagged.
-- They will not be selected by the pool until re-encrypted by an operator.
UPDATE donated_tokens
   SET active = 0,
       migrated_from_plaintext = 1
 WHERE encrypted_key IS NULL;
