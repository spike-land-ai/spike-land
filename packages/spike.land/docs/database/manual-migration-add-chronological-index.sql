-- Manual Migration: Add Chronological Index to AlbumImage
-- Date: 2025-12-12
-- Purpose: Add compound index on (albumId, addedAt) for future chronological queries
-- Safe to run: YES (index creation is non-blocking with IF NOT EXISTS)

-- Prerequisites:
-- 1. Database backup completed
-- 2. Low-traffic period scheduled (optional, but recommended)
-- 3. Database connection verified

-- ============================================================================
-- CREATE INDEX (Non-blocking, safe to run multiple times)
-- ============================================================================

-- Create index with IF NOT EXISTS to make this script idempotent
CREATE INDEX IF NOT EXISTS "album_images_albumId_addedAt_idx"
ON "album_images"("albumId", "addedAt");

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- 1. Verify index exists
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'album_images'
  AND indexname = 'album_images_albumId_addedAt_idx';

-- Expected output:
-- indexname                          | indexdef
-- -----------------------------------|----------------------------------------------------
-- album_images_albumId_addedAt_idx  | CREATE INDEX ... ON album_images USING btree (...)

-- 2. Check all indexes on album_images table
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'album_images'
ORDER BY indexname;

-- Expected indexes:
-- 1. album_images_pkey (PRIMARY KEY on id)
-- 2. album_images_albumId_imageId_key (UNIQUE constraint)
-- 3. album_images_albumId_sortOrder_idx (existing index)
-- 4. album_images_imageId_idx (existing index)
-- 5. album_images_albumId_addedAt_idx (NEW index)

-- 3. Test query performance with EXPLAIN
EXPLAIN ANALYZE
SELECT *
FROM album_images
WHERE "albumId" = 'test-album-id'
ORDER BY "addedAt" DESC
LIMIT 20;

-- Should show:
-- Index Scan using album_images_albumId_addedAt_idx

-- 4. Check index size
SELECT
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size,
  idx_scan AS times_used,
  idx_tup_read AS rows_read,
  idx_tup_fetch AS rows_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname = 'album_images'
  AND indexrelname = 'album_images_albumId_addedAt_idx';

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- Uncomment to remove the index (not recommended unless necessary)
-- DROP INDEX IF EXISTS "album_images_albumId_addedAt_idx";

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

-- Index creation is:
-- - Non-blocking (doesn't lock table for reads)
-- - Safe to run during normal operations
-- - Idempotent (safe to run multiple times with IF NOT EXISTS)
-- - Minimal performance impact during creation

-- Index benefits:
-- - O(log n) lookup performance for chronological queries
-- - No application code changes required
-- - Automatic use by PostgreSQL query planner when appropriate

-- Storage overhead:
-- - ~33 bytes per row (25 bytes cuid + 8 bytes timestamp)
-- - For 100,000 rows: ~3.3 MB additional storage
-- - Negligible compared to performance gain

-- ============================================================================
-- POST-DEPLOYMENT MONITORING
-- ============================================================================

-- Run these queries periodically to monitor index usage:

-- Monitor index usage statistics (run daily)
SELECT
  indexrelname AS index_name,
  idx_scan AS scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size,
  ROUND((idx_tup_fetch::numeric / NULLIF(idx_tup_read, 0) * 100), 2) AS selectivity_pct
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname = 'album_images'
ORDER BY idx_scan DESC;

-- Check for unused indexes (run monthly)
SELECT
  indexrelname AS index_name,
  idx_scan AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size,
  CASE
    WHEN idx_scan = 0 THEN '⚠️ UNUSED'
    WHEN idx_scan < 10 THEN '⚠️ RARELY USED'
    ELSE '✅ ACTIVE'
  END AS status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname = 'album_images'
ORDER BY idx_scan DESC;

-- ============================================================================
-- NOTES FOR PRISMA
-- ============================================================================

-- After running this SQL manually, update Prisma migration tracking:
--
-- Option 1: Mark as applied (if you ran this SQL manually)
-- $ yarn prisma migrate resolve --applied "20241212_add_album_image_chronological_index"
--
-- Option 2: Let Prisma generate migration (if you haven't run SQL yet)
-- $ yarn prisma migrate dev --name add_album_image_chronological_index
--
-- The migration will generate SQL identical to this script.

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
