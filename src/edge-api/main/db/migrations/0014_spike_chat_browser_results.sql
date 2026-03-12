CREATE TABLE IF NOT EXISTS spike_chat_browser_results (
  tool_call_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  args_json TEXT NOT NULL,
  status TEXT NOT NULL,
  result_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_spike_chat_browser_results_session_status
  ON spike_chat_browser_results (session_id, status, updated_at DESC);
