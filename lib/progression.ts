/**
 * localStorage-based progression tracking
 * Tracks seen cards and refresh-cycle limits
 *
 * Key concepts:
 * - "seen" cards: Cards the user has viewed this cycle (can always review these)
 * - "new" cards: Cards the user hasn't seen yet (subject to cycle limit)
 * - Limits are tier-based (guest: 6, free: 12, plus: 30, pro/admin: unlimited)
 * - Cards refresh every 6 hours (not daily) for a better learning rhythm
 */

import { type UserTier, getDailyLimitForTier, isUnlimitedTier } from './tiers';

const STORAGE_KEY_REFRESH = 'ezviet_refresh'; // timestamp of current cycle start
const STORAGE_KEY_SEEN = 'ezviet_seen';
const STORAGE_KEY_COUNT = 'ezviet_count';

// Refresh interval in hours - cards reset every 6 hours
const REFRESH_INTERVAL_HOURS = 6;

// Legacy fallback - now tier-based
const DAILY_FREE_LIMIT = parseInt(
  process.env.NEXT_PUBLIC_DAILY_FREE_CARDS || '12',
  10
);

interface ProgressionState {
  refreshTimestamp: number;
  seen: string[];
  count: number;
}

/**
 * Get the start of the current refresh cycle
 * Cycles start at midnight, 6am, noon, and 6pm
 */
function getCurrentCycleStart(): number {
  const now = new Date();
  const hour = now.getHours();
  const cycleHour = Math.floor(hour / REFRESH_INTERVAL_HOURS) * REFRESH_INTERVAL_HOURS;

  const cycleStart = new Date(now);
  cycleStart.setHours(cycleHour, 0, 0, 0);

  return cycleStart.getTime();
}

/**
 * Get the timestamp when cards will next refresh
 */
export function getNextRefreshTime(): number {
  const currentCycle = getCurrentCycleStart();
  return currentCycle + (REFRESH_INTERVAL_HOURS * 60 * 60 * 1000);
}

function getState(): ProgressionState {
  if (typeof window === 'undefined') {
    return { refreshTimestamp: getCurrentCycleStart(), seen: [], count: 0 };
  }

  const storedRefresh = localStorage.getItem(STORAGE_KEY_REFRESH);
  const currentCycle = getCurrentCycleStart();

  // Reset if new cycle (stored timestamp is from a previous cycle)
  if (!storedRefresh || parseInt(storedRefresh, 10) < currentCycle) {
    localStorage.setItem(STORAGE_KEY_REFRESH, currentCycle.toString());
    localStorage.setItem(STORAGE_KEY_SEEN, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_COUNT, '0');
    return { refreshTimestamp: currentCycle, seen: [], count: 0 };
  }

  const seen = JSON.parse(localStorage.getItem(STORAGE_KEY_SEEN) || '[]');
  const count = parseInt(localStorage.getItem(STORAGE_KEY_COUNT) || '0', 10);

  return { refreshTimestamp: parseInt(storedRefresh, 10), seen, count };
}

function saveState(state: ProgressionState): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEY_REFRESH, state.refreshTimestamp.toString());
  localStorage.setItem(STORAGE_KEY_SEEN, JSON.stringify(state.seen));
  localStorage.setItem(STORAGE_KEY_COUNT, state.count.toString());
}

/**
 * Get list of seen card slugs for this cycle
 */
export function getSeenCards(): string[] {
  return getState().seen;
}

/**
 * Get count of cards viewed this cycle
 */
export function getTodayCount(): number {
  return getState().count;
}

/**
 * Get daily free limit
 */
export function getDailyLimit(): number {
  return DAILY_FREE_LIMIT;
}

/**
 * Check if user has reached daily limit
 */
export function hasReachedLimit(): boolean {
  return getState().count >= DAILY_FREE_LIMIT;
}

/**
 * Get remaining cards for today
 */
export function getRemainingCards(): number {
  return Math.max(0, DAILY_FREE_LIMIT - getState().count);
}

/**
 * Mark a card as seen
 */
export function markCardSeen(slug: string): void {
  const state = getState();

  if (!state.seen.includes(slug)) {
    state.seen.push(slug);
    state.count += 1;
    saveState({
      refreshTimestamp: state.refreshTimestamp,
      seen: state.seen,
      count: state.count,
    });
  }
}

/**
 * Check if a specific card has been seen this cycle
 */
export function hasSeenCard(slug: string): boolean {
  return getState().seen.includes(slug);
}

/**
 * Reset progression (for testing)
 */
export function resetProgression(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEY_REFRESH);
  localStorage.removeItem(STORAGE_KEY_SEEN);
  localStorage.removeItem(STORAGE_KEY_COUNT);
  // Clean up legacy key if it exists
  localStorage.removeItem('ezviet_date');
}

// ============================================
// TIER-AWARE FUNCTIONS
// ============================================

/**
 * Get daily limit for a specific tier
 */
export function getDailyLimitForUserTier(tier: UserTier): number {
  return getDailyLimitForTier(tier);
}

/**
 * Check if user has reached their tier's daily limit for NEW cards
 */
export function hasReachedLimitForTier(tier: UserTier): boolean {
  if (isUnlimitedTier(tier)) {
    return false; // Unlimited tiers never hit the limit
  }
  const limit = getDailyLimitForTier(tier);
  return getState().count >= limit;
}

/**
 * Get remaining NEW cards for a specific tier
 */
export function getRemainingCardsForTier(tier: UserTier): number {
  if (isUnlimitedTier(tier)) {
    return Infinity;
  }
  const limit = getDailyLimitForTier(tier);
  return Math.max(0, limit - getState().count);
}

/**
 * Check if user can access a specific card
 * - Always allows access to previously seen cards (review mode)
 * - For new cards, checks against tier limit
 */
export function canAccessCard(slug: string, tier: UserTier): boolean {
  // Always allow reviewing seen cards
  if (hasSeenCard(slug)) {
    return true;
  }

  // For new cards, check tier limit
  return !hasReachedLimitForTier(tier);
}

/**
 * Check if the user is at their limit but trying to see a new card
 * This is used to show the upgrade nudge
 */
export function shouldShowUpgradeNudge(slug: string, tier: UserTier): boolean {
  // Never show nudge for unlimited tiers
  if (isUnlimitedTier(tier)) {
    return false;
  }

  // Show nudge if: at limit AND trying to access a new (unseen) card
  return hasReachedLimitForTier(tier) && !hasSeenCard(slug);
}

// ============================================
// PROFILE SOURCE TRACKING (for bypass)
// ============================================

const STORAGE_KEY_PROFILE_SOURCE = 'ezviet_profile_source';

/**
 * Mark that the user is accessing content via a profile page
 * This allows bypassing the card limit for viral sharing
 */
export function setProfileSource(username: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY_PROFILE_SOURCE, username);
  }
}

/**
 * Get the profile source if set (returns username)
 */
export function getProfileSource(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_KEY_PROFILE_SOURCE);
}

/**
 * Clear the profile source
 */
export function clearProfileSource(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY_PROFILE_SOURCE);
  }
}

/**
 * Mark a card as seen without counting towards limit
 * Used when accessing via profile to enable bypass
 */
export function markCardAsSeenFromProfile(slug: string): void {
  if (typeof window === 'undefined') return;
  const state = getState();
  if (!state.seen.includes(slug)) {
    state.seen.push(slug);
    // NOTE: Don't increment count - this is the bypass!
    saveState(state);
  }
}
