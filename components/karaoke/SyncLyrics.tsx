'use client';

import { useRef, useEffect, useState } from 'react';
import type { LrcLine } from '@/lib/lrc-parser';
import type { TapRating } from '@/lib/lrc-sync';

// Ending phrases for the last few lines
const ENDING_PHRASES = [
  '🎵 Almost there!',
  '✨ Final stretch!',
  '🔥 Finish strong!',
];

interface SyncLyricsProps {
  lines: LrcLine[];
  currentLineIndex: number;
  currentTime: number;
  lastTap: { rating: TapRating; points: number } | null;
  onTap: () => void;
  onOpenEditor?: () => void;
  autoSyncMessage?: string | null;
}

const RATING_STYLES: Record<TapRating, { bg: string; text: string; label: string }> = {
  perfect: { bg: 'bg-green-500/30', text: 'text-green-400', label: '✓ PERFECT!' },
  good: { bg: 'bg-yellow-500/30', text: 'text-yellow-400', label: '✓ Good' },
  ok: { bg: 'bg-gray-500/30', text: 'text-gray-300', label: 'OK' },
  miss: { bg: 'bg-red-500/30', text: 'text-red-400', label: '✗ Miss' },
};

// Idle detection timeout (5 seconds)
const IDLE_TIMEOUT = 5000;

export function SyncLyrics({
  lines,
  currentLineIndex,
  currentTime,
  lastTap,
  onTap,
  onOpenEditor,
  autoSyncMessage,
}: SyncLyricsProps) {
  const currentLineRef = useRef<HTMLDivElement>(null);
  const lastTapTimeRef = useRef<number>(Date.now());
  const [showIdleReminder, setShowIdleReminder] = useState(false);

  // Auto-scroll to current line
  useEffect(() => {
    currentLineRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [currentLineIndex]);

  // Reset idle timer on tap
  useEffect(() => {
    if (lastTap) {
      lastTapTimeRef.current = Date.now();
      setShowIdleReminder(false);
    }
  }, [lastTap]);

  // Idle detection - show reminder after 5 seconds of no taps
  useEffect(() => {
    const checkIdle = setInterval(() => {
      const idleTime = Date.now() - lastTapTimeRef.current;
      if (idleTime > IDLE_TIMEOUT && !showIdleReminder) {
        setShowIdleReminder(true);
      }
    }, 1000);

    return () => clearInterval(checkIdle);
  }, [showIdleReminder]);

  // Hide idle reminder after a tap
  const handleTap = () => {
    lastTapTimeRef.current = Date.now();
    setShowIdleReminder(false);
    onTap();
  };

  const currentLine = lines[currentLineIndex];

  // Only show special phrases for the last 3 lines
  const isNearEnd = lines.length - currentLineIndex <= 3;
  const endingPhrase = isNearEnd
    ? ENDING_PHRASES[lines.length - currentLineIndex - 1] || ENDING_PHRASES[0]
    : null;

  return (
    <>
      {/* Full-screen tap target - covers entire area */}
      <div
        className="absolute inset-0 z-0 cursor-pointer"
        onClick={handleTap}
        onTouchEnd={(e) => {
          // Use touchEnd instead of touchStart for better UX
          // Prevent default to avoid double-firing on some devices
          e.preventDefault();
          handleTap();
        }}
        role="button"
        tabIndex={0}
        aria-label="Tap to sync"
      />

      {/* Content layer - all pointer-events-none so taps pass through */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pt-20 select-none pointer-events-none">
        {/* Tap feedback overlay */}
        {lastTap && (
          <div
            className={`absolute inset-0 ${RATING_STYLES[lastTap.rating].bg} animate-flash z-10`}
          />
        )}

        {/* Feedback text */}
        {lastTap && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-center animate-float-up">
            <div className={`text-4xl font-bold ${RATING_STYLES[lastTap.rating].text}`}>
              {RATING_STYLES[lastTap.rating].label}
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              +{lastTap.points}
            </div>
          </div>
        )}

        {/* Auto-sync message - fun feedback when re-syncing */}
        {autoSyncMessage && (
          <div className="absolute top-20 left-0 right-0 text-center z-30 animate-fade-in">
            <div className="inline-block px-6 py-3 bg-purple-500/30 border border-purple-400/40 rounded-2xl">
              <p className="text-purple-200 text-lg font-medium">
                {autoSyncMessage}
              </p>
            </div>
          </div>
        )}

        {/* Idle reminder - helpful engagement prompt */}
        {showIdleReminder && !autoSyncMessage && (
          <>
            {/* Backdrop scrim to cover header text */}
            <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-purple-900 via-indigo-950/95 to-transparent z-[25] pointer-events-none" />
            <div className="absolute top-20 left-0 right-0 text-center z-30 animate-fade-in pointer-events-auto">
              <div className="inline-block px-6 py-4 bg-amber-500/30 border border-amber-400/40 rounded-2xl max-w-sm backdrop-blur-sm shadow-xl">
                <p className="text-amber-100 text-lg font-medium mb-2">
                  👋 Are you still there?
                </p>
                <p className="text-amber-200/70 text-sm mb-3">
                  Instrumental section? Timing off?
                </p>
                {onOpenEditor && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditor();
                    }}
                    className="px-4 py-2 bg-amber-500/30 hover:bg-amber-500/50 border border-amber-400/40 rounded-lg text-amber-100 text-sm transition-colors"
                  >
                    🎯 Help improve timing
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Lyrics container */}
        <div className="max-w-2xl w-full space-y-6 overflow-hidden">
          {/* Previous lines (dimmed) */}
          {currentLineIndex > 0 && (
            <div className="text-center text-white/30 text-lg">
              {lines[currentLineIndex - 1]?.text}
            </div>
          )}

          {/* Current line - the one to tap */}
          {currentLine && (
            <div
              ref={currentLineRef}
              className="text-center py-8 px-6 rounded-2xl bg-white/10 border-2 border-purple-400/50"
            >
              <div className="text-white text-3xl md:text-4xl font-bold karaoke-glow">
                {currentLine.text}
              </div>
              {/* Only show ending phrases for the last few lines */}
              {endingPhrase && (
                <div className="text-purple-300 text-sm uppercase tracking-wider mt-4">
                  {endingPhrase}
                </div>
              )}
            </div>
          )}

          {/* Next lines preview */}
          <div className="space-y-3">
            {lines.slice(currentLineIndex + 1, currentLineIndex + 3).map((line, i) => (
              <div
                key={currentLineIndex + 1 + i}
                className={`text-center ${i === 0 ? 'text-white/50 text-xl' : 'text-white/30 text-lg'}`}
              >
                {line.text}
              </div>
            ))}
          </div>
        </div>

        {/* Tap instruction */}
        <div className="absolute bottom-40 left-0 right-0 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 rounded-full">
            <kbd className="px-3 py-1 bg-white/20 rounded text-white font-mono text-sm">
              SPACE
            </kbd>
            <span className="text-white/70">or tap anywhere</span>
          </div>
        </div>
      </div>
    </>
  );
}
