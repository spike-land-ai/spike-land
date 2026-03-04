CREATE TABLE analytics_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  metadata TEXT,
  client_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX idx_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_events_type ON analytics_events(event_type);
CREATE INDEX idx_events_source ON analytics_events(source);
