# AlbumImage Index Optimization

## Summary

Added compound index on `(albumId, addedAt)` to optimize chronological album
queries.

## Current Index Structure

The `AlbumImage` model now has the following indexes:

```prisma
model AlbumImage {
  id        String        @id @default(cuid())
  albumId   String
  imageId   String
  sortOrder Int           @default(0)
  addedAt   DateTime      @default(now())
  album     Album         @relation(fields: [albumId], references: [id], onDelete: Cascade)
  image     EnhancedImage @relation(fields: [imageId], references: [id], onDelete: Cascade)

  @@unique([albumId, imageId])         // Prevent duplicate image in same album
  @@index([albumId, sortOrder])        // Album queries with custom ordering
  @@index([imageId])                   // Find albums containing image
  @@index([albumId, addedAt])          // Album queries with chronological ordering
  @@map("album_images")
}
```

## Index Performance Benefits

### 1. `@@unique([albumId, imageId])` - Uniqueness Constraint

**Query Pattern:**

```sql
INSERT INTO album_images (albumId, imageId, ...) VALUES (?, ?, ...)
```

**Benefit:** Enforces data integrity at database level, prevents duplicate
entries.

### 2. `@@index([albumId, sortOrder])` - Custom Sort Order Queries

**Query Pattern:**

```sql
SELECT * FROM album_images
WHERE albumId = ?
ORDER BY sortOrder ASC
```

**Use Case:** User-defined image ordering in albums (drag-and-drop reordering)
**Performance:** O(log n) lookup + sequential scan of results (already sorted)

### 3. `@@index([imageId])` - Reverse Lookup

**Query Pattern:**

```sql
SELECT * FROM album_images
WHERE imageId = ?
```

**Use Case:** Find all albums containing a specific image **Performance:** O(log
n) lookup

### 4. `@@index([albumId, addedAt])` - Chronological Queries (NEW)

**Query Pattern:**

```sql
SELECT * FROM album_images
WHERE albumId = ?
ORDER BY addedAt DESC
```

**Use Case:** Show recently added images, activity timeline, "Added on" sorting
**Performance:** O(log n) lookup + sequential scan of results (already sorted)

## Migration Instructions

### Generate Migration (Development)

```bash
# Generate migration file
yarn prisma migrate dev --name add_album_image_chronological_index

# This will:
# 1. Create migration SQL in prisma/migrations/
# 2. Apply migration to development database
# 3. Regenerate Prisma Client
```

### Apply Migration (Production)

```bash
# Production deployment
yarn prisma migrate deploy

# This applies all pending migrations
```

### Expected Migration SQL

```sql
-- CreateIndex
CREATE INDEX "album_images_albumId_addedAt_idx" ON "album_images"("albumId", "addedAt");
```

## Query Execution Plan Analysis

### Before Index (Table Scan with Sort)

```sql
EXPLAIN ANALYZE
SELECT * FROM album_images
WHERE albumId = 'abc123'
ORDER BY addedAt DESC;
```

**Without Index:**

```
Seq Scan on album_images  (cost=0.00..XX.XX rows=N width=XX)
  Filter: (albumId = 'abc123')
Sort  (cost=YY.YY..YY.YY rows=N width=XX)
  Sort Key: addedAt DESC
```

**Performance:** O(n) scan + O(n log n) sort

### After Index (Index Scan)

```
Index Scan using album_images_albumId_addedAt_idx on album_images
  (cost=0.XX..XX.XX rows=N width=XX)
  Index Cond: (albumId = 'abc123')
```

**Performance:** O(log n) + O(k) where k = number of results

## Performance Impact Estimates

| Album Size  | Before (ms) | After (ms) | Improvement |
| ----------- | ----------- | ---------- | ----------- |
| 10 images   | 1-2 ms      | <1 ms      | 50%         |
| 100 images  | 5-10 ms     | 1-2 ms     | 80%         |
| 1000 images | 50-100 ms   | 2-5 ms     | 95%         |
| 10k images  | 500-1000 ms | 5-10 ms    | 99%         |

## Storage Overhead

- **Index Size:** ~16 bytes per row (8 bytes for albumId cuid, 8 bytes for
  timestamp)
- **For 100,000 images:** ~1.6 MB additional storage
- **Trade-off:** Minimal storage cost for significant query performance gain

## Application Code Impact

No application code changes required. Queries automatically use the index when
appropriate.

### Example Queries That Will Benefit

```typescript
// Next.js Server Action or API Route
import { prisma } from "@/lib/prisma";

// 1. Get album images chronologically
const recentImages = await prisma.albumImage.findMany({
  where: { albumId: albumId },
  orderBy: { addedAt: "desc" },
  include: { image: true },
});

// 2. Get album images with custom sort order
const sortedImages = await prisma.albumImage.findMany({
  where: { albumId: albumId },
  orderBy: { sortOrder: "asc" },
  include: { image: true },
});

// 3. Find albums containing an image
const albumsWithImage = await prisma.albumImage.findMany({
  where: { imageId: imageId },
  include: { album: true },
});
```

## Index Maintenance

PostgreSQL automatically maintains indexes. No manual maintenance required.

### Monitoring Index Usage

```sql
-- Check index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'album_images'
ORDER BY idx_scan DESC;
```

## Rollback Instructions

If needed, to remove the index:

```sql
DROP INDEX "album_images_albumId_addedAt_idx";
```

Or create a migration:

```bash
yarn prisma migrate dev --name remove_album_image_chronological_index
```

## References

- [Prisma Index Documentation](https://www.prisma.io/docs/concepts/components/prisma-schema/indexes)
- [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [Query Performance Optimization](https://www.postgresql.org/docs/current/using-explain.html)
