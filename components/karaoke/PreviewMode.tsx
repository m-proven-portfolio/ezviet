'use client';

import { useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useAudioStore } from '@/lib/stores/audioStore';
import { getCurrentLineIndex } from '@/lib/lrc-parser';

interface PreviewModeProps {
  onBackToEditor: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

export function PreviewMode({ onBackToEditor, onSubmit, isSubmitting }: PreviewModeProps) {
  const {
    currentSong,
    currentTime,
    draftTimings,
    lyricsOffset,
  } = useAudioStore();

  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const lastScrolledIndexRef = useRef<number>(-1);

  // Convert draft timings to display format
  const lines = useMemo(() => {
    if (!draftTimings || draftTimings.length === 0) return [];
    return draftTimings.map((t) => ({
      time: t.timestamp,
      text: t.text,
    }));
  }, [draftTimings]);

  // Get current line index
  const currentLineIndex = useMemo(() => {
    if (lines.length === 0) return -1;
    return getCurrentLineIndex(lines, currentTime, lyricsOffset);
  }, [lines, currentTime, lyricsOffset]);

  // Auto-scroll to current line
  useEffect(() => {
    if (currentLineIndex < 0 || currentLineIndex === lastScrolledIndexRef.current) {
      return;
    }

    lastScrolledIndexRef.current = currentLineIndex;

    requestAnimationFrame(() => {
      currentLineRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }, [currentLineIndex]);

  // Reset scroll tracking when entering preview
  useEffect(() => {
    lastScrolledIndexRef.current = -1;
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-b from-purple-900 via-purple-950 to-indigo-950 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBackToEditor}
            disabled={isSubmitting}
            className="flex items-center gap-2 text-white/80 hover:text-white disabled:opacity-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Editor</span>
          </button>

          <div className="text-center">
            <h2 className="text-white font-semibold">Preview Mode</h2>
            <p className="text-purple-300/70 text-sm">Testing your edits</p>
          </div>

          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Edits
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview banner */}
      <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2 text-center">
        <p className="text-yellow-300 text-sm">
          Watch your timing edits in action. Happy with it? Submit below!
        </p>
      </div>

      {/* Lyrics display - full screen karaoke style */}
      <div
        ref={lyricsContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth px-4 py-8"
      >
        <div className="flex flex-col items-center gap-6 py-16 max-w-2xl mx-auto">
          {lines.length === 0 ? (
            <p className="text-purple-300/60 text-center">No lyrics to preview</p>
          ) : (
            lines.map((line, index) => {
              const isCurrent = index === currentLineIndex;
              const isPast = currentLineIndex >= 0 && index < currentLineIndex;

              return (
                <div
                  key={index}
                  ref={isCurrent ? currentLineRef : null}
                  className={`
                    text-center px-4 py-2 rounded-xl transition-all duration-300
                    ${isCurrent
                      ? 'text-white font-bold text-3xl sm:text-4xl scale-105 karaoke-glow'
                      : isPast
                        ? 'text-purple-300/40 text-lg sm:text-xl'
                        : 'text-purple-200/60 text-lg sm:text-xl'
                    }
                  `}
                >
                  {line.text || '...'}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Song info footer */}
      <div className="flex-shrink-0 bg-black/30 border-t border-white/10 px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50">
            {currentSong?.title || 'Unknown Song'}
          </span>
          <span className="text-purple-300/70">
            {lines.length} lines
          </span>
        </div>
      </div>
    </div>
  );
}
