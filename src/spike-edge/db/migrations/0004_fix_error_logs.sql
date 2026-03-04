-- Fix error_logs schema: add metadata and client_id columns
-- The original 0001 migration only had 5 columns; the ingestion endpoint expects 7.

ALTER TABLE error_logs ADD COLUMN metadata TEXT;
ALTER TABLE error_logs ADD COLUMN client_id TEXT;

CREATE INDEX IF NOT EXISTS idx_error_logs_service ON error_logs(service_name, created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity, created_at);
