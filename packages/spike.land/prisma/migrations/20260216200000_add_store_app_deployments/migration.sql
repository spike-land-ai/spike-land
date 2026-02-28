-- CreateEnum
CREATE TYPE "StoreAppCategory" AS ENUM ('CREATIVE', 'PRODUCTIVITY', 'DEVELOPER', 'COMMUNICATION', 'LIFESTYLE', 'AI_AGENTS');

-- CreateEnum
CREATE TYPE "StoreAppStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StoreAppDeploymentStatus" AS ENUM ('DRAFT', 'DEPLOYING', 'LIVE', 'FAILED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "store_app_listings" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "longDescription" TEXT,
    "category" "StoreAppCategory" NOT NULL,
    "icon" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "screenshotUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "appUrl" TEXT,
    "mcpServerUrl" TEXT,
    "status" "StoreAppStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isFirstParty" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "toolCount" INTEGER NOT NULL DEFAULT 0,
    "installCount" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "cardVariant" TEXT NOT NULL DEFAULT 'blue',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "submittedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_app_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_app_tools" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_app_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_app_features" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_app_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_app_deployments" (
    "id" TEXT NOT NULL,
    "appSlug" TEXT NOT NULL,
    "baseCodespaceId" TEXT NOT NULL,
    "status" "StoreAppDeploymentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_app_deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_app_variants" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "variantLabel" TEXT NOT NULL,
    "codespaceId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "screenshotUrl" TEXT,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_app_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_app_listings_slug_key" ON "store_app_listings"("slug");

-- CreateIndex
CREATE INDEX "store_app_listings_status_sortOrder_idx" ON "store_app_listings"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "store_app_listings_status_category_sortOrder_idx" ON "store_app_listings"("status", "category", "sortOrder");

-- CreateIndex
CREATE INDEX "store_app_listings_slug_idx" ON "store_app_listings"("slug");

-- CreateIndex
CREATE INDEX "store_app_tools_appId_idx" ON "store_app_tools"("appId");

-- CreateIndex
CREATE INDEX "store_app_features_appId_sortOrder_idx" ON "store_app_features"("appId", "sortOrder");

-- CreateIndex
CREATE INDEX "store_app_deployments_appSlug_status_idx" ON "store_app_deployments"("appSlug", "status");

-- CreateIndex
CREATE INDEX "store_app_variants_deploymentId_idx" ON "store_app_variants"("deploymentId");

-- CreateIndex
CREATE INDEX "store_app_variants_codespaceId_idx" ON "store_app_variants"("codespaceId");

-- AddForeignKey
ALTER TABLE "store_app_listings" ADD CONSTRAINT "store_app_listings_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_app_tools" ADD CONSTRAINT "store_app_tools_appId_fkey" FOREIGN KEY ("appId") REFERENCES "store_app_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_app_features" ADD CONSTRAINT "store_app_features_appId_fkey" FOREIGN KEY ("appId") REFERENCES "store_app_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_app_deployments" ADD CONSTRAINT "store_app_deployments_appSlug_fkey" FOREIGN KEY ("appSlug") REFERENCES "store_app_listings"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_app_variants" ADD CONSTRAINT "store_app_variants_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "store_app_deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
