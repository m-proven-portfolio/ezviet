/**
 * Tone Pair Difficulty Rankings
 *
 * Based on acoustic similarity and learner confusion patterns.
 * Lower numbers = easier to distinguish, higher = harder.
 */

import type { VietnameseTone, ToneVariant, ToneQuestion, ToneExercise } from './types';

// =============================================================================
// Pair Difficulty Rankings
// =============================================================================

/**
 * Difficulty rating for each tone pair (1-3)
 *
 * These rankings are based on:
 * - Acoustic similarity (pitch contour shape)
 * - Common learner confusion patterns
 * - Linguistic research on Vietnamese tone perception
 */
export const PAIR_DIFFICULTY: Record<string, 1 | 2 | 3> = {
  // Easy pairs (1): Clear acoustic contrast
  ngang_sắc: 1, // Level vs rising - very different
  ngang_huyền: 1, // Level vs falling - very different
  sắc_huyền: 1, // Rising vs falling - clear contrast
  sắc_nặng: 1, // High rising vs low glottal - clear

  // Medium pairs (2): Some acoustic overlap
  ngang_hỏi: 2, // Level vs dipping - can be confused
  ngang_ngã: 2, // Level vs broken-rising
  huyền_nặng: 2, // Both low, but nặng has glottal
  sắc_ngã: 2, // Both rise, but ngã has break
  sắc_hỏi: 2, // Rising vs dipping-rising
  hỏi_nặng: 2, // Dipping vs low-glottal

  // Hard pairs (3): Very similar, even natives sometimes confuse
  hỏi_ngã: 3, // The infamous hard pair - both "broken" tones
  ngã_nặng: 3, // Both can have glottal quality
  huyền_hỏi: 3, // Both start with fall
};

/**
 * Get the difficulty rating for a tone pair
 */
export function getPairDifficulty(tone1: VietnameseTone, tone2: VietnameseTone): 1 | 2 | 3 {
  // Normalize pair order for lookup
  const key1 = `${tone1}_${tone2}`;
  const key2 = `${tone2}_${tone1}`;

  return PAIR_DIFFICULTY[key1] ?? PAIR_DIFFICULTY[key2] ?? 2;
}

/**
 * Get a canonical pair key (alphabetically sorted)
 */
export function getPairKey(tone1: VietnameseTone, tone2: VietnameseTone): string {
  return [tone1, tone2].sort().join('_');
}

// =============================================================================
// Question Generation
// =============================================================================

/**
 * Select options for a question based on difficulty
 *
 * Easy: 2 options, easy pair
 * Medium: 3 options, mixed difficulties
 * Hard: 4 options, includes hard pairs
 */
export function selectOptionsForQuestion(
  exercise: ToneExercise,
  correctVariant: ToneVariant,
  difficulty: 1 | 2 | 3
): ToneVariant[] {
  const optionCount = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4;
  const otherVariants = exercise.tone_variants.filter(v => v.tone !== correctVariant.tone);

  if (otherVariants.length === 0) {
    return [correctVariant];
  }

  // Sort other variants by pair difficulty with the correct tone
  const sortedByDifficulty = [...otherVariants].sort((a, b) => {
    const diffA = getPairDifficulty(correctVariant.tone, a.tone);
    const diffB = getPairDifficulty(correctVariant.tone, b.tone);
    return diffA - diffB;
  });

  // Select distractors based on difficulty
  const distractors: ToneVariant[] = [];

  if (difficulty === 1) {
    // Easy: Pick the easiest distractor
    distractors.push(sortedByDifficulty[0]);
  } else if (difficulty === 2) {
    // Medium: Pick one easy and one medium
    distractors.push(sortedByDifficulty[0]);
    if (sortedByDifficulty.length > 1) {
      // Find a medium-difficulty option
      const mediumOption = sortedByDifficulty.find(
        v => getPairDifficulty(correctVariant.tone, v.tone) >= 2
      );
      distractors.push(mediumOption ?? sortedByDifficulty[1]);
    }
  } else {
    // Hard: Include the hardest pair if available
    const hardOption = sortedByDifficulty.find(
      v => getPairDifficulty(correctVariant.tone, v.tone) === 3
    );

    // Add up to 3 distractors, prioritizing variety
    const toAdd = Math.min(3, sortedByDifficulty.length);
    for (let i = 0; i < toAdd; i++) {
      if (i === 0 && hardOption) {
        distractors.push(hardOption);
      } else {
        const candidate = sortedByDifficulty[i];
        if (!distractors.includes(candidate)) {
          distractors.push(candidate);
        }
      }
    }
  }

  // Combine and shuffle
  const allOptions = [correctVariant, ...distractors.slice(0, optionCount - 1)];
  return shuffleArray(allOptions);
}

/**
 * Generate questions for a session
 */
export function generateQuestions(
  exercises: ToneExercise[],
  difficulty: 1 | 2 | 3,
  count: number = 10
): ToneQuestion[] {
  const questions: ToneQuestion[] = [];
  const usedCombinations = new Set<string>();

  // Shuffle exercises for variety
  const shuffled = shuffleArray([...exercises]);

  for (const exercise of shuffled) {
    if (questions.length >= count) break;

    // Pick a random variant as the correct answer
    const availableVariants = exercise.tone_variants.filter(v => {
      const key = `${exercise.id}_${v.tone}`;
      return !usedCombinations.has(key);
    });

    if (availableVariants.length === 0) continue;

    const correctVariant = availableVariants[Math.floor(Math.random() * availableVariants.length)];
    usedCombinations.add(`${exercise.id}_${correctVariant.tone}`);

    const options = selectOptionsForQuestion(exercise, correctVariant, difficulty);

    questions.push({
      exercise,
      correctTone: correctVariant.tone,
      correctVariant,
      options,
    });
  }

  return questions;
}

// =============================================================================
// Adaptive Difficulty
// =============================================================================

/**
 * Calculate recommended difficulty based on user progress
 */
export function calculateRecommendedDifficulty(
  progress: {
    correct_answers: number;
    total_exercises: number;
    pair_accuracy: Record<string, { correct: number; total: number }>;
  } | null
): 1 | 2 | 3 {
  if (!progress || progress.total_exercises < 10) {
    return 1; // Start with easy
  }

  const overallAccuracy = progress.correct_answers / progress.total_exercises;

  // Check hard pair accuracy
  const hardPairs = ['hỏi_ngã', 'ngã_nặng', 'huyền_hỏi'];
  let hardPairAccuracy = 0;
  let hardPairTotal = 0;

  for (const pair of hardPairs) {
    const stats = progress.pair_accuracy[pair];
    if (stats && stats.total > 0) {
      hardPairAccuracy += stats.correct;
      hardPairTotal += stats.total;
    }
  }

  const hardAccuracy = hardPairTotal > 0 ? hardPairAccuracy / hardPairTotal : 0;

  // Recommend difficulty based on accuracy
  if (overallAccuracy >= 0.85 && hardAccuracy >= 0.7) {
    return 3; // Ready for hard
  } else if (overallAccuracy >= 0.7) {
    return 2; // Ready for medium
  } else {
    return 1; // Stay on easy
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
