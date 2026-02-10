'use client';

import { useState, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { WISDOM_MESSAGES } from '@/lib/studio/wisdom-messages';

interface GeneratingLoaderProps {
  /** If true, shows compact inline version. Default shows full card. */
  compact?: boolean;
}

export function GeneratingLoader({ compact = false }: GeneratingLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(() =>
    Math.floor(Math.random() * WISDOM_MESSAGES.length)
  );
  const [progress, setProgress] = useState(0);

  // Rotate messages every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % WISDOM_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Simulate progress (just for visual feedback, not actual progress)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Slow down as it gets closer to 90% (never reaches 100 until done)
        if (prev < 30) return prev + 3;
        if (prev < 60) return prev + 2;
        if (prev < 85) return prev + 1;
        if (prev < 92) return prev + 0.5;
        return prev;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const message = WISDOM_MESSAGES[messageIndex];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">
          {message.emoji} Generating...
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-purple-50 via-white to-emerald-50 border border-purple-100 p-6 text-center">
      {/* Animated sparkles header */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
        <span className="text-lg font-medium text-purple-700">Creating Magic</span>
        <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
      </div>

      {/* Main emoji - larger and animated */}
      <div className="text-5xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>
        {message.emoji}
      </div>

      {/* Quote/Message */}
      <div className="min-h-[4rem] flex flex-col items-center justify-center mb-4">
        <p className="text-gray-700 text-sm leading-relaxed max-w-sm italic">
          {message.text}
        </p>
        {message.source && (
          <p className="text-gray-400 text-xs mt-1">
            — {message.source}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs mx-auto">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-emerald-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s linear infinite',
            }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Usually takes 15-30 seconds
        </p>
      </div>

      {/* CSS for shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
