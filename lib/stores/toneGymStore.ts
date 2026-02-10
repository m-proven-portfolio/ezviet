import { create } from 'zustand';
import type {
  VietnameseTone,
  ToneQuestion,
  ToneSession,
  ToneAnswer,
  ToneGymPhase,
  ToneSessionResults,
  ToneExercise,
} from '@/lib/tone-gym/types';
import { generateQuestions } from '@/lib/tone-gym/difficulty';

// =============================================================================
// Types
// =============================================================================

interface ToneGymState {
  // Game phase
  phase: ToneGymPhase;
  error: string | null;

  // Current session
  session: ToneSession | null;
  currentQuestionIndex: number;

  // Current question state
  selectedOption: VietnameseTone | null;
  replaysUsed: number;
  questionStartTime: number | null;

  // Streak tracking (persisted across sessions)
  currentStreak: number;
  bestStreak: number;

  // Audio state
  isPlayingAudio: boolean;
  currentAudioUrl: string | null;

  // Actions - Session lifecycle
  startSession: (difficulty: 1 | 2 | 3, exercises: ToneExercise[]) => void;
  endSession: () => ToneSessionResults | null;
  resetSession: () => void;

  // Actions - Question flow
  selectAnswer: (tone: VietnameseTone) => void;
  confirmAnswer: () => void;
  nextQuestion: () => void;
  incrementReplays: () => void;

  // Actions - Audio
  setPlayingAudio: (playing: boolean, url?: string | null) => void;

  // Computed
  getCurrentQuestion: () => ToneQuestion | null;
  getProgress: () => { current: number; total: number; correct: number };
  isLastQuestion: () => boolean;
}

// =============================================================================
// Store
// =============================================================================

