'use client';

import { useEffect } from 'react';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';

/**
 * Hook to access tutorial progress with SSR-safe hydration.
 * Use this in components that need to show/hide the tutorial card.
 */
export function useTutorialProgress() {
  const {
    tutorialStep,
    completedSteps,
    tutorialCompleted,
    tutorialSkipped,
    isHydrated,
    hydrate,
    syncFromProfile,
    completeStep,
    skipTutorial,
    advanceStep,
  } = useOnboardingStore();

  // Hydrate from localStorage on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return {
    // Current state
    step: tutorialStep,
    completedSteps,
    isCompleted: tutorialCompleted,
    isSkipped: tutorialSkipped,
    isHydrated,

    // Derived state
    isInTutorial: isHydrated && !tutorialCompleted && !tutorialSkipped,
    showTutorialCard: isHydrated && !tutorialCompleted && !tutorialSkipped,

    // Actions
    completeStep,
    skipTutorial,
    advanceStep,
    syncFromProfile,
  };
}

/**
 * Hook to access celebration state for confetti/toast display.
 */
export function useCelebration() {
  const { shouldShowConfetti, celebrationMessage, clearCelebration } =
    useOnboardingStore();

  return {
    shouldShowConfetti,
    celebrationMessage,
    clearCelebration,
  };
}
