-- Spike API v1: thread history + donated token pool

CREATE TABLE IF NOT EXISTS spike_api_threads (
  thread_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (thread_id, seq)
);

CREATE INDEX IF NOT EXISTS idx_spike_api_threads_user ON spike_api_threads(user_id, thread_id);

-- Community-donated API keys for multiplexing
CREATE TABLE IF NOT EXISTS donated_tokens (
  id TEXT PRIMARY KEY,
  donor_user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  donated_at INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  total_calls INTEGER NOT NULL DEFAULT 0,
  last_used_at INTEGER,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_donated_tokens_provider ON donated_tokens(provider, active);
CREATE INDEX IF NOT EXISTS idx_donated_tokens_donor ON donated_tokens(donor_user_id);
