/**
 * Adaptive Difficulty Utilities
 *
 * Calculates recommended matching mode based on user's learning history.
 * Implements "zone of proximal development" - keeping learners challenged
 * but not frustrated.
 */

import type { LabelLearningHistory } from './types';
import type { MatchingMode } from '@/lib/intensity';

/**
 * Difficulty indicator for UI display
 */
export interface DifficultyIndicator {
  label: string;
  color: 'emerald' | 'blue' | 'orange';
  description: string;
}

/**
 * Calculate recommended matching mode based on learning history
 *
 * Strategy:
 * - Start with fuzzy (most forgiving)
 * - After 3 consecutive correct: upgrade to diacritic_insensitive
 * - After 5 consecutive correct with exact matches: upgrade to exact
 * - On failure: consider downgrading
 *
 * @param history - User's learning history for this label (null if first time)
 * @param baseMode - The base matching mode from intensity config
 * @returns Recommended matching mode for this label
 */
export function calculateAdaptiveMatchingMode(
  history: LabelLearningHistory | null | undefined,
  baseMode: MatchingMode
): MatchingMode {
  // First time seeing this label - use base mode
  if (!history) {
    return baseMode;
  }

  // If there's a manual override, use it
  if (history.current_matching_mode) {
    return history.current_matching_mode;
  }

  const { streak, correct_count, attempts, last_match_type } = history;

  // Calculate accuracy (avoid division by zero)
  const accuracy = attempts > 0 ? correct_count / attempts : 0;

  // Mode order from easiest to hardest
  const modeOrder: MatchingMode[] = ['fuzzy', 'diacritic_insensitive', 'exact'];
  const baseModeIndex = modeOrder.indexOf(baseMode);

  // Upgrade conditions
  // High performance: 5+ streak with exact matches and high accuracy
  if (streak >= 5 && accuracy >= 0.9 && last_match_type === 'exact') {
    return 'exact';
  }

  // Good performance: 3+ streak with decent accuracy
  if (streak >= 3 && accuracy >= 0.75) {
    // Upgrade one level from current base, but don't go past 'exact'
    const upgradedIndex = Math.min(baseModeIndex + 1, modeOrder.length - 1);
    return modeOrder[upgradedIndex];
  }

  // Struggling: low accuracy after several attempts
  if (accuracy < 0.5 && attempts >= 3) {
    // Downgrade one level, but don't go below 'fuzzy'
    const downgradedIndex = Math.max(baseModeIndex - 1, 0);
    return modeOrder[downgradedIndex];
  }

  // Maintaining performance at current level
  if (accuracy >= 0.7) {
    return baseMode;
  }

  // Borderline performance - stay at base or slightly easier
  if (accuracy >= 0.5) {
    return baseMode;
  }

  // Poor performance - consider easier mode
  const easierIndex = Math.max(baseModeIndex - 1, 0);
  return modeOrder[easierIndex];
}

/**
 * Get difficulty indicator for UI display
 *
 * Shows whether the current label is at standard, challenge, or practice difficulty
 *
 * @param recommendedMode - The adaptive mode calculated for this label
 * @param baseMode - The base mode from intensity config
 * @returns UI indicator with label and color
 */
export function getDifficultyIndicator(
  recommendedMode: MatchingMode,
  baseMode: MatchingMode
): DifficultyIndicator {
  if (recommendedMode === baseMode) {
    return {
      label: 'Standard',
      color: 'blue',
      description: 'Normal difficulty',
    };
  }

  const modeOrder: MatchingMode[] = ['fuzzy', 'diacritic_insensitive', 'exact'];
  const baseIndex = modeOrder.indexOf(baseMode);
  const recIndex = modeOrder.indexOf(recommendedMode);

  if (recIndex > baseIndex) {
    return {
      label: 'Challenge',
      color: 'orange',
      description: 'Harder because you\'re doing well!',
    };
  }

  return {
    label: 'Practice',
    color: 'emerald',
    description: 'Easier to help you learn',
  };
}

/**
 * Calculate quality rating for SM-2 algorithm based on match result
 *
 * SM-2 uses a 0-5 scale:
 * - 5: Perfect response with no hesitation
 * - 4: Correct response after hesitation
 * - 3: Correct response recalled with difficulty
 * - 2: Incorrect but remembered after seeing answer
 * - 1: Incorrect, vaguely remembered
 * - 0: Complete blackout
 *
 * @param matchType - The type of match achieved
 * @param hintsUsed - Array of hints the user needed
 * @param isCorrect - Whether the answer was correct
 * @returns Quality rating 0-5 for SM-2 calculation
 */
export function calculateSM2Quality(
  matchType: string,
  hintsUsed: string[],
  isCorrect: boolean
): number {
  const hintCount = hintsUsed?.length ?? 0;

  // Perfect exact match without hints
  if (matchType === 'exact' && hintCount === 0) {
    return 5;
  }

  // Exact match with hints, or diacritic-insensitive match
  if (matchType === 'exact' || matchType === 'diacritic_insensitive') {
    return hintCount === 0 ? 4 : 3;
  }

  // Fuzzy match (close but not quite)
  if (matchType === 'fuzzy') {
    return 3;
  }

  // Incorrect but attempted (shows some memory)
  if (!isCorrect && hintCount < 3) {
    return 2;
  }

  // Incorrect with heavy hint usage
  if (!isCorrect) {
    return 1;
  }

  // Complete failure
  return 0;
}

/**
 * Determine if a label should be prioritized in review
 *
 * @param history - Learning history for the label
 * @returns true if this label needs priority review
 */
export function shouldPrioritizeReview(
  history: LabelLearningHistory | null | undefined
): boolean {
  if (!history) {
    return false; // New labels aren't prioritized
  }

  // Prioritize if:
  // 1. Overdue for review
  if (history.next_review_at) {
    const reviewAt = new Date(history.next_review_at);
    if (reviewAt <= new Date()) {
      return true;
    }
  }

  // 2. Low accuracy with multiple attempts (struggling)
  const accuracy = history.attempts > 0
    ? history.correct_count / history.attempts
    : 0;
  if (accuracy < 0.5 && history.attempts >= 3) {
    return true;
  }

  // 3. Streak was recently broken (was doing well, then failed)
  if (history.best_streak >= 3 && history.streak === 0) {
    return true;
  }

  return false;
}
