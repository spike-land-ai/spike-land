-- AlterTable
ALTER TABLE "bazdmeg_chat_messages" ADD COLUMN     "agentModel" TEXT,
ADD COLUMN     "route" TEXT,
ADD COLUMN     "toolsUsed" JSONB;

-- CreateTable
CREATE TABLE "state_machines" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "currentStates" TEXT[],
    "context" JSONB NOT NULL,
    "history" JSONB NOT NULL,
    "transitionLog" JSONB NOT NULL,
    "initialContext" JSONB NOT NULL,
    "shareToken" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "forkedFrom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "state_machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_messages" (
    "id" TEXT NOT NULL,
    "fromSessionId" TEXT,
    "fromUserId" TEXT,
    "toUserId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "sourceRoute" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "state_machines_shareToken_key" ON "state_machines"("shareToken");

-- CreateIndex
CREATE INDEX "state_machines_userId_idx" ON "state_machines"("userId");

-- CreateIndex
CREATE INDEX "state_machines_shareToken_idx" ON "state_machines"("shareToken");

-- CreateIndex
CREATE INDEX "direct_messages_toUserId_read_createdAt_idx" ON "direct_messages"("toUserId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "direct_messages_fromSessionId_idx" ON "direct_messages"("fromSessionId");

-- AddForeignKey
ALTER TABLE "state_machines" ADD CONSTRAINT "state_machines_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "state_machines" ADD CONSTRAINT "state_machines_forkedFrom_fkey" FOREIGN KEY ("forkedFrom") REFERENCES "state_machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
