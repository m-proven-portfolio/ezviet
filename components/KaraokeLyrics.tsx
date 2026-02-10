'use client';

import { useRef, useEffect, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { parseLrc, getCurrentLineIndex, isLrcFormat } from '@/lib/lrc-parser';
import type { LrcLine } from '@/lib/lrc-parser';

interface KaraokeLyricsProps {
  lrcLyrics?: string | null; // LRC format with timestamps
  plainLyrics?: string | null; // Fallback plain text
  currentTime: number; // Current playback time in seconds
  isExpanded: boolean;
  onToggle: () => void;
  onSeek?: (time: number) => void; // For click-to-seek
  className?: string;
  maxHeight?: string; // Tailwind max-h class, e.g., 'max-h-48'
}

interface DisplayLine {
  text: string;
  time?: number; // Only present for LRC lines
}

export function KaraokeLyrics({
  lrcLyrics,
  plainLyrics,
  currentTime,
  isExpanded,
  onToggle,
  onSeek,
  className = '',
  maxHeight = 'max-h-64',
}: KaraokeLyricsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLParagraphElement>(null);
  const lastScrolledIndexRef = useRef<number>(-1);

  // Parse lyrics - prefer LRC if available and valid
  const { lines, hasTimestamps } = useMemo(() => {
    // Try LRC first
    if (lrcLyrics && isLrcFormat(lrcLyrics)) {
      const parsed = parseLrc(lrcLyrics);
      if (parsed.length > 0) {
        return {
          lines: parsed.map((line): DisplayLine => ({
            text: line.text,
            time: line.time,
          })),
          hasTimestamps: true,
        };
      }
    }

    // Fallback to plain lyrics
    if (plainLyrics) {
      const plainLines = plainLyrics
        .split('\n')
        .filter(line => line.trim())
        .map((text): DisplayLine => ({ text }));
      return { lines: plainLines, hasTimestamps: false };
    }

    return { lines: [], hasTimestamps: false };
  }, [lrcLyrics, plainLyrics]);

  // Get current line index (only for timed lyrics)
  const currentLineIndex = useMemo(() => {
    if (!hasTimestamps || lines.length === 0) return -1;
    const lrcLines: LrcLine[] = lines
      .filter((l): l is DisplayLine & { time: number } => l.time !== undefined)
      .map(l => ({ time: l.time, text: l.text }));
    return getCurrentLineIndex(lrcLines, currentTime);
  }, [hasTimestamps, lines, currentTime]);

  // Auto-scroll to current line when it changes
  useEffect(() => {
    if (
      !isExpanded ||
      !hasTimestamps ||
      currentLineIndex < 0 ||
      currentLineIndex === lastScrolledIndexRef.current
    ) {
      return;
    }

    lastScrolledIndexRef.current = currentLineIndex;

    // Use RAF to ensure DOM is updated
    requestAnimationFrame(() => {
      currentLineRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }, [currentLineIndex, isExpanded, hasTimestamps]);

  // Reset scroll tracking when lyrics change
  useEffect(() => {
    lastScrolledIndexRef.current = -1;
  }, [lrcLyrics, plainLyrics]);

  // No lyrics to display
  if (lines.length === 0) {
    return null;
  }

  const handleLineClick = (line: DisplayLine) => {
    if (line.time !== undefined && onSeek) {
      onSeek(line.time);
    }
  };

  return (
    <div className={`border-t border-purple-100 ${className}`}>
      {/* Header with toggle */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-2.5 flex items-center justify-between bg-purple-50 hover:bg-purple-100 transition-colors"
      >
        <span className="text-sm font-medium text-purple-700">
          Lyrics {hasTimestamps && <span className="text-purple-400">• synced</span>}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-purple-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-purple-500" />
        )}
      </button>

      {/* Lyrics content */}
      {isExpanded && (
        <div
          ref={containerRef}
          className={`${maxHeight} overflow-y-auto scroll-smooth px-4 py-3 bg-purple-50/50`}
        >
          <div className="space-y-2">
            {lines.map((line, index) => {
              const isCurrentLine = hasTimestamps && index === currentLineIndex;
              const isClickable = line.time !== undefined && onSeek;

              return (
                <p
                  key={index}
                  ref={isCurrentLine ? currentLineRef : null}
                  onClick={() => handleLineClick(line)}
                  className={`
                    text-sm leading-relaxed transition-all duration-200 rounded px-2 py-1 -mx-2
                    ${isCurrentLine
                      ? 'bg-purple-200 text-purple-900 font-medium scale-[1.02]'
                      : 'text-gray-600'
                    }
                    ${isClickable
                      ? 'cursor-pointer hover:bg-purple-100'
                      : ''
                    }
                    ${!hasTimestamps && index % 2 === 0
                      ? 'font-medium text-gray-800'
                      : ''
                    }
                  `}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
