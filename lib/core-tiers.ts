/**
 * EZViet Core Contributor Tier System
 *
 * Defines progression tiers for karaoke contributors.
 * Users earn points by playing karaoke sync and editing timing.
 */

export type CoreTier = 'contributor' | 'core_member' | 'core_champion' | 'core_legend';

interface TierConfig {
  tier: CoreTier;
  label: string;
  minPoints: number;
  color: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  icon: string; // Emoji for simple display
  description: string;
}

/**
 * Tier configurations with point thresholds and styling
 */
export const TIER_CONFIGS: Record<CoreTier, TierConfig> = {
  contributor: {
    tier: 'contributor',
    label: 'Contributor',
    minPoints: 0,
    color: 'emerald',
    bgGradient: 'from-emerald-500/20 to-green-500/20',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    icon: '🌱',
    description: 'Just getting started',
  },
  core_member: {
    tier: 'core_member',
    label: 'Core Member',
    minPoints: 500,
    color: 'blue',
    bgGradient: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/40',
    textColor: 'text-blue-400',
    icon: '⭐',
    description: 'Part of the team',
  },
  core_champion: {
    tier: 'core_champion',
    label: 'Core Champion',
    minPoints: 2000,
    color: 'purple',
    bgGradient: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/40',
    textColor: 'text-purple-400',
    icon: '🏆',
    description: 'Trusted contributor',
  },
  core_legend: {
    tier: 'core_legend',
    label: 'Core Legend',
    minPoints: 5000,
    color: 'yellow',
    bgGradient: 'from-yellow-500/20 to-orange-500/20',
    borderColor: 'border-yellow-500/40',
    textColor: 'text-yellow-400',
    icon: '👑',
    description: 'Elite status',
  },
};

/**
 * Ordered list of tiers from lowest to highest
 */
export const TIER_ORDER: CoreTier[] = [
  'contributor',
  'core_member',
  'core_champion',
  'core_legend',
];

/**
 * Get the tier for a given point total
 */
export function getCoreTier(points: number): CoreTier {
  // Iterate in reverse to find highest qualifying tier
  for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
    const tier = TIER_ORDER[i];
    if (points >= TIER_CONFIGS[tier].minPoints) {
      return tier;
    }
  }
  return 'contributor';
}

/**
 * Get the full configuration for a tier
 */
export function getCoreTierConfig(tier: CoreTier): TierConfig {
  return TIER_CONFIGS[tier];
}

/**
 * Get the next tier after the current one (or null if at max)
 */
export function getNextTier(currentTier: CoreTier): CoreTier | null {
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  if (currentIndex < TIER_ORDER.length - 1) {
    return TIER_ORDER[currentIndex + 1];
  }
  return null;
}

/**
 * Calculate progress to next tier (0-100)
 */
export function getTierProgress(points: number): {
  currentTier: CoreTier;
  nextTier: CoreTier | null;
  progress: number; // 0-100
  pointsToNext: number;
} {
  const currentTier = getCoreTier(points);
  const nextTier = getNextTier(currentTier);

  if (!nextTier) {
    // At max tier
    return {
      currentTier,
      nextTier: null,
      progress: 100,
      pointsToNext: 0,
    };
  }

  const currentMin = TIER_CONFIGS[currentTier].minPoints;
  const nextMin = TIER_CONFIGS[nextTier].minPoints;
  const range = nextMin - currentMin;
  const earned = points - currentMin;
  const progress = Math.min(100, Math.floor((earned / range) * 100));

  return {
    currentTier,
    nextTier,
    progress,
    pointsToNext: nextMin - points,
  };
}

/**
 * Check if user qualifies as "Core" (has earned at least 1 point)
 */
export function isCoreMember(points: number): boolean {
  return points > 0;
}
