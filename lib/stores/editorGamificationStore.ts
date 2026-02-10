import { create } from 'zustand';

// Point values for different actions
export const POINTS = {
  LINE_TIMED: 10,
  LINE_TEXT_ADDED: 5,
  STREAK_BONUS: 2, // Per line in streak
  FIRST_EDIT: 25,
  MILESTONE_5: 50,
  MILESTONE_10: 100,
  MILESTONE_25: 250,
} as const;

// Encouraging messages - Vietnamese-themed, community-focused
export const TIMING_MESSAGES = [
  { text: 'Nice timing!', emoji: '🎯' },
  { text: 'Perfect catch!', emoji: '⚡' },
  { text: 'You got rhythm!', emoji: '🎵' },
  { text: 'Smooth!', emoji: '✨' },
  { text: 'On point!', emoji: '💫' },
  { text: 'Nailed it!', emoji: '🔥' },
  { text: 'Xin cam on!', emoji: '🇻🇳' }, // Thank you in Vietnamese
  { text: 'Tuyet voi!', emoji: '🌟' }, // Wonderful in Vietnamese
] as const;

export const MILESTONE_MESSAGES = [
  { lines: 5, text: "5 lines! You're on fire!", emoji: '🔥' },
  { lines: 10, text: "10 lines! Timing legend!", emoji: '🏆' },
  { lines: 25, text: "25 lines! Community hero!", emoji: '🦸' },
  { lines: 50, text: "50 lines! You're amazing!", emoji: '💎' },
] as const;

export const COMMUNITY_MESSAGES = [
  "You're making this song shine!",
  "Contributors like you make EZViet amazing!",
  "Vietnam thanks you!",
  "Every tap helps learners worldwide!",
  "You're part of something special!",
  "Building karaoke magic together!",
] as const;

interface Toast {
  id: string;
  text: string;
  emoji: string;
  points?: number;
  type: 'timing' | 'milestone' | 'community';
}

interface EditorGamificationState {
  // Session stats
  sessionPoints: number;
  linesTimedThisSession: number;
  currentStreak: number;
  bestStreak: number;
  isFirstEdit: boolean;

  // Toast queue
  toasts: Toast[];

  // Confetti trigger
  shouldShowConfetti: boolean;

  // Actions
  recordLineTimed: () => void;
  recordTextAdded: () => void;
  resetSession: () => void;
  dismissToast: (id: string) => void;
  clearConfetti: () => void;

  // Internal
  _addToast: (toast: Omit<Toast, 'id'>) => void;
  _checkMilestone: () => void;
}

// Helper to get random item from array
function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const useEditorGamificationStore = create<EditorGamificationState>((set, get) => ({
  // Initial state
  sessionPoints: 0,
  linesTimedThisSession: 0,
  currentStreak: 0,
  bestStreak: 0,
  isFirstEdit: true,
  toasts: [],
  shouldShowConfetti: false,

  recordLineTimed: () => {
    const state = get();
    const newStreak = state.currentStreak + 1;
    const streakBonus = newStreak > 1 ? POINTS.STREAK_BONUS * (newStreak - 1) : 0;
    const firstEditBonus = state.isFirstEdit ? POINTS.FIRST_EDIT : 0;
    const totalPoints = POINTS.LINE_TIMED + streakBonus + firstEditBonus;

    // Get random timing message
    const msg = randomFrom(TIMING_MESSAGES);

    set({
      sessionPoints: state.sessionPoints + totalPoints,
      linesTimedThisSession: state.linesTimedThisSession + 1,
      currentStreak: newStreak,
      bestStreak: Math.max(state.bestStreak, newStreak),
      isFirstEdit: false,
    });

    // Add toast
    get()._addToast({
      text: msg.text,
      emoji: msg.emoji,
      points: totalPoints,
      type: 'timing',
    });

    // Check for milestones
    get()._checkMilestone();
  },

  recordTextAdded: () => {
    const state = get();
    set({
      sessionPoints: state.sessionPoints + POINTS.LINE_TEXT_ADDED,
    });
  },

  resetSession: () => {
    set({
      sessionPoints: 0,
      linesTimedThisSession: 0,
      currentStreak: 0,
      bestStreak: 0,
      isFirstEdit: true,
      toasts: [],
      shouldShowConfetti: false,
    });
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearConfetti: () => {
    set({ shouldShowConfetti: false });
  },

  _addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-2), { ...toast, id }], // Keep max 3 toasts
    }));

    // Auto-dismiss after 2.5 seconds
    setTimeout(() => {
      get().dismissToast(id);
    }, 2500);
  },

  _checkMilestone: () => {
    const state = get();
    const lines = state.linesTimedThisSession;

    // Check each milestone
    const milestone = MILESTONE_MESSAGES.find((m) => m.lines === lines);

    if (milestone) {
      // Trigger confetti for milestones
      set({ shouldShowConfetti: true });

      // Add milestone toast
      get()._addToast({
        text: milestone.text,
        emoji: milestone.emoji,
        points:
          lines === 5
            ? POINTS.MILESTONE_5
            : lines === 10
              ? POINTS.MILESTONE_10
              : POINTS.MILESTONE_25,
        type: 'milestone',
      });

      // Add bonus points
      const bonusPoints =
        lines === 5
          ? POINTS.MILESTONE_5
          : lines === 10
            ? POINTS.MILESTONE_10
            : lines === 25
              ? POINTS.MILESTONE_25
              : 0;

      set((state) => ({
        sessionPoints: state.sessionPoints + bonusPoints,
      }));

      // Maybe add community message too
      if (Math.random() > 0.5) {
        setTimeout(() => {
          get()._addToast({
            text: randomFrom(COMMUNITY_MESSAGES),
            emoji: '💜',
            type: 'community',
          });
        }, 1500);
      }
    }
  },
}));