export const useToneGymStore = create<ToneGymState>((set, get) => ({
  // Initial state
  phase: 'idle',
  error: null,
  session: null,
  currentQuestionIndex: 0,
  selectedOption: null,
  replaysUsed: 0,
  questionStartTime: null,
  currentStreak: 0,
  bestStreak: 0,
  isPlayingAudio: false,
  currentAudioUrl: null,

  // ==========================================================================
  // Session Lifecycle
  // ==========================================================================

  startSession: (difficulty, exercises) => {
    const questions = generateQuestions(exercises, difficulty, 10);

    if (questions.length === 0) {
      set({ error: 'No exercises available for this difficulty' });
      return;
    }

    const session: ToneSession = {
      difficulty,
      questions,
      answers: [],
      startTime: Date.now(),
      endTime: null,
    };

    set({
      phase: 'playing',
      session,
      currentQuestionIndex: 0,
      selectedOption: null,
      replaysUsed: 0,
      questionStartTime: Date.now(),
      error: null,
    });
  },

  endSession: () => {
    const { session, currentStreak, bestStreak } = get();
    if (!session) return null;

    const endTime = Date.now();
    const updatedSession = { ...session, endTime };

    // Calculate results
    const correctAnswers = session.answers.filter((a) => a.isCorrect).length;
    const totalQuestions = session.answers.length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const timeSeconds = (endTime - session.startTime) / 1000;

    // Tone breakdown
    const toneBreakdown: Record<VietnameseTone, { correct: number; total: number }> = {
      ngang: { correct: 0, total: 0 },
      sắc: { correct: 0, total: 0 },
      huyền: { correct: 0, total: 0 },
      hỏi: { correct: 0, total: 0 },
      ngã: { correct: 0, total: 0 },
      nặng: { correct: 0, total: 0 },
    };

    const confusedPairs: Array<{ selected: VietnameseTone; correct: VietnameseTone }> = [];

    for (const answer of session.answers) {
      toneBreakdown[answer.correctTone].total++;
      if (answer.isCorrect) {
        toneBreakdown[answer.correctTone].correct++;
      } else {
        confusedPairs.push({
          selected: answer.selectedTone,
          correct: answer.correctTone,
        });
      }
    }

    const newBestStreak = currentStreak > bestStreak;

    const results: ToneSessionResults = {
      totalQuestions,
      correctAnswers,
      accuracy,
      timeSeconds,
      avgTimePerQuestion: totalQuestions > 0 ? timeSeconds / totalQuestions : 0,
      currentStreak,
      newBestStreak,
      toneBreakdown,
      confusedPairs,
    };

    set({
      phase: 'complete',
      session: updatedSession,
      bestStreak: newBestStreak ? currentStreak : bestStreak,
    });

    return results;
  },

  resetSession: () => {
    set({
      phase: 'idle',
      session: null,
      currentQuestionIndex: 0,
      selectedOption: null,
      replaysUsed: 0,
      questionStartTime: null,
      error: null,
      isPlayingAudio: false,
      currentAudioUrl: null,
    });
  },

  // ==========================================================================
  // Question Flow
  // ==========================================================================

  selectAnswer: (tone) => {
    const { phase } = get();
    if (phase !== 'playing') return;

    set({ selectedOption: tone });
  },

  confirmAnswer: () => {
    const { phase, session, currentQuestionIndex, selectedOption, replaysUsed, questionStartTime, currentStreak } =
      get();

    if (phase !== 'playing' || !session || selectedOption === null) return;

    const question = session.questions[currentQuestionIndex];
    if (!question) return;

    const isCorrect = selectedOption === question.correctTone;
    const timeMs = questionStartTime ? Date.now() - questionStartTime : 0;

    const answer: ToneAnswer = {
      questionIndex: currentQuestionIndex,
      selectedTone: selectedOption,
      correctTone: question.correctTone,
      isCorrect,
      timeMs,
      replaysUsed,
    };

    // Update streak
    const newStreak = isCorrect ? currentStreak + 1 : 0;

    set({
      phase: 'feedback',
      session: {
        ...session,
        answers: [...session.answers, answer],
      },
      currentStreak: newStreak,
    });
  },

  nextQuestion: () => {
    const { session, currentQuestionIndex } = get();
    if (!session) return;

    const isLast = currentQuestionIndex >= session.questions.length - 1;

    if (isLast) {
      // End the session
      get().endSession();
    } else {
      // Move to next question
      set({
        phase: 'playing',
        currentQuestionIndex: currentQuestionIndex + 1,
        selectedOption: null,
        replaysUsed: 0,
        questionStartTime: Date.now(),
      });
    }
  },

  incrementReplays: () => {
    set((state) => ({ replaysUsed: state.replaysUsed + 1 }));
  },

  // ==========================================================================
  // Audio
  // ==========================================================================

  setPlayingAudio: (playing, url) => {
    set({
      isPlayingAudio: playing,
      currentAudioUrl: url ?? null,
    });
  },

  // ==========================================================================
  // Computed
  // ==========================================================================

  getCurrentQuestion: () => {
    const { session, currentQuestionIndex } = get();
    if (!session) return null;
    return session.questions[currentQuestionIndex] ?? null;
  },

  getProgress: () => {
    const { session, currentQuestionIndex } = get();
    if (!session) return { current: 0, total: 0, correct: 0 };

    return {
      current: currentQuestionIndex + 1,
      total: session.questions.length,
      correct: session.answers.filter((a) => a.isCorrect).length,
    };
  },

  isLastQuestion: () => {
    const { session, currentQuestionIndex } = get();
    if (!session) return false;
    return currentQuestionIndex >= session.questions.length - 1;
  },
}));

// =============================================================================
// Selectors (for optimized re-renders)
// =============================================================================

export const selectPhase = (state: ToneGymState) => state.phase;
export const selectCurrentQuestionIndex = (state: ToneGymState) => state.currentQuestionIndex;
export const selectSelectedOption = (state: ToneGymState) => state.selectedOption;
export const selectSession = (state: ToneGymState) => state.session;
export const selectStreak = (state: ToneGymState) => ({
  current: state.currentStreak,
  best: state.bestStreak,
});
