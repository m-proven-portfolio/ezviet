/**
 * Interactive Image Labeling Types
 *
 * Standalone feature for vocabulary learning via labeled images.
 * Supports Explore mode (click to learn) and Quiz mode (type answer).
 */

import type { IntensityConfig, MatchingMode } from '@/lib/intensity';

// ============================================
// Vietnamese Accent Types
// ============================================

/**
 * Vietnamese dialect/accent type
 * - south: Ho Chi Minh City / Saigon dialect (default)
 * - north: Hanoi dialect
 */
export type VietAccent = 'south' | 'north';

// ============================================
// Database Types (mirrors Supabase schema)
// ============================================

export interface LabelSet {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  instructions: string | null;
  image_url: string;
  /** @deprecated Use intensity_config instead. Kept for backward compatibility. */
  difficulty: 'easy' | 'medium' | 'hard';
  category_id: string | null;
  created_by: string | null;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  /** Default Vietnamese accent for TTS generation */
  default_accent: VietAccent;
  /**
   * Learning intensity configuration (new system)
   * If null, falls back to legacy difficulty field
   */
  intensity_config: IntensityConfig | null;
}

export interface Label {
  id: string;
  label_set_id: string;
  x: number; // 0-100 percentage from left
  y: number; // 0-100 percentage from top
  vietnamese: string;
  english: string;
  pronunciation: string | null;
  audio_url: string | null;
  hints: string[] | null;
  card_id: string | null; // Optional link to flashcard for "Learn More"
  sort_order: number;
  created_at: string;
  /** Per-label accent override (null = use label_set.default_accent) */
  accent: VietAccent | null;
  /** Modified text for TTS pronunciation (used instead of vietnamese when generating audio) */
  tts_hint: string | null;
  /** Phonetic romanization for learners, e.g., "/fuh (falling)/" */
  romanization: string | null;
}

export interface LabelSetProgress {
  id: string;
  user_id: string;
  label_set_id: string;
  labels_explored: number;
  labels_correct: number;
  labels_attempted: number;
  best_score: number;
  best_time_seconds: number | null;
  attempts: number;
  first_attempted_at: string | null;
  last_attempted_at: string | null;
  completed_at: string | null;
}

// ============================================
// Extended Types for API Responses
// ============================================

export interface LabelSetWithLabels extends LabelSet {
  labels: Label[];
  category?: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
}

export interface LabelWithCard extends Label {
  card?: {
    id: string;
    slug: string;
    image_path: string | null;
  } | null;
}

// ============================================
// Interactive Mode Types
// ============================================

export type InteractiveMode = 'explore' | 'quiz' | 'results';

export interface QuizState {
  mode: InteractiveMode;
  currentLabelIndex: number;
  answers: QuizAnswer[];
  startTime: number | null; // timestamp
  endTime: number | null; // timestamp
  exploredLabelIds: Set<string>; // Labels clicked in explore mode
}

export interface QuizAnswer {
  labelId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  matchType: MatchType;
  score: number; // 0-100 for this answer (after hint penalties)
  timeSpent: number; // milliseconds
  /** Hints used for this question */
  hintsUsed: HintType[];
  /** Total score penalty from hints */
  hintPenalty: number;
  /** True if answer was accepted via diacritic-insensitive match */
  wasAutoCorrect: boolean;
}

export type MatchType = 'exact' | 'diacritic_insensitive' | 'fuzzy' | 'none';

export interface MatchResult {
  isMatch: boolean;
  matchType: MatchType;
  score: number; // 0-100
}

// ============================================
// Progressive Hint System
// ============================================

/**
 * Hint level type for progressive hints during quiz
 * Each hint level reveals more information at a score penalty
 */
export type HintType = 'audio' | 'first_letters' | 'no_tones';

export interface HintLevel {
  type: HintType;
  penalty: number; // Points deducted for using this hint
  label: string; // UI button label
  icon: string; // Lucide icon name
}

/**
 * Default hint levels with progressive penalties
 * - Audio: Play pronunciation (-10 pts)
 * - First Letters: Show "Ch__" for "Chảo" (-20 pts)
 * - No Tones: Show "Chao" for "Chảo" (-30 pts)
 */
export const HINT_LEVELS: HintLevel[] = [
  { type: 'audio', penalty: 10, label: 'Listen', icon: 'Volume2' },
  { type: 'first_letters', penalty: 20, label: 'Show letters', icon: 'Type' },
  { type: 'no_tones', penalty: 30, label: 'Show base', icon: 'ALargeSmall' },
];

// ============================================
// Quiz Results
// ============================================

