-- AlterTable
ALTER TABLE "marketing_accounts" ALTER COLUMN "accessToken" DROP NOT NULL,
ADD COLUMN "accessTokenEncrypted" TEXT,
ADD COLUMN "refreshTokenEncrypted" TEXT;

-- AlterTable
ALTER TABLE "workflow_webhooks" ADD COLUMN "secretEncrypted" TEXT;

-- Invalidate existing webhooks by clearing secretHash (breaking change as requested)
UPDATE "workflow_webhooks" SET "secretHash" = NULL WHERE "secretHash" IS NOT NULL;

-- CreateTable (was missing from previous migrations)
CREATE TABLE IF NOT EXISTS "ai_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT,
    "tokenEncrypted" TEXT,
    "config" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ai_providers_name_key" ON "ai_providers"("name");
