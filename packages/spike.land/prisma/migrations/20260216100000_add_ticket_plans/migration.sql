-- CreateEnum
CREATE TYPE "TicketPlanStatus" AS ENUM ('UNPLANNED', 'PLANNING', 'PLAN_READY', 'APPROVED', 'SENT_TO_JULES', 'JULES_WORKING', 'JULES_REVIEW', 'BUILD_FIXING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ticket_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "githubIssueNumber" INTEGER NOT NULL,
    "githubIssueTitle" TEXT NOT NULL,
    "githubIssueUrl" TEXT NOT NULL,
    "githubIssueBody" TEXT,
    "status" "TicketPlanStatus" NOT NULL DEFAULT 'UNPLANNED',
    "planContent" TEXT,
    "planVersion" INTEGER NOT NULL DEFAULT 1,
    "approvedAt" TIMESTAMP(3),
    "julesSessionId" TEXT,
    "julesSessionUrl" TEXT,
    "julesLastState" TEXT,
    "julesLastChecked" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_chat_messages" (
    "id" TEXT NOT NULL,
    "ticketPlanId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'claude-opus-4-6',
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_plans_userId_status_idx" ON "ticket_plans"("userId", "status");

-- CreateIndex
CREATE INDEX "ticket_plans_status_idx" ON "ticket_plans"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_plans_userId_githubIssueNumber_key" ON "ticket_plans"("userId", "githubIssueNumber");

-- CreateIndex
CREATE INDEX "ticket_chat_messages_ticketPlanId_createdAt_idx" ON "ticket_chat_messages"("ticketPlanId", "createdAt");

-- AddForeignKey
ALTER TABLE "ticket_plans" ADD CONSTRAINT "ticket_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_chat_messages" ADD CONSTRAINT "ticket_chat_messages_ticketPlanId_fkey" FOREIGN KEY ("ticketPlanId") REFERENCES "ticket_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