export interface QuizResult {
  correct: number;
  total: number;
  score: number; // percentage (0-100)
  timeSeconds: number;
  answers: QuizAnswer[];
  isNewBest: boolean;
  bestScore: number;
  bestTime: number | null;
  attempts: number;
  /** Total points lost from using hints */
  totalHintPenalty: number;
  /** Number of questions where hints were used */
  questionsWithHints: number;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateLabelSetRequest {
  title: string;
  slug?: string; // auto-generated from title if not provided
  description?: string;
  instructions?: string;
  image_url: string;
  /** @deprecated Use intensity_config instead */
  difficulty?: 'easy' | 'medium' | 'hard';
  category_id?: string;
  is_published?: boolean;
  /** Learning intensity configuration */
  intensity_config?: IntensityConfig;
}

export interface UpdateLabelSetRequest {
  title?: string;
  slug?: string;
  description?: string;
  instructions?: string;
  image_url?: string;
  /** @deprecated Use intensity_config instead */
  difficulty?: 'easy' | 'medium' | 'hard';
  category_id?: string | null;
  is_published?: boolean;
  default_accent?: VietAccent;
  /** Learning intensity configuration */
  intensity_config?: IntensityConfig | null;
}

export interface CreateLabelRequest {
  x: number;
  y: number;
  vietnamese: string;
  english: string;
  pronunciation?: string;
  audio_url?: string;
  hints?: string[];
  card_id?: string;
  sort_order?: number;
  accent?: VietAccent | null;
  tts_hint?: string | null;
  romanization?: string | null;
}

export interface UpdateLabelRequest {
  x?: number;
  y?: number;
  vietnamese?: string;
  english?: string;
  pronunciation?: string;
  audio_url?: string;
  hints?: string[];
  card_id?: string | null;
  sort_order?: number;
}

export interface SubmitQuizRequest {
  correct: number;
  total: number;
  time_seconds: number;
  /** Individual answers for spaced repetition tracking (optional) */
  answers?: QuizAnswer[];
}

export interface SubmitQuizResponse {
  score: number;
  best_score: number;
  best_time: number | null;
  is_new_best: boolean;
  attempts: number;
}

// ============================================
// Component Props Types
// ============================================

export interface ExploreModeProps {
  labelSet: LabelSetWithLabels;
  exploredIds: Set<string>;
  onLabelExplored: (labelId: string) => void;
  onStartQuiz: () => void;
}

export interface QuizModeProps {
  labelSet: LabelSetWithLabels;
  onAnswer: (answer: QuizAnswer) => void;
  onComplete: () => void;
  currentIndex: number;
  answers: QuizAnswer[];
}

export interface ResultsScreenProps {
  result: QuizResult;
  labelSet: LabelSetWithLabels;
  onRetry: () => void;
  onExplore: () => void;
}

export interface LabelMarkerProps {
  label: Label;
  index: number;
  isExplored: boolean;
  isActive: boolean;
  onClick: () => void;
  mode: InteractiveMode;
}

export interface LabelTooltipProps {
  label: Label;
  onPlayAudio?: () => void;
  onLearnMore?: () => void;
  hasLinkedCard: boolean;
}

// ============================================
// Utility Types
// ============================================

export interface ScoringConfig {
  exactMatch: number; // points for exact match (default 100)
  diacriticInsensitive: number; // points for close match (default 80)
  fuzzyMatch: number; // points for fuzzy match (default 60)
}

export const DEFAULT_SCORING: ScoringConfig = {
  exactMatch: 100,
  diacriticInsensitive: 80,
  fuzzyMatch: 60,
};

// Type guard for checking if a label has a linked card
export function hasLinkedCard(label: Label): boolean {
  return label.card_id !== null;
}

// Initial quiz state factory
export function createInitialQuizState(): QuizState {
  return {
    mode: 'explore',
    currentLabelIndex: 0,
    answers: [],
    startTime: null,
    endTime: null,
    exploredLabelIds: new Set(),
  };
}

// ============================================
// Learning History Types (Spaced Repetition)
// ============================================

/** Per-label learning history for spaced repetition */
export interface LabelLearningHistory {
  id: string;
  user_id: string;
  label_id: string;
  label_set_id: string;
  attempts: number;
  correct_count: number;
  streak: number;
  best_streak: number;
  last_match_type: MatchType | null;
  last_score: number | null;
  last_time_ms: number | null;
  last_hints_used: HintType[] | null;
  ease_factor: number;
  interval_days: number;
  next_review_at: string | null;
  repetition_count: number;
  current_matching_mode: MatchingMode | null;
  first_seen_at: string;
  last_reviewed_at: string | null;
}

/** Review schedule for a label set */
export interface ReviewSchedule {
  due_count: number; // Labels due for review now
  upcoming_count: number; // Due within 24 hours
  mastered_count: number; // Streak >= 5
  learning_count: number; // In progress (not yet mastered)
  labels_due: LabelWithReview[];
}

/** Label with optional learning history attached */
export interface LabelWithReview extends Label {
  learning?: LabelLearningHistory | null;
}
