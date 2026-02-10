'use client';

import { signInWithGoogle } from '@/lib/supabase/auth';
import type { UserTier } from '@/lib/tiers';
import { getNextRefreshTime } from '@/lib/progression';

interface UpgradeNudgeProps {
  currentTier: UserTier;
  cardsLearned: number;
  variant?: 'banner' | 'inline';
}

/**
 * Completion/nudge component based on user tier
 * - Guests: Encourage sign-up
 * - Free users: Celebrate completion, suggest review or come back later
 * - Premium users: Not shown (unlimited)
 */
export function UpgradeNudge({ currentTier, cardsLearned, variant = 'banner' }: UpgradeNudgeProps) {
  const isGuest = currentTier === 'guest';
  const isFreeUser = currentTier === 'free';

  const handleGuestSignup = async () => {
    await signInWithGoogle(window.location.href);
  };

  // Get time until next refresh for display
  const getTimeUntilRefresh = () => {
    const nextRefresh = getNextRefreshTime();
    const now = Date.now();
    const hoursRemaining = Math.ceil((nextRefresh - now) / (1000 * 60 * 60));
    if (hoursRemaining <= 1) return 'soon';
    return `in ~${hoursRemaining} hours`;
  };

  // For logged-in free users: celebration message
  if (isFreeUser) {
    if (variant === 'inline') {
      return (
        <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎉</span>
            <span className="font-semibold text-amber-800">Well done!</span>
          </div>
          <p className="text-sm text-amber-700 mb-3">
            You&apos;ve learned {cardsLearned} words today! Review your cards or come back {getTimeUntilRefresh()} for more.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex-1 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-medium rounded-lg transition-colors"
            >
              Review cards
            </button>
          </div>
        </div>
      );
    }

    // Banner variant for free users
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg animate-slide-up">
        <div className="max-w-md mx-auto text-center">
          <p className="font-semibold text-lg mb-1">🎉 Well done!</p>
          <p className="text-sm opacity-90">
            {cardsLearned} words learned today. Come back {getTimeUntilRefresh()} for more!
          </p>
        </div>
      </div>
    );
  }

  // For guests: encourage sign-up
  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
        <span className="text-sm text-emerald-700">
          {cardsLearned} words down! Sign up for more daily cards
        </span>
        <button
          onClick={handleGuestSignup}
          className="shrink-0 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Keep learning
        </button>
      </div>
    );
  }

  // Banner variant for guests
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg animate-slide-up">
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium">{cardsLearned} words down! Want more?</p>
        </div>
        <button
          onClick={handleGuestSignup}
          className="shrink-0 px-4 py-2 bg-white text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
        >
          Keep learning
        </button>
      </div>
    </div>
  );
}
