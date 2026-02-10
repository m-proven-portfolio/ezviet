/**
 * LRC Sync Utilities
 *
 * Functions for the crowdsourced LRC contribution system:
 * - Accuracy calculation
 * - Points and scoring
 * - Consensus detection
 * - LRC merging
 */

import { parseLrc, type LrcLine } from './lrc-parser';

// ============================================================================
// Types
// ============================================================================

/** A single timing entry recorded by a user during sync mode */
export interface TimingEntry {
  lineIndex: number;
  timestamp: number; // seconds
  text: string; // lyric text (for verification)
}

/** Rating for a single tap accuracy */
export type TapRating = 'perfect' | 'good' | 'ok' | 'miss';

/** Result of evaluating a single tap */
export interface TapResult {
  rating: TapRating;
  delta: number; // difference in seconds (can be negative)
  points: number;
}

/** Statistics from a complete sync session */
export interface SyncSessionStats {
  totalLines: number;
  linesAttempted: number;
  perfectCount: number;
  goodCount: number;
  okCount: number;
  missCount: number;
  accuracyPercent: number;
  totalPoints: number;
  bestStreak: number;
  averageDelta: number;
}

/** A submission with timing data for consensus finding */
export interface SubmissionTiming {
  submissionId: string;
  userId: string;
  timings: TimingEntry[];
  trustScore: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Threshold for "Perfect" rating: ±0.5 seconds (very forgiving for learning) */
export const PERFECT_THRESHOLD = 0.5;

/** Threshold for "Good" rating: ±1.0 seconds */
export const GOOD_THRESHOLD = 1.0;

/** Threshold for "OK" rating: ±2.0 seconds (super forgiving - still get points!) */
export const OK_THRESHOLD = 2.0;

/** Base points per line */
export const BASE_POINTS = 10;

/** Multipliers for each rating */
export const RATING_MULTIPLIERS: Record<TapRating, number> = {
  perfect: 2.0,
  good: 1.5,
  ok: 1.0,
  miss: 0,
};

/** Accuracy points for each rating (used for grade calculation) */
export const RATING_ACCURACY_POINTS: Record<TapRating, number> = {
  perfect: 100,
  good: 75,
  ok: 50,
  miss: 0,
};

/** Streak thresholds for bonus multipliers */
export const STREAK_BONUSES = [
  { minStreak: 20, multiplier: 2.0 },
  { minStreak: 10, multiplier: 1.5 },
  { minStreak: 5, multiplier: 1.25 },
] as const;

// ============================================================================
// Rating Functions
// ============================================================================

/**
 * Determine the rating for a single tap based on time delta
 */
export function getTapRating(delta: number): TapRating {
  const absDelta = Math.abs(delta);
  if (absDelta <= PERFECT_THRESHOLD) return 'perfect';
  if (absDelta <= GOOD_THRESHOLD) return 'good';
  if (absDelta <= OK_THRESHOLD) return 'ok';
  return 'miss';
}

/**
 * Evaluate a single tap against the expected timestamp
 */
export function evaluateTap(
  userTimestamp: number,
  expectedTimestamp: number,
  currentStreak: number
): TapResult {
  const delta = userTimestamp - expectedTimestamp;
  const rating = getTapRating(delta);

  // Calculate base points with rating multiplier
  let points = Math.floor(BASE_POINTS * RATING_MULTIPLIERS[rating]);

  // Apply streak bonus if applicable
  if (rating !== 'miss') {
    for (const bonus of STREAK_BONUSES) {
      if (currentStreak >= bonus.minStreak) {
        points = Math.floor(points * bonus.multiplier);
        break;
      }
    }
  }

  return { rating, delta, points };
}

// ============================================================================
// Accuracy Calculation
// ============================================================================

/**
 * Calculate accuracy between user timings and existing LRC (legacy delta-based)
 *
 * @param existingLrc - The current LRC content string
 * @param userTimings - Array of user timing entries
 * @returns Accuracy percentage (0-100)
 * @deprecated Use calculateAccuracyFromRatings for grade display
 */
export function calculateAccuracy(
  existingLrc: string,
  userTimings: TimingEntry[]
): number {
  const existingLines = parseLrc(existingLrc);
  if (existingLines.length === 0 || userTimings.length === 0) return 0;

  let totalDelta = 0;
  let matchedCount = 0;

  for (const timing of userTimings) {
    const existingLine = existingLines[timing.lineIndex];
    if (existingLine) {
      const delta = Math.abs(timing.timestamp - existingLine.time);
      // Cap delta at 2 seconds for accuracy calculation
      totalDelta += Math.min(delta, 2.0);
      matchedCount++;
    }
  }

  if (matchedCount === 0) return 0;

  // Average delta, converted to accuracy percentage
  // 0 delta = 100%, 2+ seconds delta = 0%
  const avgDelta = totalDelta / matchedCount;
  const accuracy = Math.max(0, 100 - (avgDelta / 2.0) * 100);

  return Math.round(accuracy * 100) / 100;
}

/**
 * Calculate accuracy based on tap rating distribution
 * This creates a direct connection between gameplay feedback and final grade
 *
 * @param perfectCount - Number of Perfect taps
 * @param goodCount - Number of Good taps
 * @param okCount - Number of OK taps
 * @param missCount - Number of missed taps
 * @returns Accuracy percentage (0-100)
 */
export function calculateAccuracyFromRatings(
  perfectCount: number,
  goodCount: number,
  okCount: number,
  missCount: number
): number {
  const totalTaps = perfectCount + goodCount + okCount + missCount;
  if (totalTaps === 0) return 0;

  const earnedPoints =
    perfectCount * RATING_ACCURACY_POINTS.perfect +
    goodCount * RATING_ACCURACY_POINTS.good +
    okCount * RATING_ACCURACY_POINTS.ok +
    missCount * RATING_ACCURACY_POINTS.miss;

  const maxPoints = totalTaps * RATING_ACCURACY_POINTS.perfect;
  const accuracy = (earnedPoints / maxPoints) * 100;

  return Math.round(accuracy * 100) / 100;
}

/**
 * Calculate full session statistics
 */
export function calculateSessionStats(
  existingLrc: string,
  userTimings: TimingEntry[]
): SyncSessionStats {
  const existingLines = parseLrc(existingLrc);
  const stats: SyncSessionStats = {
    totalLines: existingLines.length,
    linesAttempted: userTimings.length,
    perfectCount: 0,
    goodCount: 0,
    okCount: 0,
    missCount: 0,
    accuracyPercent: 0,
    totalPoints: 0,
    bestStreak: 0,
    averageDelta: 0,
  };

  if (userTimings.length === 0) return stats;

  let currentStreak = 0;
  let totalDelta = 0;

  for (const timing of userTimings) {
    const existingLine = existingLines[timing.lineIndex];
    if (!existingLine) {
      stats.missCount++;
      currentStreak = 0;
      continue;
    }

    const result = evaluateTap(timing.timestamp, existingLine.time, currentStreak);
    totalDelta += Math.abs(result.delta);
    stats.totalPoints += result.points;

    switch (result.rating) {
      case 'perfect':
        stats.perfectCount++;
        currentStreak++;
        break;
      case 'good':
        stats.goodCount++;
        currentStreak++;
        break;
      case 'ok':
        stats.okCount++;
        currentStreak++;
        break;
      case 'miss':
        stats.missCount++;
        currentStreak = 0;
        break;
    }

    stats.bestStreak = Math.max(stats.bestStreak, currentStreak);
  }

  stats.averageDelta = totalDelta / userTimings.length;

  // Use rating-based accuracy for intuitive grade calculation
  // This ensures the grade matches the gameplay feedback (Perfect/Good/OK/Miss)
  stats.accuracyPercent = calculateAccuracyFromRatings(
    stats.perfectCount,
    stats.goodCount,
    stats.okCount,
    stats.missCount
  );

  return stats;
}

// ============================================================================
// Points Calculation
// ============================================================================

/**
 * Calculate total points for a sync session
 * (Alternative simpler calculation)
 */
export function calculatePoints(
  accuracyPercent: number,
  lineCount: number,
  bestStreak: number
): number {
  // Base: 10 points per line
  let points = lineCount * BASE_POINTS;

  // Accuracy multiplier (90%+ = 1.5x, 80%+ = 1.25x)
  if (accuracyPercent >= 90) {
    points = Math.floor(points * 1.5);
  } else if (accuracyPercent >= 80) {
    points = Math.floor(points * 1.25);
  }

  // Streak bonus (20+ = +50 pts, 10+ = +25 pts, 5+ = +10 pts)
  if (bestStreak >= 20) {
    points += 50;
  } else if (bestStreak >= 10) {
    points += 25;
  } else if (bestStreak >= 5) {
    points += 10;
  }

  return points;
}

// ============================================================================
// Edit Points Calculation (for community editing)
// ============================================================================

/** Point values for different edit actions */
export const EDIT_POINTS = {
  /** Base points per line edited */
  BASE_PER_LINE: 5,

  /** Bonus for fixing timing that was >0.5s off */
  TIMING_FIX_BONUS: 3,

  /** Bonus for fixing timing that was >1.0s off (major correction) */
  SIGNIFICANT_FIX_BONUS: 10,

  /** Points for correcting text/typos */
  TEXT_CORRECTION: 8,

  /** Points for adding a missing line */
  NEW_LINE_ADDED: 15,

  /** Points for removing an incorrect line */
  LINE_REMOVED: 3,

  /** Multiplier for high-trust users (trust_score > 0.7) */
  HIGH_TRUST_MULTIPLIER: 1.5,

  /** Bonus if edit matches community consensus */
  CONSENSUS_MATCH_BONUS: 5,

  /** Maximum points per single submission (prevent gaming) */
  MAX_POINTS_PER_SUBMISSION: 500,
} as const;

/** Types of edits that can be made */
export type EditType = 'timing' | 'text' | 'add_line' | 'remove_line';

/** Single edit entry for points calculation */
export interface EditEntry {
  editType: EditType;
  deltaMagnitude?: number; // For timing edits: abs(new - original) in seconds
}

/** Result of edit points calculation */
export interface EditPointsResult {
  points: number;
  breakdown: {
    basePoints: number;
    timingFixes: number;
    significantFixes: number;
    textCorrections: number;
    linesAdded: number;
    linesRemoved: number;
    trustBonus: number;
    consensusBonus: number;
    finalPoints: number;
  };
}

/**
 * Calculate points for an edit submission
 *
 * Points scale with the impact of the edit:
 * - More lines = more points (base 5 per line)
 * - Larger timing corrections = bonus points
 * - Text corrections get additional credit
 * - High-trust users get a 1.5x multiplier
 */
export function calculateEditPoints(params: {
  edits: EditEntry[];
  submitterTrustScore: number;
  matchesConsensus?: boolean;
}): EditPointsResult {
  const { edits, submitterTrustScore, matchesConsensus = false } = params;

  const breakdown = {
    basePoints: 0,
    timingFixes: 0,
    significantFixes: 0,
    textCorrections: 0,
    linesAdded: 0,
    linesRemoved: 0,
    trustBonus: 0,
    consensusBonus: 0,
    finalPoints: 0,
  };

  let totalPoints = 0;

  for (const edit of edits) {
    let linePoints: number = EDIT_POINTS.BASE_PER_LINE;
    breakdown.basePoints += EDIT_POINTS.BASE_PER_LINE;

    switch (edit.editType) {
      case 'timing':
        if (edit.deltaMagnitude !== undefined) {
          if (edit.deltaMagnitude > 1.0) {
            // Significant fix: timing was way off
            linePoints += EDIT_POINTS.SIGNIFICANT_FIX_BONUS;
            breakdown.significantFixes++;
          } else if (edit.deltaMagnitude > 0.5) {
            // Regular timing fix
            linePoints += EDIT_POINTS.TIMING_FIX_BONUS;
            breakdown.timingFixes++;
          }
        }
        break;

      case 'text':
        linePoints += EDIT_POINTS.TEXT_CORRECTION;
        breakdown.textCorrections++;
        break;

      case 'add_line':
        linePoints = EDIT_POINTS.NEW_LINE_ADDED; // Replace base, not add
        breakdown.linesAdded++;
        break;

      case 'remove_line':
        linePoints = EDIT_POINTS.LINE_REMOVED; // Less points for removal
        breakdown.linesRemoved++;
        break;
    }

    totalPoints += linePoints;
  }

  // Apply trust multiplier for high-trust users
  if (submitterTrustScore > 0.7) {
    const bonus = Math.floor(totalPoints * (EDIT_POINTS.HIGH_TRUST_MULTIPLIER - 1));
    totalPoints += bonus;
    breakdown.trustBonus = bonus;
  }

  // Consensus bonus
  if (matchesConsensus) {
    totalPoints += EDIT_POINTS.CONSENSUS_MATCH_BONUS;
    breakdown.consensusBonus = EDIT_POINTS.CONSENSUS_MATCH_BONUS;
  }

  // Apply cap to prevent gaming
  totalPoints = Math.min(totalPoints, EDIT_POINTS.MAX_POINTS_PER_SUBMISSION);
  breakdown.finalPoints = totalPoints;

  return { points: totalPoints, breakdown };
}

/**
 * Calculate impact score for review queue prioritization
 *
 * Higher score = more urgent review needed
 * Used by the moderator queue to sort submissions
 */
export function calculateImpactScore(params: {
  linesChanged: number;
  averageDeltaMagnitude: number;
  songPlayCount?: number;
  negativeVoteRatio?: number;
}): number {
  const {
    linesChanged,
    averageDeltaMagnitude,
    songPlayCount = 100,
    negativeVoteRatio = 0,
  } = params;

  let score = 0;

  // More lines changed = higher impact (max 25 points)
  score += Math.min(linesChanged * 2.5, 25);

  // Bigger timing changes = higher impact (max 20 points)
  score += Math.min(averageDeltaMagnitude * 10, 20);

  // Popular songs get priority (max 15 points, log scale)
  score += Math.min(Math.log10(songPlayCount + 1) * 5, 15);

  // High negative vote ratio = urgent (max 25 points)
  if (negativeVoteRatio >= 0.5) {
    score += 25;
  } else if (negativeVoteRatio >= 0.4) {
    score += 20;
  } else if (negativeVoteRatio >= 0.3) {
    score += 15;
  } else if (negativeVoteRatio >= 0.2) {
    score += 10;
  }

  return Math.round(score);
}

// ============================================================================
// Consensus Finding
// ============================================================================

/**
 * Find consensus timing from multiple submissions
 * Uses weighted median based on trust scores
 *
 * @param submissions - Array of submissions with timing data
 * @returns Consensus timings or null if insufficient data
 */
export function findConsensus(
  submissions: SubmissionTiming[]
): TimingEntry[] | null {
  if (submissions.length < 2) return null;

  // Group timings by line index
  const lineTimings: Map<number, { timestamp: number; text: string; weight: number }[]> = new Map();

  for (const submission of submissions) {
    const weight = 1 + submission.trustScore; // Trust adds weight

    for (const timing of submission.timings) {
      if (!lineTimings.has(timing.lineIndex)) {
        lineTimings.set(timing.lineIndex, []);
      }
      lineTimings.get(timing.lineIndex)!.push({
        timestamp: timing.timestamp,
        text: timing.text,
        weight,
      });
    }
  }

  // Calculate weighted median for each line
  const consensus: TimingEntry[] = [];

  for (const [lineIndex, timings] of lineTimings) {
    if (timings.length < 2) continue;

    // Sort by timestamp
    timings.sort((a, b) => a.timestamp - b.timestamp);

    // Find weighted median
    const totalWeight = timings.reduce((sum, t) => sum + t.weight, 0);
    let cumWeight = 0;
    let medianTimestamp = timings[0].timestamp;
    const text = timings[0].text;

    for (const t of timings) {
      cumWeight += t.weight;
      if (cumWeight >= totalWeight / 2) {
        medianTimestamp = t.timestamp;
        break;
      }
    }

    consensus.push({
      lineIndex,
      timestamp: Math.round(medianTimestamp * 100) / 100,
      text,
    });
  }

  // Sort by line index
  consensus.sort((a, b) => a.lineIndex - b.lineIndex);

  return consensus.length > 0 ? consensus : null;
}

/**
 * Check if submissions agree within threshold
 */
export function checkAgreement(
  submissions: SubmissionTiming[],
  threshold: number = 0.3
): boolean {
  if (submissions.length < 2) return false;

  // For each line, check if all submissions are within threshold
  const lineTimings: Map<number, number[]> = new Map();

  for (const submission of submissions) {
    for (const timing of submission.timings) {
      if (!lineTimings.has(timing.lineIndex)) {
        lineTimings.set(timing.lineIndex, []);
      }
      lineTimings.get(timing.lineIndex)!.push(timing.timestamp);
    }
  }

  // Check agreement for each line
  for (const [, timestamps] of lineTimings) {
    if (timestamps.length < 2) continue;

    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);

    if (max - min > threshold) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// LRC Merging
// ============================================================================

/**
 * Format timestamp for LRC output
 */
function formatLrcTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const centis = Math.round((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
}

/**
 * Merge approved timings into existing LRC
 *
 * @param baseLrc - The current LRC content
 * @param approvedTimings - Approved timing corrections
 * @returns New LRC content with merged timings
 */
export function mergeLrc(
  baseLrc: string,
  approvedTimings: TimingEntry[]
): string {
  const existingLines = parseLrc(baseLrc);
  if (existingLines.length === 0) return baseLrc;

  // Create a map of approved timings by line index
  const timingMap = new Map<number, number>();
  for (const timing of approvedTimings) {
    timingMap.set(timing.lineIndex, timing.timestamp);
  }

  // Build new LRC with merged timings
  const newLines: string[] = [];

  for (let i = 0; i < existingLines.length; i++) {
    const line = existingLines[i];
    const newTimestamp = timingMap.has(i) ? timingMap.get(i)! : line.time;
    newLines.push(`[${formatLrcTimestamp(newTimestamp)}]${line.text}`);
  }

  return newLines.join('\n');
}

/**
 * Create LRC content from timing entries
 */
export function createLrcFromTimings(timings: TimingEntry[]): string {
  // Sort by line index
  const sorted = [...timings].sort((a, b) => a.lineIndex - b.lineIndex);

  return sorted
    .map((t) => `[${formatLrcTimestamp(t.timestamp)}]${t.text}`)
    .join('\n');
}

// ============================================================================
// Achievement Checking
// ============================================================================

/** Achievement types and their requirements */
export const ACHIEVEMENTS = {
  first_sync: { name: 'First Sync', description: 'Complete your first sync session' },
  songs_10: { name: 'Rising Star', description: 'Sync 10 different songs' },
  songs_50: { name: 'Sync Master', description: 'Sync 50 different songs' },
  songs_100: { name: 'Centurion', description: 'Sync 100 different songs' },
  perfect_score: { name: 'Perfectionist', description: 'Achieve 100% accuracy on a song' },
  streak_10: { name: 'Combo Starter', description: 'Get a 10-hit streak' },
  streak_25: { name: 'Combo King', description: 'Get a 25-hit streak' },
  streak_50: { name: 'Untouchable', description: 'Get a 50-hit streak' },
  points_1000: { name: 'Point Collector', description: 'Earn 1,000 total points' },
  points_10000: { name: 'Point Hoarder', description: 'Earn 10,000 total points' },
  trusted: { name: 'Trusted Contributor', description: 'Reach 80% trust score' },
} as const;

export type AchievementType = keyof typeof ACHIEVEMENTS;

/**
 * Check which achievements a user should receive based on their stats
 */
export function checkAchievements(
  stats: {
    songsCount: number;
    totalPoints: number;
    bestStreak: number;
    trustScore: number;
    hadPerfectScore: boolean;
  },
  existingAchievements: Set<string>
): AchievementType[] {
  const newAchievements: AchievementType[] = [];

  const check = (type: AchievementType, condition: boolean) => {
    if (condition && !existingAchievements.has(type)) {
      newAchievements.push(type);
    }
  };

  check('first_sync', stats.songsCount >= 1);
  check('songs_10', stats.songsCount >= 10);
  check('songs_50', stats.songsCount >= 50);
  check('songs_100', stats.songsCount >= 100);
  check('perfect_score', stats.hadPerfectScore);
  check('streak_10', stats.bestStreak >= 10);
  check('streak_25', stats.bestStreak >= 25);
  check('streak_50', stats.bestStreak >= 50);
  check('points_1000', stats.totalPoints >= 1000);
  check('points_10000', stats.totalPoints >= 10000);
  check('trusted', stats.trustScore >= 0.8);

  return newAchievements;
}
