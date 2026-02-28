-- GIN indexes for array column searches (hasSome queries)
CREATE INDEX IF NOT EXISTS "agent_learning_notes_libraries_gin" ON "agent_learning_notes" USING GIN ("libraries");
CREATE INDEX IF NOT EXISTS "agent_learning_notes_tags_gin" ON "agent_learning_notes" USING GIN ("tags");
CREATE INDEX IF NOT EXISTS "agent_learning_notes_error_patterns_gin" ON "agent_learning_notes" USING GIN ("errorPatterns");

-- Composite index for note retrieval: status + confidenceScore
CREATE INDEX IF NOT EXISTS "agent_learning_notes_status_confidence" ON "agent_learning_notes" ("status", "confidenceScore" DESC);

-- Functional index for case-insensitive trigger matching (findSimilarNote)
CREATE INDEX IF NOT EXISTS "agent_learning_notes_trigger_lower" ON "agent_learning_notes" (LOWER("trigger"));
