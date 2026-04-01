-- Add Creem.io payment provider columns to subscriptions table
ALTER TABLE subscriptions ADD COLUMN creem_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN creem_subscription_id TEXT;
