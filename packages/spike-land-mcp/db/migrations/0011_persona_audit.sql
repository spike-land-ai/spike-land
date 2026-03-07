-- Persona audit batch tracking
CREATE TABLE persona_audit_batches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_personas INTEGER NOT NULL DEFAULT 16,
  completed_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);
CREATE INDEX idx_pab_user ON persona_audit_batches(user_id);

-- Individual persona audit results
CREATE TABLE persona_audit_results (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  persona_slug TEXT NOT NULL,
  agent_id TEXT,
  ux_score INTEGER NOT NULL,
  content_relevance INTEGER NOT NULL,
  cta_compelling INTEGER NOT NULL,
  recommended_apps_relevant INTEGER NOT NULL,
  would_sign_up INTEGER NOT NULL,
  blockers TEXT NOT NULL DEFAULT '',
  highlights TEXT NOT NULL DEFAULT '',
  accessibility_issues TEXT NOT NULL DEFAULT '[]',
  broken_links TEXT NOT NULL DEFAULT '[]',
  performance_notes TEXT NOT NULL DEFAULT '',
  raw_plan_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_par_batch ON persona_audit_results(batch_id);
CREATE INDEX idx_par_persona ON persona_audit_results(persona_slug);
