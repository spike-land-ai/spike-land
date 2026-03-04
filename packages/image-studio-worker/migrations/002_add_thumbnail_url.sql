-- Migration: Add thumbnailUrl column to images table
-- Run: wrangler d1 execute pixel-studio --file migrations/002_add_thumbnail_url.sql

ALTER TABLE images ADD COLUMN thumbnailUrl TEXT;
