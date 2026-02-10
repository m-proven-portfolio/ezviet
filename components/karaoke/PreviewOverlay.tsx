'use client';

import { useEffect, useRef, useMemo } from 'react';
import { X, Play, Pause, RotateCcw } from 'lucide-react';
import type { EditableLine } from '@/hooks/useEditorState';

interface PreviewOverlayProps {
  lines: EditableLine[];
  currentTime: number;
  isPlaying: boolean;
  onClose: () => void;
  onPlayPause: () => void;
  onRestart: () => void;
}

export function PreviewOverlay({
  lines,
  currentTime,
  isPlaying,
  onClose,
  onPlayPause,
  onRestart,
}: PreviewOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Find the current line index based on playback time
  const currentLineIndex = useMemo(() => {
    const visibleLines = lines.filter((l) => !l.isDeleted);
    let matchIdx = -1;
    for (let i = 0; i < visibleLines.length; i++) {
      if (visibleLines[i].time <= currentTime) {
        matchIdx = i;
      } else {
        break; // Lines are sorted
      }
    }
    return matchIdx;
  }, [lines, currentTime]);

  // Auto-scroll to keep current line centered
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLineIndex]);

  const visibleLines = lines.filter((l) => !l.isDeleted);

  return (
    <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col">
      {/* Header with close button */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 bg-black/50">
        <h2 className="text-white font-semibold">Preview Mode</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onRestart}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Restart"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={onPlayPause}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Lyrics display with karaoke highlighting */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center justify-start"
      >
        <div className="max-w-2xl w-full space-y-4">
          {visibleLines.map((line, index) => {
            const isActive = index === currentLineIndex;
            const isPast = index < currentLineIndex;
            const isFuture = index > currentLineIndex;

            return (
              <div
                key={line.id}
                ref={isActive ? activeLineRef : null}
                className={`text-center py-3 px-4 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 scale-105 shadow-lg shadow-purple-500/20'
                    : isPast
                      ? 'opacity-40'
                      : isFuture
                        ? 'opacity-60'
                        : ''
                }`}
              >
                <p
                  className={`text-lg sm:text-2xl font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white'
                      : isPast
                        ? 'text-white/50'
                        : 'text-white/70'
                  }`}
                >
                  {line.text || '♪'}
                </p>
                {isActive && (
                  <div className="mt-2 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
                )}
              </div>
            );
          })}

          {/* End spacer to allow last items to scroll to center */}
          <div className="h-[40vh]" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex-shrink-0 px-4 pb-4">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
            style={{
              width: `${visibleLines.length > 0 ? Math.min(100, ((currentLineIndex + 1) / visibleLines.length) * 100) : 0}%`,
            }}
          />
        </div>
        <p className="text-center text-white/50 text-sm mt-2">
          {visibleLines.length === 0
            ? 'No lyrics'
            : currentLineIndex < 0
              ? `Waiting... (${visibleLines.length} lines)`
              : `Line ${currentLineIndex + 1} of ${visibleLines.length}`}
        </p>
      </div>
    </div>
  );
}