/**
 * Learning Intensity Configuration System
 *
 * Allows content creators to configure the "intensity" of learning features
 * using presets (Gentle/Standard/Intensive) with optional overrides.
 */

// =============================================================================
// Core Types
// =============================================================================

/**
 * Intensity preset names - the starting point for configuration
 */
export type IntensityPreset = 'gentle' | 'standard' | 'intensive';

/**
 * Matching strictness levels for quiz modes
 * - fuzzy: Allows ~70% similarity, very forgiving
 * - diacritic_insensitive: Accepts "chao" for "chảo"
 * - exact: Must match perfectly including all diacritics
 */
export type MatchingMode = 'fuzzy' | 'diacritic_insensitive' | 'exact';

/**
 * Hint types available in quiz mode
 */
export type HintType = 'audio' | 'first_letters' | 'no_tones';

/**
 * Celebration intensity levels
 */
export type CelebrationLevel = 0 | 1 | 2 | 3;

// =============================================================================
// Configuration Interfaces
// =============================================================================

/**
 * Hint system configuration
 */
export interface HintConfig {
  /** Whether hints are enabled at all */
  enabled: boolean;
  /** Which hint types are available */
  available: HintType[];
  /** Point penalties for each hint type */
  penalties: {
    audio: number;
    first_letters: number;
    no_tones: number;
  };
}

/**
 * Timer configuration for quiz modes
 */
export interface TimerConfig {
  /** Whether timer is enabled */
  enabled: boolean;
  /** Seconds per question (null = no per-question limit) */
  secondsPerQuestion: number | null;
  /** Total seconds for entire quiz (null = no total limit) */
  totalSeconds: number | null;
  /** Whether to show timer UI to user */
  showTimer: boolean;
}

/**
 * Scoring configuration - points awarded for different match types
 */
export interface ScoringConfig {
  /** Points for exact match (with correct diacritics) */
  exactMatch: number;
  /** Points for diacritic-insensitive match */
  diacriticInsensitive: number;
  /** Points for fuzzy match */
  fuzzyMatch: number;
  /** Minimum similarity threshold for fuzzy matching (0.0-1.0) */
  fuzzySimilarityThreshold: number;
}

/**
 * Display/UX settings
 */
export interface DisplayConfig {
  /** Show score during quiz */
  showScore: boolean;
  /** Show romanization/pronunciation guide */
  showRomanization: boolean;
  /** Auto-play audio when showing answer or in explore mode */
  audioAutoPlay: boolean;
  /** Show English translation in explore mode */
  showTranslation: boolean;
}

/**
 * Gamification and celebration settings
 */
export interface GamificationConfig {
  /** Celebration intensity: 0=none, 1=subtle, 2=moderate, 3=festive */
  celebrationLevel: CelebrationLevel;
  /** Show confetti animation on completion */
  showConfetti: boolean;
  /** Enable sound effects */
  soundEffects: boolean;
  /** Show streak counter */
  showStreak: boolean;
  /** Show leaderboard link */
  showLeaderboard: boolean;
}

/**
 * Future features - fields exist but may not be implemented yet
 * These allow creators to opt-in to features as they become available
 */
export interface FutureFeatureConfig {
  /** Enable contextual example sentences for vocabulary */
  contextualSentences: boolean;
  /** Enable spaced repetition scheduling for review */
  spacedRepetition: boolean;
  /** Enable adaptive difficulty adjustment based on performance */
  adaptiveDifficulty: boolean;
  /** Show cultural context notes alongside vocabulary */
  culturalContext: boolean;
  /** Enable handwriting practice mode */
  handwritingPractice: boolean;
  /** Enable minimal pairs audio drills for tone practice */
  minimalPairs: boolean;
}

// =============================================================================
// Main Configuration Interfaces
// =============================================================================

/**
 * Intensity configuration as stored in the database
 *
 * All fields except `preset` are optional - undefined values inherit from the preset.
 * This keeps storage compact (only overrides are stored).
 */
export interface IntensityConfig {
  /** Base preset to start from (required) */
  preset: IntensityPreset;

  /** Override: Matching strictness */
  matching?: MatchingMode;

  /** Override: Hint system settings */
  hints?: Partial<HintConfig>;

  /** Override: Timer settings */
  timer?: Partial<TimerConfig>;

  /** Override: Scoring values */
  scoring?: Partial<ScoringConfig>;

  /** Override: Display settings */
  display?: Partial<DisplayConfig>;

  /** Override: Gamification settings */
  gamification?: Partial<GamificationConfig>;

  /** Override: Future feature flags */
  future?: Partial<FutureFeatureConfig>;
}

/**
 * Fully resolved configuration with all fields populated
 *
 * This is what runtime code should use - no optional fields,
 * all values are guaranteed to exist.
 */
export interface ResolvedIntensityConfig {
  preset: IntensityPreset;
  matching: MatchingMode;
  hints: HintConfig;
  timer: TimerConfig;
  scoring: ScoringConfig;
  display: DisplayConfig;
  gamification: GamificationConfig;
  future: FutureFeatureConfig;
}

// =============================================================================
// Preset Metadata (for UI)
// =============================================================================

/**
 * Metadata for displaying presets in the admin UI
 */
export interface PresetMetadata {
  /** Lucide icon name */
  icon: string;
  /** Tailwind color name (e.g., 'emerald', 'blue', 'orange') */
  color: string;
  /** Display title */
  title: string;
  /** Short description */
  subtitle: string;
  /** Key traits shown as bullet points */
  traits: string[];
}

/**
 * Preset metadata for all presets
 */
export const PRESET_METADATA: Record<IntensityPreset, PresetMetadata> = {
  gentle: {
    icon: 'Heart',
    color: 'emerald',
    title: 'Gentle',
    subtitle: 'Encouraging & forgiving',
    traits: [
      'Fuzzy matching accepts close answers',
      'All hints available with low penalties',
      'No timer pressure',
      'Maximum celebrations',
    ],
  },
  standard: {
    icon: 'Target',
    color: 'blue',
    title: 'Standard',
    subtitle: 'Balanced challenge',
    traits: [
      'Accepts answers without diacritics',
      'Hints available with normal penalties',
      'Score tracking enabled',
      'Leaderboards available',
    ],
  },
  intensive: {
    icon: 'Flame',
    color: 'orange',
    title: 'Intensive',
    subtitle: 'Strict & competitive',
    traits: [
      'Exact match required with diacritics',
      'Only audio hint available',
      '30 second timer per question',
      'Minimal UI distractions',
    ],
  },
};
