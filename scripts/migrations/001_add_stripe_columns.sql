-- Add Stripe columns to profiles table
-- Run this against your Supabase database

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Add index for lookup by stripe_customer_id (used in webhook handler)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON profiles(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- Add email column if it doesn't exist (for card-paying users who don't have wallets)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS idx_profiles_email
ON profiles(email)
WHERE email IS NOT NULL;

-- Add stripe fields to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'crypto';
