import { create } from 'zustand';
import {
  type TutorialStep,
  TUTORIAL_STEPS,
  STORAGE_KEYS,
  getRandomCelebration,
} from '@/lib/onboarding/constants';

interface TutorialProgress {
  step: TutorialStep;
  completedSteps: TutorialStep[];
  skipped: boolean;
}

interface OnboardingState {
  // Tutorial progress
  tutorialStep: TutorialStep;
  completedSteps: TutorialStep[];
  tutorialSkipped: boolean;
  tutorialCompleted: boolean;
  isHydrated: boolean;

  // Celebration state
  shouldShowConfetti: boolean;
  celebrationMessage: string | null;

  // Actions
  hydrate: () => void;
  syncFromProfile: (onboardingCompleted: boolean) => void;
  advanceStep: () => void;
  completeStep: (step: TutorialStep) => void;
  skipTutorial: () => void;
  resetTutorial: () => void;
  triggerCelebration: (step: Exclude<TutorialStep, 'welcome'>) => void;
  clearCelebration: () => void;
}

function getNextStep(current: TutorialStep): TutorialStep {
  const currentIndex = TUTORIAL_STEPS.indexOf(current);
  const nextIndex = Math.min(currentIndex + 1, TUTORIAL_STEPS.length - 1);
  return TUTORIAL_STEPS[nextIndex];
}

function saveProgress(progress: TutorialProgress): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TUTORIAL_PROGRESS, JSON.stringify(progress));
}

function loadProgress(): TutorialProgress | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(STORAGE_KEYS.TUTORIAL_PROGRESS);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as TutorialProgress;
  } catch {
    return null;
  }
}

function markTutorialCompleted(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TUTORIAL_COMPLETED, 'true');
  // Also mark first visit complete for backward compatibility
  localStorage.setItem(STORAGE_KEYS.FIRST_VISIT_COMPLETE, 'true');
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  // Initial state (SSR-safe defaults)
  tutorialStep: 'welcome',
  completedSteps: [],
  tutorialSkipped: false,
  tutorialCompleted: false,
  isHydrated: false,
  shouldShowConfetti: false,
  celebrationMessage: null,

  hydrate: () => {
    if (get().isHydrated) return;

    // Check if tutorial was already completed
    const completed = localStorage.getItem(STORAGE_KEYS.TUTORIAL_COMPLETED) === 'true';
    if (completed) {
      set({
        isHydrated: true,
        tutorialCompleted: true,
        tutorialStep: 'complete',
        completedSteps: [...TUTORIAL_STEPS],
      });
      return;
    }

    // Load saved progress
    const progress = loadProgress();
    if (progress) {
      set({
        isHydrated: true,
        tutorialStep: progress.step,
        completedSteps: progress.completedSteps,
        tutorialSkipped: progress.skipped,
        tutorialCompleted: progress.skipped || progress.step === 'complete',
      });
    } else {
      set({ isHydrated: true });
    }
  },

  // Sync localStorage with database profile (fixes cross-device/cleared storage)
  syncFromProfile: (onboardingCompleted: boolean) => {
    if (!onboardingCompleted) return;

    // If DB says completed but localStorage doesn't know, sync it
    const localCompleted = localStorage.getItem(STORAGE_KEYS.TUTORIAL_COMPLETED) === 'true';
    if (!localCompleted) {
      console.log('[onboardingStore] Syncing tutorial completion from profile');
      markTutorialCompleted();
      set({
        tutorialCompleted: true,
        tutorialStep: 'complete',
        completedSteps: [...TUTORIAL_STEPS],
      });
    }
  },

  advanceStep: () => {
    const { tutorialStep, completedSteps } = get();
    const nextStep = getNextStep(tutorialStep);

    const newCompletedSteps = completedSteps.includes(tutorialStep)
      ? completedSteps
      : [...completedSteps, tutorialStep];

    set({
      tutorialStep: nextStep,
      completedSteps: newCompletedSteps,
      tutorialCompleted: nextStep === 'complete',
    });

    saveProgress({
      step: nextStep,
      completedSteps: newCompletedSteps,
      skipped: false,
    });

    if (nextStep === 'complete') {
      markTutorialCompleted();
    }
  },

  completeStep: (step: TutorialStep) => {
    const { completedSteps, advanceStep, triggerCelebration } = get();

    if (!completedSteps.includes(step)) {
      set({ completedSteps: [...completedSteps, step] });
    }

    // Trigger celebration for non-welcome steps
    if (step !== 'welcome') {
      triggerCelebration(step);
    }

    // Auto-advance after a short delay for celebration
    setTimeout(() => {
      advanceStep();
    }, step === 'welcome' ? 0 : 800);
  },

  skipTutorial: () => {
    set({
      tutorialSkipped: true,
      tutorialCompleted: true,
      tutorialStep: 'complete',
    });

    saveProgress({
      step: 'complete',
      completedSteps: [],
      skipped: true,
    });

    markTutorialCompleted();
  },

  resetTutorial: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.TUTORIAL_PROGRESS);
      localStorage.removeItem(STORAGE_KEYS.TUTORIAL_COMPLETED);
      localStorage.removeItem(STORAGE_KEYS.FIRST_VISIT_COMPLETE);
    }

    set({
      tutorialStep: 'welcome',
      completedSteps: [],
      tutorialSkipped: false,
      tutorialCompleted: false,
      shouldShowConfetti: false,
      celebrationMessage: null,
    });
  },

  triggerCelebration: (step: Exclude<TutorialStep, 'welcome'>) => {
    const message = getRandomCelebration(step);
    set({
      shouldShowConfetti: true,
      celebrationMessage: message,
    });
  },

  clearCelebration: () => {
    set({
      shouldShowConfetti: false,
      celebrationMessage: null,
    });
  },
}));
