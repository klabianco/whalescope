-- Push notification subscriptions for WhaleScope Pro users
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address text NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for looking up by wallet
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_wallet ON push_subscriptions(wallet_address);

-- Index for endpoint uniqueness lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
