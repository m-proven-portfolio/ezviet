'use client';

import { useEffect, useRef } from 'react';
import { Trophy, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EditSuccessAnimationProps {
  pointsEarned: number;
  onClose: () => void;
}

export function EditSuccessAnimation({ pointsEarned, onClose }: EditSuccessAnimationProps) {
  const hasTriggeredConfetti = useRef(false);

  useEffect(() => {
    if (hasTriggeredConfetti.current) return;
    hasTriggeredConfetti.current = true;

    // Fire confetti from both sides
    const duration = 2000;
    const end = Date.now() + duration;

    const colors = ['#a855f7', '#ec4899', '#f59e0b', '#22c55e'];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Big burst in the center
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.5, y: 0.5 },
        colors,
      });
    }, 300);
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="text-center px-6 animate-scale-in">
        {/* Trophy icon with glow */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-yellow-400/30 blur-3xl rounded-full" />
          <div className="relative bg-gradient-to-b from-yellow-400 to-orange-500 p-6 rounded-full">
            <Trophy className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Success message */}
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          Edit Submitted!
        </h2>
        <p className="text-purple-300/80 text-lg mb-8">
          Thanks for helping improve the lyrics
        </p>

        {/* Points display */}
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600/50 to-pink-600/50 backdrop-blur-lg border border-purple-400/30 rounded-2xl px-8 py-4 mb-8">
          <Sparkles className="w-8 h-8 text-yellow-400" />
          <div className="text-left">
            <p className="text-white/60 text-sm">Points Earned</p>
            <p className="text-4xl font-bold text-white">
              +{pointsEarned.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Info text */}
        <p className="text-white/50 text-sm max-w-md mx-auto mb-8">
          Your edit has been submitted for review. Once approved, it will help
          everyone enjoy better-synced karaoke!
        </p>

        {/* Close button */}
        <button
          onClick={onClose}
          className="px-8 py-3 bg-white text-purple-900 font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-lg"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
