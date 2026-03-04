-- Migration: Credit system tables
-- Created: 2026-03-04

CREATE TABLE IF NOT EXISTS credit_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,  -- positive=credit, negative=debit
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL,  -- 'daily_grant', 'usage', 'purchase', 'refund'
  description TEXT,
  reference_id TEXT,  -- e.g., proxy request ID or Stripe payment ID
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON credit_ledger(user_id, created_at);

CREATE TABLE IF NOT EXISTS credit_balances (
  user_id TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER NOT NULL DEFAULT 50,
  last_daily_grant TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
