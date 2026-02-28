-- AlterTable
ALTER TABLE "codespace_sessions" ADD COLUMN     "messages" JSONB,
ADD COLUMN     "requiresReRender" BOOLEAN NOT NULL DEFAULT false;
