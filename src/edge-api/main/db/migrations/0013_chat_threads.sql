CREATE TABLE IF NOT EXISTS chat_threads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  last_prompt_tokens INTEGER,
  last_completion_tokens INTEGER,
  last_total_tokens INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_user_updated
  ON chat_threads (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_rounds (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  input_role TEXT NOT NULL,
  input_content TEXT NOT NULL,
  assistant_blocks TEXT NOT NULL,
  assistant_text TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES chat_threads (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_rounds_thread_created
  ON chat_rounds (thread_id, created_at ASC);

CREATE TABLE IF NOT EXISTS chat_browser_results (
  tool_call_id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  args_json TEXT NOT NULL,
  status TEXT NOT NULL,
  result_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES chat_threads (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_browser_results_thread_status
  ON chat_browser_results (thread_id, status, updated_at DESC);
