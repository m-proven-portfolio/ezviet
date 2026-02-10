-- Add VIP subscription columns to profiles table
-- Allows admins to grant time-limited Plus/Pro access to users

-- Add subscription tier column (null = free, 'plus' or 'pro' = VIP)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT
  CHECK (subscription_tier IS NULL OR subscription_tier IN ('plus', 'pro'));

-- Add VIP expiration timestamp (null = no expiration / permanent for admins)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMPTZ;

-- Create index for efficiently finding active VIP users
CREATE INDEX IF NOT EXISTS idx_profiles_vip_active
  ON profiles(subscription_tier, vip_expires_at)
  WHERE subscription_tier IS NOT NULL;

-- Documentation
COMMENT ON COLUMN profiles.subscription_tier IS 'VIP tier: plus (30 cards/cycle) or pro (unlimited). NULL = free tier.';
COMMENT ON COLUMN profiles.vip_expires_at IS 'When VIP access expires. NULL = permanent (for admins) or no VIP.';
