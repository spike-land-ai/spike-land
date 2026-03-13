-- Aether Personal Knowledge Graph (PKG) tables
-- Phase 1: Edge-side PKG before on-device exists

-- Nodes in the personal knowledge graph
CREATE TABLE IF NOT EXISTS pkg_nodes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  node_type TEXT NOT NULL CHECK(node_type IN ('skill', 'decision', 'goal', 'belief', 'event', 'health_signal')),
  label TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  confidence REAL NOT NULL DEFAULT 0.5,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_pkg_nodes_user ON pkg_nodes(user_id, node_type, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_pkg_nodes_active ON pkg_nodes(user_id, deleted_at) WHERE deleted_at IS NULL;

-- Edges connecting nodes in the PKG
CREATE TABLE IF NOT EXISTS pkg_edges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_node_id TEXT NOT NULL REFERENCES pkg_nodes(id),
  target_node_id TEXT NOT NULL REFERENCES pkg_nodes(id),
  edge_type TEXT NOT NULL CHECK(edge_type IN ('learned', 'decided', 'caused', 'holds', 'pursues', 'correlates')),
  weight REAL NOT NULL DEFAULT 1.0,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pkg_edges_user ON pkg_edges(user_id, edge_type);
CREATE INDEX IF NOT EXISTS idx_pkg_edges_source ON pkg_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_pkg_edges_target ON pkg_edges(target_node_id);

-- Append-only event log for temporal queries
CREATE TABLE IF NOT EXISTS pkg_event_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  node_id TEXT NOT NULL REFERENCES pkg_nodes(id),
  event_type TEXT NOT NULL,
  snapshot_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pkg_event_log_node ON pkg_event_log(user_id, node_id, created_at DESC);
