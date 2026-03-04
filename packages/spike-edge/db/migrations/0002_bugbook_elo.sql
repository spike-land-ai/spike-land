-- Bugbook + ELO system tables

-- Error Logs: structured error collection from all services
CREATE TABLE error_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  service_name TEXT NOT NULL,
  error_code TEXT,
  message TEXT NOT NULL,
  stack_trace TEXT,
  metadata TEXT DEFAULT '{}',
  client_id TEXT,
  severity TEXT NOT NULL DEFAULT 'error',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX idx_error_logs_service ON error_logs(service_name);
CREATE INDEX idx_error_logs_created ON error_logs(created_at);
CREATE INDEX idx_error_logs_code ON error_logs(error_code);

-- Bugs: tracked issues with ELO ranking
CREATE TABLE bugs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'CANDIDATE',
  severity TEXT NOT NULL DEFAULT 'medium',
  elo INTEGER NOT NULL DEFAULT 1200,
  report_count INTEGER NOT NULL DEFAULT 0,
  first_seen_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  last_seen_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  fixed_at INTEGER,
  metadata TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX idx_bugs_status ON bugs(status);
CREATE INDEX idx_bugs_elo ON bugs(elo DESC);
CREATE INDEX idx_bugs_category ON bugs(category);

-- Bug Reports: individual user reports linked to bugs
CREATE TABLE bug_reports (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  bug_id TEXT NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  description TEXT NOT NULL,
  reproduction_steps TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  metadata TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX idx_bug_reports_bug ON bug_reports(bug_id);
CREATE INDEX idx_bug_reports_reporter ON bug_reports(reporter_id);

-- Bug ELO History: audit trail for bug ranking changes
CREATE TABLE bug_elo_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  bug_id TEXT NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
  old_elo INTEGER NOT NULL,
  new_elo INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  opponent_bug_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX idx_bug_elo_history_bug ON bug_elo_history(bug_id);

-- User ELO: reputation scores for users and agents
CREATE TABLE user_elo (
  user_id TEXT PRIMARY KEY,
  elo INTEGER NOT NULL DEFAULT 1200,
  event_count INTEGER NOT NULL DEFAULT 0,
  daily_gains INTEGER NOT NULL DEFAULT 0,
  daily_reset_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  tier TEXT NOT NULL DEFAULT 'pro',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- ELO Events: audit trail for user ELO changes
CREATE TABLE elo_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  delta INTEGER NOT NULL,
  old_elo INTEGER NOT NULL,
  new_elo INTEGER NOT NULL,
  reference_id TEXT,
  metadata TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX idx_elo_events_user ON elo_events(user_id);
CREATE INDEX idx_elo_events_type ON elo_events(event_type);
CREATE INDEX idx_elo_events_created ON elo_events(created_at);

-- Blog Comments: inline comments on blog articles at specific positions
CREATE TABLE blog_comments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  article_slug TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  anchor_text TEXT,
  position_selector TEXT,
  parent_id TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX idx_blog_comments_article ON blog_comments(article_slug);
CREATE INDEX idx_blog_comments_user ON blog_comments(user_id);
CREATE INDEX idx_blog_comments_parent ON blog_comments(parent_id);
CREATE INDEX idx_blog_comments_score ON blog_comments(score DESC);

-- Blog Comment Votes: track who voted on what (prevent double-voting)
CREATE TABLE blog_comment_votes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  comment_id TEXT NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  vote INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE(comment_id, user_id)
);
CREATE INDEX idx_blog_comment_votes_comment ON blog_comment_votes(comment_id);
CREATE INDEX idx_blog_comment_votes_user ON blog_comment_votes(user_id);
