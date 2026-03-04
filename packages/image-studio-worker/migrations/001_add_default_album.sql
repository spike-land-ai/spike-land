-- Migration: Add isDefault column to albums table
-- Run: wrangler d1 execute pixel-studio --file migrations/001_add_default_album.sql

ALTER TABLE albums ADD COLUMN isDefault INTEGER NOT NULL DEFAULT 0;

-- Create index for quick default album lookup
CREATE INDEX IF NOT EXISTS idx_albums_default ON albums(userId, isDefault);
