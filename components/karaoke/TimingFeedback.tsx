'use client';

import { useEffect, useCallback } from 'react';
import { useEditorGamificationStore } from '@/lib/stores/editorGamificationStore';

// Import confetti dynamically to avoid SSR issues
let confetti: ((options?: Record<string, unknown>) => void) | null = null;
if (typeof window !== 'undefined') {
  import('canvas-confetti').then((mod) => {
    confetti = mod.default;
  });
}

interface TimingFeedbackProps {
  /** Position from bottom in pixels */
  bottomOffset?: number;
}

export function TimingFeedback({ bottomOffset = 100 }: TimingFeedbackProps) {
  const { toasts, shouldShowConfetti, clearConfetti, dismissToast } =
    useEditorGamificationStore();

  // Fire confetti when triggered
  const fireConfetti = useCallback(() => {
    if (!confetti) return;

    // Multi-burst celebration
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    // First burst - center
    confetti({
      ...defaults,
      particleCount: count * 0.25,
      spread: 26,
      startVelocity: 55,
    });

    // Second burst - wide
    confetti({
      ...defaults,
      particleCount: count * 0.2,
      spread: 60,
    });

    // Third burst - extra wide with more gravity
    setTimeout(() => {
      if (!confetti) return;
      confetti({
        ...defaults,
        particleCount: count * 0.35,
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
    }, 100);

    // Fourth burst - sparkle effect
    setTimeout(() => {
      if (!confetti) return;
      confetti({
        ...defaults,
        particleCount: count * 0.1,
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
    }, 200);
  }, []);

  // Watch for confetti trigger
  useEffect(() => {
    if (shouldShowConfetti) {
      fireConfetti();
      // Clear the flag after a short delay
      const timeout = setTimeout(clearConfetti, 500);
      return () => clearTimeout(timeout);
    }
  }, [shouldShowConfetti, fireConfetti, clearConfetti]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4"
      style={{ bottom: `${bottomOffset}px` }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => dismissToast(toast.id)}
          className={`
            pointer-events-auto cursor-pointer
            animate-in fade-in slide-in-from-bottom-4 duration-300
            flex items-center gap-3 px-5 py-3 rounded-2xl
            shadow-2xl backdrop-blur-lg
            transform transition-all hover:scale-105
            ${
              toast.type === 'milestone'
                ? 'bg-gradient-to-r from-yellow-500/90 to-amber-500/90 text-white border-2 border-yellow-300/50'
                : toast.type === 'community'
                  ? 'bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white border-2 border-purple-300/50'
                  : 'bg-white/95 text-gray-900 border border-gray-200/50'
            }
          `}
        >
          <span className="text-2xl">{toast.emoji}</span>
          <span className="font-semibold">{toast.text}</span>
          {toast.points && (
            <span
              className={`
              font-bold px-2 py-0.5 rounded-full text-sm
              ${
                toast.type === 'milestone' || toast.type === 'community'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-700'
              }
            `}
            >
              +{toast.points}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Points display for the editor header
 */
interface PointsDisplayProps {
  className?: string;
}

export function EditorPointsDisplay({ className = '' }: PointsDisplayProps) {
  const { sessionPoints, linesTimedThisSession, currentStreak } =
    useEditorGamificationStore();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Points */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 rounded-full">
        <span className="text-emerald-400 text-sm font-bold">
          {sessionPoints}
        </span>
        <span className="text-emerald-300/70 text-xs">pts</span>
      </div>

      {/* Lines timed */}
      {linesTimedThisSession > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 border border-purple-400/30 rounded-full">
          <span className="text-purple-300 text-sm font-bold">
            {linesTimedThisSession}
          </span>
          <span className="text-purple-300/70 text-xs">timed</span>
        </div>
      )}

      {/* Streak indicator */}
      {currentStreak > 1 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 border border-orange-400/30 rounded-full animate-pulse">
          <span className="text-orange-400 text-xs font-bold">
            {currentStreak}x
          </span>
          <span className="text-orange-300">🔥</span>
        </div>
      )}
    </div>
  );
}
