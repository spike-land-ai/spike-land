-- CreateEnum
CREATE TYPE "WorkflowPhase" AS ENUM ('BRAINSTORMING', 'PLANNING', 'IMPLEMENTING', 'REVIEWING', 'FINISHING', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "superpowers_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT,
    "projectName" TEXT,
    "branchName" TEXT,
    "currentPhase" "WorkflowPhase" NOT NULL DEFAULT 'BRAINSTORMING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "superpowers_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_transitions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "fromPhase" "WorkflowPhase" NOT NULL,
    "toPhase" "WorkflowPhase" NOT NULL,
    "skillName" TEXT,
    "durationMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_usage_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT NOT NULL,
    "agentId" TEXT,
    "skillName" TEXT NOT NULL,
    "category" TEXT,
    "outcome" TEXT NOT NULL DEFAULT 'in_progress',
    "durationMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_check_results" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "gateName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gate_check_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "superpowers_sessions_userId_idx" ON "superpowers_sessions"("userId");

-- CreateIndex
CREATE INDEX "superpowers_sessions_currentPhase_idx" ON "superpowers_sessions"("currentPhase");

-- CreateIndex
CREATE INDEX "superpowers_sessions_userId_currentPhase_idx" ON "superpowers_sessions"("userId", "currentPhase");

-- CreateIndex
CREATE INDEX "workflow_transitions_sessionId_idx" ON "workflow_transitions"("sessionId");

-- CreateIndex
CREATE INDEX "workflow_transitions_sessionId_createdAt_idx" ON "workflow_transitions"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "skill_usage_events_sessionId_idx" ON "skill_usage_events"("sessionId");

-- CreateIndex
CREATE INDEX "skill_usage_events_userId_idx" ON "skill_usage_events"("userId");

-- CreateIndex
CREATE INDEX "skill_usage_events_skillName_idx" ON "skill_usage_events"("skillName");

-- CreateIndex
CREATE INDEX "skill_usage_events_createdAt_idx" ON "skill_usage_events"("createdAt");

-- CreateIndex
CREATE INDEX "gate_check_results_sessionId_idx" ON "gate_check_results"("sessionId");

-- AddForeignKey
ALTER TABLE "superpowers_sessions" ADD CONSTRAINT "superpowers_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "superpowers_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_usage_events" ADD CONSTRAINT "skill_usage_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "superpowers_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_usage_events" ADD CONSTRAINT "skill_usage_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_check_results" ADD CONSTRAINT "gate_check_results_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "superpowers_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
