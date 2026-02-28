-- CreateEnum
CREATE TYPE "GeneratedRouteStatus" AS ENUM ('NEW', 'PLANNING', 'PLAN_REVIEW', 'CODING', 'TRANSPILING', 'CODE_REVIEW', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewPhase" AS ENUM ('PLAN_REVIEW', 'CODE_REVIEW');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "generated_routes" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "status" "GeneratedRouteStatus" NOT NULL DEFAULT 'NEW',
    "category" TEXT,
    "codespaceId" TEXT,
    "codespaceUrl" TEXT,
    "planJson" JSONB,
    "generatedCode" TEXT,
    "bridgemindTaskId" TEXT,
    "githubIssueNumber" INTEGER,
    "requestedById" TEXT,
    "creditsCost" INTEGER NOT NULL DEFAULT 36,
    "plannerAgentId" TEXT,
    "coderAgentId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "generationTimeMs" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "generated_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_reviews" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "reviewerAgentId" TEXT NOT NULL,
    "phase" "ReviewPhase" NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "feedback" TEXT,
    "score" DOUBLE PRECISION,
    "eloAtReview" INTEGER NOT NULL,
    "eloChange" INTEGER,
    "eloSettled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_reviewer_elos" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "agentModel" TEXT NOT NULL DEFAULT 'haiku',
    "elo" INTEGER NOT NULL DEFAULT 1200,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bestElo" INTEGER NOT NULL DEFAULT 1200,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_reviewer_elos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "generated_routes_slug_key" ON "generated_routes"("slug");

-- CreateIndex
CREATE INDEX "generated_routes_status_idx" ON "generated_routes"("status");

-- CreateIndex
CREATE INDEX "generated_routes_slug_idx" ON "generated_routes"("slug");

-- CreateIndex
CREATE INDEX "route_reviews_routeId_idx" ON "route_reviews"("routeId");

-- CreateIndex
CREATE INDEX "route_reviews_reviewerAgentId_idx" ON "route_reviews"("reviewerAgentId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_reviewer_elos_agentId_key" ON "agent_reviewer_elos"("agentId");

-- AddForeignKey
ALTER TABLE "generated_routes" ADD CONSTRAINT "generated_routes_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_reviews" ADD CONSTRAINT "route_reviews_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "generated_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
