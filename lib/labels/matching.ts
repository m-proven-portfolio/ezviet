/**
 * Vietnamese Text Matching for Quiz Mode
 *
 * Supports multiple matching modes based on difficulty:
 * - exact: Must match perfectly (hard mode)
 * - diacritic_insensitive: Ignores tone marks (easy/medium mode)
 * - fuzzy: Allows small typos (easy mode only)
 */

import type { MatchResult, ScoringConfig } from './types';
import { DEFAULT_SCORING } from './types';
import type { ResolvedIntensityConfig } from '@/lib/intensity';

/**
 * Vietnamese diacritics mapping
 * Maps accented characters to their base form
 */
const VIETNAMESE_CHAR_MAP: Record<string, string> = {
  // a variants
  à: 'a', á: 'a', ạ: 'a', ả: 'a', ã: 'a',
  â: 'a', ầ: 'a', ấ: 'a', ậ: 'a', ẩ: 'a', ẫ: 'a',
  ă: 'a', ằ: 'a', ắ: 'a', ặ: 'a', ẳ: 'a', ẵ: 'a',
  // e variants
  è: 'e', é: 'e', ẹ: 'e', ẻ: 'e', ẽ: 'e',
  ê: 'e', ề: 'e', ế: 'e', ệ: 'e', ể: 'e', ễ: 'e',
  // i variants
  ì: 'i', í: 'i', ị: 'i', ỉ: 'i', ĩ: 'i',
  // o variants
  ò: 'o', ó: 'o', ọ: 'o', ỏ: 'o', õ: 'o',
  ô: 'o', ồ: 'o', ố: 'o', ộ: 'o', ổ: 'o', ỗ: 'o',
  ơ: 'o', ờ: 'o', ớ: 'o', ợ: 'o', ở: 'o', ỡ: 'o',
  // u variants
  ù: 'u', ú: 'u', ụ: 'u', ủ: 'u', ũ: 'u',
  ư: 'u', ừ: 'u', ứ: 'u', ự: 'u', ử: 'u', ữ: 'u',
  // y variants
  ỳ: 'y', ý: 'y', ỵ: 'y', ỷ: 'y', ỹ: 'y',
  // d variant
  đ: 'd',
};

/**
 * Remove Vietnamese diacritics and normalize text
 * "Xin chào" -> "xin chao"
 */
export function removeDiacritics(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .split('')
    .map((char) => VIETNAMESE_CHAR_MAP[char] || char)
    .join('');
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Calculate similarity score (0-1) between two strings
 */
export function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);

  return 1 - distance / maxLength;
}

/**
 * Match Vietnamese text based on difficulty level
 *
 * @param userAnswer - The answer the user typed
 * @param correctAnswer - The correct Vietnamese word
 * @param difficulty - The difficulty level affects matching strictness
 * @param scoring - Optional custom scoring values
 * @returns MatchResult with isMatch, matchType, and score
 *
 * @example
 * // Exact match on any difficulty
 * matchVietnamese("xin chào", "xin chào", "hard")
 * // { isMatch: true, matchType: "exact", score: 100 }
 *
 * @example
 * // Diacritic-insensitive on easy/medium
 * matchVietnamese("xin chao", "xin chào", "medium")
 * // { isMatch: true, matchType: "diacritic_insensitive", score: 80 }
 *
 * @example
 * // Fuzzy match on easy only
 * matchVietnamese("xin choa", "xin chào", "easy")
 * // { isMatch: true, matchType: "fuzzy", score: 60 }
 */
export function matchVietnamese(
  userAnswer: string,
  correctAnswer: string,
  difficulty: 'easy' | 'medium' | 'hard',
  scoring: ScoringConfig = DEFAULT_SCORING
): MatchResult {
  // Normalize both strings (lowercase, trim whitespace)
  const userNormalized = userAnswer.toLowerCase().trim();
  const correctNormalized = correctAnswer.toLowerCase().trim();

  // Empty answer is always wrong
  if (userNormalized.length === 0) {
    return { isMatch: false, matchType: 'none', score: 0 };
  }

  // 1. Check for exact match (works on all difficulty levels)
  if (userNormalized === correctNormalized) {
    return {
      isMatch: true,
      matchType: 'exact',
      score: scoring.exactMatch,
    };
  }

  // 2. Check for diacritic-insensitive match (easy and medium only)
  if (difficulty !== 'hard') {
    const userBase = removeDiacritics(userNormalized);
    const correctBase = removeDiacritics(correctNormalized);

    if (userBase === correctBase) {
      return {
        isMatch: true,
        matchType: 'diacritic_insensitive',
        // Medium gets slightly less credit than exact
        score: difficulty === 'easy' ? scoring.exactMatch : scoring.diacriticInsensitive,
      };
    }
  }

  // 3. Check for fuzzy match (easy mode only)
  if (difficulty === 'easy') {
    const userBase = removeDiacritics(userNormalized);
    const correctBase = removeDiacritics(correctNormalized);

    const similarity = calculateSimilarity(userBase, correctBase);

    // Allow up to ~20% error (similarity >= 0.8)
    if (similarity >= 0.8) {
      return {
        isMatch: true,
        matchType: 'fuzzy',
        score: scoring.fuzzyMatch,
      };
    }
  }

  // No match
  return { isMatch: false, matchType: 'none', score: 0 };
}

