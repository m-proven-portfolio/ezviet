'use client';

import { useEffect, useCallback } from 'react';
import { useCelebration } from '@/hooks/useTutorialProgress';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';
import { CONFETTI_CONFIG, type TutorialStep } from '@/lib/onboarding/constants';

// Dynamic import for SSR safety (same pattern as TimingFeedback.tsx)
let confetti: ((options?: Record<string, unknown>) => void) | null = null;
if (typeof window !== 'undefined') {
  import('canvas-confetti').then((mod) => {
    confetti = mod.default;
  });
}

export function OnboardingConfetti() {
  const { shouldShowConfetti, celebrationMessage, clearCelebration } = useCelebration();
  const tutorialStep = useOnboardingStore((s) => s.tutorialStep);

  const fireConfetti = useCallback((step: TutorialStep) => {
    if (!confetti || step === 'welcome') return;

    const config = CONFETTI_CONFIG[step as Exclude<TutorialStep, 'welcome'>];

    // Multi-burst for dramatic effect
    confetti({
      particleCount: config.particleCount * 0.4,
      spread: config.spread * 0.6,
      origin: config.origin || { y: 0.7 },
      zIndex: 9999,
      colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'], // Emerald palette
    });

    setTimeout(() => {
      if (!confetti) return;
      confetti({
        particleCount: config.particleCount * 0.6,
        spread: config.spread,
        origin: config.origin || { y: 0.7 },
        zIndex: 9999,
        colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'], // Rainbow
      });
    }, 150);

    // Extra burst for complete step
    if (step === 'complete') {
      setTimeout(() => {
        if (!confetti) return;
        confetti({
          particleCount: 80,
          spread: 150,
          origin: { y: 0.5 },
          zIndex: 9999,
        });
      }, 300);
    }
  }, []);

  // Fire confetti when triggered
  useEffect(() => {
    if (shouldShowConfetti) {
      fireConfetti(tutorialStep);
      const timeout = setTimeout(clearCelebration, 2000);
      return () => clearTimeout(timeout);
    }
  }, [shouldShowConfetti, tutorialStep, fireConfetti, clearCelebration]);

  // Celebration message toast
  if (!celebrationMessage) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-24 z-50 flex justify-center pointer-events-none">
      <div className="animate-celebration-in bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl">
        {celebrationMessage}
      </div>
    </div>
  );
}
