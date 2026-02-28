-- CreateEnum
CREATE TYPE "SyncSource" AS ENUM ('BRIDGEMIND', 'GITHUB');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('IDLE', 'SYNCING', 'ERROR');

-- CreateEnum
CREATE TYPE "SyncEventType" AS ENUM ('ITEM_CREATED', 'ITEM_UPDATED', 'ITEM_DELETED', 'SYNC_COMPLETED', 'SYNC_FAILED');

-- CreateTable
CREATE TABLE "SyncState" (
    "id" TEXT NOT NULL,
    "source" "SyncSource" NOT NULL DEFAULT 'BRIDGEMIND',
    "status" "SyncStatus" NOT NULL DEFAULT 'IDLE',
    "lastSuccessfulSync" TIMESTAMP(3),
    "lastAttemptedSync" TIMESTAMP(3),
    "consecutiveErrors" INTEGER NOT NULL DEFAULT 0,
    "syncCursor" TEXT,
    "itemsSynced" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncItemMapping" (
    "id" TEXT NOT NULL,
    "bridgemindId" TEXT NOT NULL,
    "githubIssueNumber" INTEGER NOT NULL,
    "githubIssueId" TEXT,
    "githubProjectItemId" TEXT,
    "bridgemindVersion" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncItemMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncEvent" (
    "id" TEXT NOT NULL,
    "eventType" "SyncEventType" NOT NULL,
    "source" "SyncSource" NOT NULL DEFAULT 'BRIDGEMIND',
    "itemId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_learning_notes" (
    "id" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "lesson" TEXT NOT NULL,
    "libraries" TEXT[],
    "errorPatterns" TEXT[],
    "tags" TEXT[],
    "helpCount" INTEGER NOT NULL DEFAULT 0,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "status" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "sourceSlug" TEXT,
    "sourceError" TEXT,
    "sourceFix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_learning_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_attempts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "iterations" INTEGER NOT NULL,
    "totalDurationMs" INTEGER NOT NULL,
    "notesApplied" TEXT[],
    "errors" JSONB[],
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "cachedTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyncItemMapping_bridgemindId_key" ON "SyncItemMapping"("bridgemindId");

-- CreateIndex
CREATE INDEX "SyncItemMapping_bridgemindId_idx" ON "SyncItemMapping"("bridgemindId");

-- CreateIndex
CREATE INDEX "SyncItemMapping_githubIssueNumber_idx" ON "SyncItemMapping"("githubIssueNumber");

-- CreateIndex
CREATE INDEX "SyncEvent_eventType_idx" ON "SyncEvent"("eventType");

-- CreateIndex
CREATE INDEX "SyncEvent_createdAt_idx" ON "SyncEvent"("createdAt");

-- CreateIndex
CREATE INDEX "agent_learning_notes_status_idx" ON "agent_learning_notes"("status");

-- CreateIndex
CREATE INDEX "agent_learning_notes_triggerType_idx" ON "agent_learning_notes"("triggerType");

-- CreateIndex
CREATE INDEX "generation_attempts_slug_idx" ON "generation_attempts"("slug");

-- CreateIndex
CREATE INDEX "generation_attempts_createdAt_idx" ON "generation_attempts"("createdAt");
