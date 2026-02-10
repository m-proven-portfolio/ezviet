'use client';

import { useTutorialProgress } from '@/hooks/useTutorialProgress';
import { TutorialStep } from './TutorialStep';
import { TUTORIAL_STEPS } from '@/lib/onboarding/constants';

interface TutorialCardProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function TutorialCard({ onComplete, onSkip }: TutorialCardProps) {
  const { step, completedSteps, completeStep, skipTutorial, isCompleted } = useTutorialProgress();

  const handleAction = () => {
    completeStep(step);

    // If completing the last step, notify parent
    if (step === 'complete') {
      onComplete?.();
    }
  };

  const handleSkip = () => {
    skipTutorial();
    onSkip?.();
  };

  // Don't render if tutorial is completed
  if (isCompleted) {
    return null;
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl shadow-2xl overflow-hidden">
        {/* Tutorial step content */}
        <TutorialStep step={step} onAction={handleAction} />

        {/* Step indicator dots */}
        <div className="flex justify-center gap-2 pb-6">
          {TUTORIAL_STEPS.map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all ${
                s === step
                  ? 'bg-white w-4'
                  : completedSteps.includes(s)
                    ? 'bg-white/80'
                    : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Skip button - only show before complete step */}
        {step !== 'complete' && (
          <div className="pb-6 text-center">
            <button
              onClick={handleSkip}
              className="text-white/60 text-sm hover:text-white/80 transition-colors"
            >
              Skip tutorial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
