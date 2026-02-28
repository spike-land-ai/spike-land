-- DropIndex
DROP INDEX "agent_learning_notes_error_patterns_gin";

-- DropIndex
DROP INDEX "agent_learning_notes_libraries_gin";

-- DropIndex
DROP INDEX "agent_learning_notes_status_confidence";

-- DropIndex
DROP INDEX "agent_learning_notes_tags_gin";

-- CreateTable
CREATE TABLE "codespace_sessions" (
    "id" TEXT NOT NULL,
    "codeSpace" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "transpiled" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "css" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "appId" TEXT,

    CONSTRAINT "codespace_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codespace_versions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "transpiled" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "css" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codespace_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "codespace_sessions_codeSpace_key" ON "codespace_sessions"("codeSpace");

-- CreateIndex
CREATE UNIQUE INDEX "codespace_sessions_appId_key" ON "codespace_sessions"("appId");

-- CreateIndex
CREATE INDEX "codespace_sessions_codeSpace_idx" ON "codespace_sessions"("codeSpace");

-- CreateIndex
CREATE INDEX "codespace_versions_sessionId_number_idx" ON "codespace_versions"("sessionId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "codespace_versions_sessionId_number_key" ON "codespace_versions"("sessionId", "number");

-- AddForeignKey
ALTER TABLE "codespace_sessions" ADD CONSTRAINT "codespace_sessions_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codespace_versions" ADD CONSTRAINT "codespace_versions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "codespace_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
