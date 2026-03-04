-- Migration: Marketplace revenue share (price_cents, tool_purchases ledger)
-- Created: 2026-03-04

ALTER TABLE registered_tools ADD COLUMN price_cents INTEGER DEFAULT 0;

CREATE TABLE tool_purchases (
  id TEXT PRIMARY KEY,
  tool_id TEXT NOT NULL,
  buyer_user_id TEXT NOT NULL,
  seller_user_id TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  seller_earnings_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_tool_purchases_buyer ON tool_purchases(buyer_user_id);
CREATE INDEX idx_tool_purchases_seller ON tool_purchases(seller_user_id);
CREATE INDEX idx_tool_purchases_tool ON tool_purchases(tool_id);
