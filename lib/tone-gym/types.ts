/**
 * Tone Gym Type Definitions
 *
 * Types for Vietnamese tone discrimination training exercises.
 */

// =============================================================================
// Core Types
// =============================================================================

/**
 * The 6 Vietnamese tones
 *
 * Vietnamese is a tonal language where the same syllable can have
 * completely different meanings depending on the tone used.
 */
export type VietnameseTone = 'ngang' | 'sắc' | 'huyền' | 'hỏi' | 'ngã' | 'nặng';

/**
 * Display names for tones (used in UI)
 */
export const TONE_DISPLAY_NAMES: Record<VietnameseTone, string> = {
  ngang: 'Ngang (level)',
  sắc: 'Sắc (rising)',
  huyền: 'Huyền (falling)',
  hỏi: 'Hỏi (dipping)',
  ngã: 'Ngã (broken)',
  nặng: 'Nặng (heavy)',
};

/**
 * Tone mark characters for display
 */
export const TONE_MARKS: Record<VietnameseTone, string> = {
  ngang: '(no mark)',
  sắc: '´',
  huyền: '`',
  hỏi: '?',
  ngã: '~',
  nặng: '.',
};

/**
 * Example vowel with each tone mark (for visual reference)
 */
export const TONE_EXAMPLES: Record<VietnameseTone, string> = {
  ngang: 'a',
  sắc: 'á',
  huyền: 'à',
  hỏi: 'ả',
  ngã: 'ã',
  nặng: 'ạ',
};

// =============================================================================
// Exercise Types
// =============================================================================

/**
 * A single tone variant within a minimal pair set
 */
export interface ToneVariant {
  /** The tone used */
  tone: VietnameseTone;
  /** The word with tone marks (e.g., "má") */
  word: string;
  /** English meaning */
  meaning_en: string;
  /** Vietnamese meaning/explanation (optional) */
  meaning_vi?: string;
  /** Path to human-recorded audio in Supabase storage, null = use TTS */
  audio_path: string | null;
}

/**
 * A tone exercise (minimal pair set)
 *
 * Contains all tone variants for a single base syllable.
 * Not all syllables have meaningful words for all 6 tones.
 */
export interface ToneExercise {
  id: string;
  /** Base syllable without tones (e.g., "ma") */
  base_word: string;
  /** All available tone variants */
  tone_variants: ToneVariant[];
  /** Difficulty: 1=easy, 2=medium, 3=hard */
  difficulty: 1 | 2 | 3;
  /** Whether this exercise is active */
  is_active: boolean;
}

/**
 * A single question in a tone gym session
 */
export interface ToneQuestion {
  /** The exercise this question is from */
  exercise: ToneExercise;
  /** The correct tone (the one being played) */
  correctTone: VietnameseTone;
  /** The correct variant (for audio playback) */
  correctVariant: ToneVariant;
  /** Available options to choose from (2-4 depending on difficulty) */
  options: ToneVariant[];
}

/**
 * A user's answer to a tone question
 */
export interface ToneAnswer {
  /** Question index in the session */
  questionIndex: number;
  /** The tone the user selected */
  selectedTone: VietnameseTone;
  /** The correct tone */
  correctTone: VietnameseTone;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time taken to answer (ms) */
  timeMs: number;
  /** How many times the user replayed the audio */
  replaysUsed: number;
}

// =============================================================================
// Session Types
// =============================================================================

/**
 * Game phases
 */
export type ToneGymPhase =
  | 'idle' // Not in a session
  | 'loading' // Loading exercises
  | 'playing' // Answering a question
  | 'feedback' // Showing correct/incorrect
  | 'complete'; // Session finished

/**
 * A tone gym practice session
 */
export interface ToneSession {
  /** Difficulty level for this session */
  difficulty: 1 | 2 | 3;
  /** Questions in this session (typically 10) */
  questions: ToneQuestion[];
  /** User's answers */
  answers: ToneAnswer[];
  /** Session start time */
  startTime: number;
  /** Session end time (null if still in progress) */
  endTime: number | null;
}

/**
 * Session results summary
 */
export interface ToneSessionResults {
  /** Total questions answered */
  totalQuestions: number;
  /** Correct answers */
  correctAnswers: number;
  /** Accuracy percentage (0-100) */
  accuracy: number;
  /** Total time spent (seconds) */
  timeSeconds: number;
  /** Average time per question (seconds) */
  avgTimePerQuestion: number;
  /** Current streak after this session */
  currentStreak: number;
  /** Whether user beat their best streak */
  newBestStreak: boolean;
  /** Per-tone breakdown */
  toneBreakdown: Record<VietnameseTone, { correct: number; total: number }>;
  /** Confused pairs (pairs user got wrong) */
  confusedPairs: Array<{ selected: VietnameseTone; correct: VietnameseTone }>;
}

// =============================================================================
// Progress Types
// =============================================================================

/**
 * Per-tone accuracy stats
 */
export interface ToneAccuracyStats {
  correct: number;
  total: number;
}

/**
 * User's overall progress in Tone Gym
 */
export interface ToneGymProgress {
  id: string;
  user_id: string;
  /** Total exercises completed */
  total_exercises: number;
  /** Total correct answers */
  correct_answers: number;
  /** Current consecutive correct answers */
  current_streak: number;
  /** Best streak ever */
  best_streak: number;
  /** Accuracy stats per tone */
  tone_accuracy: Partial<Record<VietnameseTone, ToneAccuracyStats>>;
  /** Confusion matrix for tone pairs */
  pair_accuracy: Record<string, ToneAccuracyStats>;
  /** Current difficulty level */
  current_difficulty: 1 | 2 | 3;
  /** Last practice timestamp */
  last_practiced_at: string | null;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Difficulty level metadata
 */
export interface DifficultyInfo {
  level: 1 | 2 | 3;
  name: string;
  description: string;
  optionCount: number;
  color: string;
  icon: string;
}

export const DIFFICULTY_INFO: Record<1 | 2 | 3, DifficultyInfo> = {
  1: {
    level: 1,
    name: 'Easy',
    description: '2 choices, clear tone contrasts',
    optionCount: 2,
    color: 'emerald',
    icon: 'Sparkles',
  },
  2: {
    level: 2,
    name: 'Medium',
    description: '3 choices, mixed tone pairs',
    optionCount: 3,
    color: 'blue',
    icon: 'Target',
  },
  3: {
    level: 3,
    name: 'Hard',
    description: '4 choices, includes tricky pairs',
    optionCount: 4,
    color: 'orange',
    icon: 'Flame',
  },
};
