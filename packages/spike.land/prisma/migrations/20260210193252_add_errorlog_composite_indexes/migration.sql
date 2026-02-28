-- DropIndex
DROP INDEX IF EXISTS "error_logs_environment_idx";

-- DropIndex
DROP INDEX IF EXISTS "error_logs_errorType_idx";

-- DropIndex
DROP INDEX IF EXISTS "error_logs_timestamp_idx";

-- CreateIndex
CREATE INDEX "error_logs_environment_timestamp_idx" ON "error_logs"("environment", "timestamp");

-- CreateIndex
CREATE INDEX "error_logs_errorType_timestamp_idx" ON "error_logs"("errorType", "timestamp");
