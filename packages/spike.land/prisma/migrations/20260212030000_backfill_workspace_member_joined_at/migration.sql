-- Backfill null joinedAt for workspace members (especially auto-created OWNER members)
-- Previously, ensurePersonalWorkspace and the credit manager safety net did not set joinedAt,
-- making these workspaces invisible to queries that filter on joinedAt IS NOT NULL.
UPDATE workspace_members
SET "joinedAt" = "createdAt"
WHERE "joinedAt" IS NULL AND role = 'OWNER';
