-- Token revocation support: add revoked_at column to oauth_access_tokens
ALTER TABLE oauth_access_tokens ADD COLUMN revoked_at INTEGER;
