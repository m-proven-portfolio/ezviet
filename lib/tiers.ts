/**
 * User tier system for card access limits
 *
 * Tiers determine how many NEW cards a user can access per day.
 * All users can review cards they've already seen (unlimited).
 */

export type UserTier = 'guest' | 'free' | 'plus' | 'pro' | 'admin';

export interface TierConfig {
  name: string;
  dailyNewCards: number; // -1 = unlimited
  description: string;
}

/**
 * Tier configurations - easy to adjust limits here
 * dailyNewCards: -1 means unlimited
 */
export const TIER_CONFIGS: Record<UserTier, TierConfig> = {
  guest: {
    name: 'Guest',
    dailyNewCards: 6,
    description: 'Sign up for more cards!',
  },
  free: {
    name: 'Free',
    dailyNewCards: 12,
    description: 'Upgrade for unlimited access',
  },
  plus: {
    name: 'Plus',
    dailyNewCards: 30,
    description: 'Great for daily learners',
  },
  pro: {
    name: 'Pro',
    dailyNewCards: -1, // unlimited
    description: 'Unlimited learning',
  },
  admin: {
    name: 'Admin',
    dailyNewCards: -1, // unlimited
    description: 'Full access',
  },
};

/**
 * Get daily limit for a tier
 * Returns Infinity for unlimited tiers
 */
export function getDailyLimitForTier(tier: UserTier): number {
  const config = TIER_CONFIGS[tier];
  return config.dailyNewCards === -1 ? Infinity : config.dailyNewCards;
}

/**
 * Check if a tier has unlimited access
 */
export function isUnlimitedTier(tier: UserTier): boolean {
  return TIER_CONFIGS[tier].dailyNewCards === -1;
}

/**
 * Get the upgrade CTA message for a tier
 */
export function getUpgradeMessage(tier: UserTier): string {
  return TIER_CONFIGS[tier].description;
}

/**
 * Get the next tier for upgrade prompts
 */
export function getNextTier(currentTier: UserTier): UserTier | null {
  const tierOrder: UserTier[] = ['guest', 'free', 'plus', 'pro'];
  const currentIndex = tierOrder.indexOf(currentTier);

  if (currentIndex === -1 || currentIndex >= tierOrder.length - 1) {
    return null; // Already at highest tier or admin
  }

  return tierOrder[currentIndex + 1];
}

/**
 * Determine user tier from auth state
 * This is the single source of truth for tier determination
 */
export function determineUserTier(options: {
  isLoggedIn: boolean;
  isAdmin: boolean;
  subscriptionTier?: string | null;
  vipExpiresAt?: string | null;
}): UserTier {
  const { isLoggedIn, isAdmin, subscriptionTier, vipExpiresAt } = options;

  // Admin check first (overrides everything)
  if (isAdmin) {
    return 'admin';
  }

  // Not logged in = guest
  if (!isLoggedIn) {
    return 'guest';
  }

  // Check subscription tier with expiration
  if (subscriptionTier === 'pro' || subscriptionTier === 'plus') {
    // Check if VIP is still active
    if (isVipActive(subscriptionTier, vipExpiresAt)) {
      return subscriptionTier as UserTier;
    }
    // VIP expired - fall through to free tier
  }

  // Logged in but no active subscription = free
  return 'free';
}

/**
 * Check if VIP access is currently active
 * Returns true if tier is set and either no expiration or expiration is in the future
 */
export function isVipActive(
  subscriptionTier: string | null | undefined,
  vipExpiresAt: string | null | undefined
): boolean {
  if (!subscriptionTier) return false;
  if (!vipExpiresAt) return true; // No expiration = permanent VIP
  return new Date(vipExpiresAt) > new Date();
}

/**
 * Calculate new VIP expiration when extending
 * If user has active VIP, adds to existing expiration
 * Otherwise starts from now
 */
export function calculateVipExpiration(
  currentExpiresAt: string | null | undefined,
  durationDays: number
): Date {
  const now = new Date();
  // If current expiration is in the future, add to it; otherwise start from now
  const baseDate =
    currentExpiresAt && new Date(currentExpiresAt) > now
      ? new Date(currentExpiresAt)
      : now;
  return new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
}
