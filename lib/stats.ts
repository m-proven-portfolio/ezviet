/**
 * Unified Stats System
 * Single source of truth for all user and admin statistics
 *
 * Key concepts:
 * - All stats derived from `learning_history` table (authenticated users)
 * - Global view counts from `cards.view_count` (all visitors)
 * - Streaks calculated based on daily activity
 * - Mastery based on `times_viewed` threshold (5+ views = mastered)
 */

// ============================================
// TYPES
// ============================================

export interface UserStats {
  cardsViewed: number;      // Unique cards seen (all-time)
  cardsMastered: number;    // Cards with mastery_level >= 5
  currentStreak: number;    // Consecutive days active
  longestStreak: number;    // Best streak ever
  lastActiveAt: Date | null;
}

export interface AdminStats {
  totalCards: number;
  totalCategories: number;
  totalViews: number;       // Sum of all cards.view_count
  totalUsers: number;       // Count of profiles
}

export interface CardStats {
  viewCount: number;        // Global views
  uniqueViewers: number;    // Distinct users who viewed
}

// ============================================
// CONSTANTS
// ============================================

// A card is "mastered" after being viewed this many times
export const MASTERY_THRESHOLD = 5;

// Streak grace period - hours after midnight before streak breaks
// (Allows late-night users to not lose streak at exactly midnight)
export const STREAK_GRACE_HOURS = 4;

// ============================================
// STREAK CALCULATION
// ============================================

/**
 * Calculate streak from an array of activity dates
 *
 * This is the core streak algorithm:
 * - Groups activity by calendar day
 * - Counts consecutive days backwards from today
 * - Today's activity counts toward current streak
 *
 * @param activityDates - Array of timestamps when user was active
 * @returns { currentStreak, longestStreak }
 */
export function calculateStreaks(activityDates: Date[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (activityDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Convert to unique day strings (YYYY-MM-DD) and sort descending
  const dayStrings = activityDates.map(date => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const uniqueDays = Array.from(new Set(dayStrings)).sort().reverse();

  if (uniqueDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get today's date string
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Get yesterday's date string
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // Calculate current streak
  let currentStreak = 0;
  const mostRecentDay = uniqueDays[0];

  // Streak only counts if active today or yesterday
  if (mostRecentDay === today || mostRecentDay === yesterdayStr) {
    // Count consecutive days backwards
    const expectedDate = new Date(mostRecentDay);

    for (const dayStr of uniqueDays) {
      const expectedStr = `${expectedDate.getFullYear()}-${String(expectedDate.getMonth() + 1).padStart(2, '0')}-${String(expectedDate.getDate()).padStart(2, '0')}`;

      if (dayStr === expectedStr) {
        currentStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak by finding max consecutive run
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 0; i < uniqueDays.length - 1; i++) {
    const current = new Date(uniqueDays[i]);
    const next = new Date(uniqueDays[i + 1]);

    // Check if dates are consecutive (current should be 1 day after next since sorted descending)
    const diffDays = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}

// ============================================
// MASTERY CALCULATION
// ============================================

/**
 * Check if a card is considered "mastered" based on view count
 */
export function isMastered(timesViewed: number): boolean {
  return timesViewed >= MASTERY_THRESHOLD;
}

/**
 * Calculate mastery level (0-5) based on times viewed
 * - 0 views = level 0
 * - 1 view = level 1
 * - 2 views = level 2
 * - 3 views = level 3
 * - 4 views = level 4
 * - 5+ views = level 5 (mastered)
 */
export function getMasteryLevel(timesViewed: number): number {
  return Math.min(timesViewed, 5);
}

// ============================================
// STAT FORMATTING
// ============================================

/**
 * Format large numbers with K/M suffixes
 * 1234 -> "1.2K"
 * 1234567 -> "1.2M"
 */
export function formatStatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

// ============================================
// DEFAULT EMPTY STATS
// ============================================

export const EMPTY_USER_STATS: UserStats = {
  cardsViewed: 0,
  cardsMastered: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveAt: null,
};

export const EMPTY_ADMIN_STATS: AdminStats = {
  totalCards: 0,
  totalCategories: 0,
  totalViews: 0,
  totalUsers: 0,
};
