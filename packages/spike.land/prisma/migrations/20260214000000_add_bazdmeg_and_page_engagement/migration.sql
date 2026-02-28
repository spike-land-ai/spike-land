-- CreateTable
CREATE TABLE "bazdmeg_chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "gitHubIssueUrl" TEXT,
    "gitHubIssueNum" INTEGER,
    "model" TEXT NOT NULL DEFAULT 'haiku',
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bazdmeg_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bazdmeg_faq_entries" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bazdmeg_faq_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_engagements" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "abVariant" TEXT,
    "scrollDepthMax" INTEGER NOT NULL DEFAULT 0,
    "timeOnPageMs" INTEGER NOT NULL DEFAULT 0,
    "sectionsViewed" TEXT[],
    "chatOpened" BOOLEAN NOT NULL DEFAULT false,
    "ctaClicked" TEXT,
    "faqExpanded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_engagements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bazdmeg_chat_messages_sessionId_createdAt_idx" ON "bazdmeg_chat_messages"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "bazdmeg_chat_messages_createdAt_idx" ON "bazdmeg_chat_messages"("createdAt");

-- CreateIndex
CREATE INDEX "bazdmeg_faq_entries_isPublished_sortOrder_idx" ON "bazdmeg_faq_entries"("isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "bazdmeg_faq_entries_category_idx" ON "bazdmeg_faq_entries"("category");

-- CreateIndex
CREATE INDEX "page_engagements_visitorId_page_idx" ON "page_engagements"("visitorId", "page");

-- CreateIndex
CREATE INDEX "page_engagements_page_createdAt_idx" ON "page_engagements"("page", "createdAt");