/**
 * Match Vietnamese text using ResolvedIntensityConfig
 *
 * This is the preferred function for new code - it uses the full
 * intensity configuration system instead of legacy difficulty levels.
 *
 * @param userAnswer - The answer the user typed
 * @param correctAnswer - The correct Vietnamese word
 * @param config - The resolved intensity configuration
 * @returns MatchResult with isMatch, matchType, and score
 *
 * @example
 * const config = resolveFromLegacy(labelSet.intensity_config, labelSet.difficulty);
 * const result = matchVietnameseWithConfig(userInput, label.vietnamese, config);
 */
export function matchVietnameseWithConfig(
  userAnswer: string,
  correctAnswer: string,
  config: ResolvedIntensityConfig
): MatchResult {
  // Normalize both strings (lowercase, trim whitespace)
  const userNormalized = userAnswer.toLowerCase().trim();
  const correctNormalized = correctAnswer.toLowerCase().trim();

  // Empty answer is always wrong
  if (userNormalized.length === 0) {
    return { isMatch: false, matchType: 'none', score: 0 };
  }

  // 1. Check for exact match (works on all matching modes)
  if (userNormalized === correctNormalized) {
    return {
      isMatch: true,
      matchType: 'exact',
      score: config.scoring.exactMatch,
    };
  }

  // 2. Check for diacritic-insensitive match (if not in exact mode)
  if (config.matching !== 'exact') {
    const userBase = removeDiacritics(userNormalized);
    const correctBase = removeDiacritics(correctNormalized);

    if (userBase === correctBase) {
      return {
        isMatch: true,
        matchType: 'diacritic_insensitive',
        score: config.scoring.diacriticInsensitive,
      };
    }
  }

  // 3. Check for fuzzy match (fuzzy mode only)
  if (config.matching === 'fuzzy') {
    const userBase = removeDiacritics(userNormalized);
    const correctBase = removeDiacritics(correctNormalized);

    const similarity = calculateSimilarity(userBase, correctBase);

    if (similarity >= config.scoring.fuzzySimilarityThreshold) {
      return {
        isMatch: true,
        matchType: 'fuzzy',
        score: config.scoring.fuzzyMatch,
      };
    }
  }

  // No match
  return { isMatch: false, matchType: 'none', score: 0 };
}

/**
 * Check if the answer is close enough to show a hint
 * Useful for showing "Almost!" messages
 */
export function isCloseAnswer(
  userAnswer: string,
  correctAnswer: string
): boolean {
  const userBase = removeDiacritics(userAnswer.toLowerCase().trim());
  const correctBase = removeDiacritics(correctAnswer.toLowerCase().trim());

  const similarity = calculateSimilarity(userBase, correctBase);
  return similarity >= 0.6 && similarity < 0.8;
}

/**
 * Get feedback message based on match result
 */
export function getMatchFeedback(result: MatchResult): string {
  switch (result.matchType) {
    case 'exact':
      return 'Perfect!';
    case 'diacritic_insensitive':
      return 'Correct! Try adding the diacritics next time.';
    case 'fuzzy':
      return 'Close enough! Check the spelling.';
    case 'none':
    default:
      return 'Not quite. Try again!';
  }
}

/**
 * Calculate overall quiz score from individual answers
 */
export function calculateQuizScore(
  answers: Array<{ score: number }>
): number {
  if (answers.length === 0) return 0;

  const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
  const maxPossible = answers.length * 100;

  return Math.round((totalScore / maxPossible) * 100);
}

// ============================================
// Hint Generation Functions
// ============================================

/**
 * Remove Vietnamese diacritics while preserving original case
 * "Chảo" -> "Chao", "XIN CHÀO" -> "XIN CHAO"
 */
export function removeDiacriticsPreserveCase(text: string): string {
  return text
    .split('')
    .map((char) => {
      const lower = char.toLowerCase();
      const base = VIETNAMESE_CHAR_MAP[lower] || lower;
      // Preserve original case
      return char === lower ? base : base.toUpperCase();
    })
    .join('');
}

/**
 * Generate first letters hint by showing only first N characters
 * "Chảo" with showCount=2 -> "Ch__"
 * "Xin chào" with showCount=3 -> "Xin_____"
 *
 * @param text - The Vietnamese text to create hint from
 * @param showCount - Number of characters to reveal (default 2)
 * @returns Hint string with underscores replacing hidden characters
 */
export function generateFirstLettersHint(text: string, showCount = 2): string {
  const chars = [...text]; // Handle Unicode properly
  if (chars.length <= showCount) return text;

  const visible = chars.slice(0, showCount).join('');
  const hiddenCount = chars.length - showCount;
  const hidden = '_'.repeat(hiddenCount);

  return visible + hidden;
}

/**
 * Generate no-tones hint by removing all Vietnamese diacritics
 * "Chảo" -> "Chao"
 * "Xin chào" -> "Xin chao"
 */
export function generateNoTonesHint(text: string): string {
  return removeDiacriticsPreserveCase(text);
}

/**
 * Check if user's answer matches via diacritic-insensitive comparison
 * Used to show auto-correct tooltip
 *
 * @param userAnswer - What the user typed
 * @param correctAnswer - The correct Vietnamese word
 * @returns The correct spelling if auto-corrected, null if exact match or no match
 */
export function checkAutoCorrect(
  userAnswer: string,
  correctAnswer: string
): string | null {
  const userNorm = userAnswer.toLowerCase().trim();
  const correctNorm = correctAnswer.toLowerCase().trim();

  // Exact match - no auto-correct needed
  if (userNorm === correctNorm) return null;

  // Check diacritic-insensitive match
  const userBase = removeDiacritics(userNorm);
  const correctBase = removeDiacritics(correctNorm);

  if (userBase === correctBase) {
    // User typed correct base but wrong/missing diacritics
    return correctAnswer;
  }

  // No match at all
  return null;
}
