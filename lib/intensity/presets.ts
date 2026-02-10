/**
 * Intensity Preset Definitions
 *
 * Each preset provides sensible defaults for all configuration options.
 * Creators can start with a preset and override specific settings.
 */

import type {
  IntensityPreset,
  HintConfig,
  TimerConfig,
  ScoringConfig,
  DisplayConfig,
  GamificationConfig,
  FutureFeatureConfig,
} from './types';

/**
 * Complete preset definition (without the preset name itself)
 */
export interface PresetDefinition {
  matching: 'fuzzy' | 'diacritic_insensitive' | 'exact';
  hints: HintConfig;
  timer: TimerConfig;
  scoring: ScoringConfig;
  display: DisplayConfig;
  gamification: GamificationConfig;
  future: FutureFeatureConfig;
}

/**
 * All preset definitions
 */
export const INTENSITY_PRESETS: Record<IntensityPreset, PresetDefinition> = {
  // ===========================================================================
  // GENTLE - For beginners, kids, or casual learners
  // Philosophy: Encourage exploration, minimize frustration
  // ===========================================================================
  gentle: {
    matching: 'fuzzy',

    hints: {
      enabled: true,
      available: ['audio', 'first_letters', 'no_tones'],
      penalties: {
        audio: 5, // Very low penalty
        first_letters: 10,
        no_tones: 15,
      },
    },

    timer: {
      enabled: false,
      secondsPerQuestion: null,
      totalSeconds: null,
      showTimer: false,
    },

    scoring: {
      exactMatch: 100,
      diacriticInsensitive: 100, // No penalty for missing diacritics
      fuzzyMatch: 80,
      fuzzySimilarityThreshold: 0.7, // More forgiving
    },

    display: {
      showScore: false, // Less pressure
      showRomanization: true,
      audioAutoPlay: true,
      showTranslation: true,
    },

    gamification: {
      celebrationLevel: 3, // Maximum encouragement
      showConfetti: true,
      soundEffects: true,
      showStreak: true,
      showLeaderboard: false, // No competition pressure
    },

    future: {
      contextualSentences: true, // Extra context helps beginners
      spacedRepetition: false, // Keep it simple
      adaptiveDifficulty: false,
      culturalContext: true,
      handwritingPractice: false,
      minimalPairs: false,
    },
  },

  // ===========================================================================
  // STANDARD - For regular learners
  // Philosophy: Balanced challenge with helpful feedback
  // ===========================================================================
  standard: {
    matching: 'diacritic_insensitive',

    hints: {
      enabled: true,
      available: ['audio', 'first_letters', 'no_tones'],
      penalties: {
        audio: 10,
        first_letters: 20,
        no_tones: 30,
      },
    },

    timer: {
      enabled: false,
      secondsPerQuestion: null,
      totalSeconds: null,
      showTimer: false,
    },

    scoring: {
      exactMatch: 100,
      diacriticInsensitive: 80,
      fuzzyMatch: 60,
      fuzzySimilarityThreshold: 0.8,
    },

    display: {
      showScore: true,
      showRomanization: true,
      audioAutoPlay: true,
      showTranslation: true,
    },

    gamification: {
      celebrationLevel: 2, // Moderate celebration
      showConfetti: true,
      soundEffects: true,
      showStreak: true,
      showLeaderboard: true,
    },

    future: {
      contextualSentences: true,
      spacedRepetition: true,
      adaptiveDifficulty: true,
      culturalContext: true,
      handwritingPractice: false,
      minimalPairs: false,
    },
  },

  // ===========================================================================
  // INTENSIVE - For advanced learners or competitive use
  // Philosophy: Strict accuracy, speed matters, minimal help
  // ===========================================================================
  intensive: {
    matching: 'exact',

    hints: {
      enabled: true,
      available: ['audio'], // Only audio hint - no spelling help
      penalties: {
        audio: 20, // Higher penalty
        first_letters: 0, // Not available
        no_tones: 0, // Not available
      },
    },

    timer: {
      enabled: true,
      secondsPerQuestion: 30,
      totalSeconds: null,
      showTimer: true,
    },

    scoring: {
      exactMatch: 100,
      diacriticInsensitive: 0, // Must be exact
      fuzzyMatch: 0, // No fuzzy matching
      fuzzySimilarityThreshold: 1.0, // Effectively disabled
    },

    display: {
      showScore: true,
      showRomanization: false, // No pronunciation help
      audioAutoPlay: false, // Must actively request
      showTranslation: false, // Target language immersion
    },

    gamification: {
      celebrationLevel: 1, // Subtle
      showConfetti: false,
      soundEffects: false,
      showStreak: true,
      showLeaderboard: true, // Competition encouraged
    },

    future: {
      contextualSentences: false, // Keep it simple and fast
      spacedRepetition: true,
      adaptiveDifficulty: true,
      culturalContext: false,
      handwritingPractice: true, // Advanced feature
      minimalPairs: true, // Tone drilling
    },
  },
};

/**
 * Get the default preset (used when no config is specified)
 */
export const DEFAULT_PRESET: IntensityPreset = 'standard';

/**
 * Get a preset definition by name
 */
export function getPresetDefinition(preset: IntensityPreset): PresetDefinition {
  return INTENSITY_PRESETS[preset];
}
