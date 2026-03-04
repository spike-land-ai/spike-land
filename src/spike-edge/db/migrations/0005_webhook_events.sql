-- Webhook event idempotency table for Stripe deduplication

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  processed_at INTEGER NOT NULL
);
