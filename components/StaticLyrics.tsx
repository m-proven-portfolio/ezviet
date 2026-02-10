'use client';

import { useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { parseLrc, isLrcFormat } from '@/lib/lrc-parser';

interface StaticLyricsProps {
  lrcLyrics?: string | null;
  plainLyrics?: string | null;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * Static lyrics display for SEO purposes.
 * Always rendered (not dependent on playback state), crawlable by search engines.
 * No interactive features - use GlobalKaraokeOverlay for the karaoke experience.
 */
export function StaticLyrics({
  lrcLyrics,
  plainLyrics,
  isExpanded,
  onToggle,
  className = '',
}: StaticLyricsProps) {
  // Parse lyrics - strip timestamps for display
  const lines = useMemo(() => {
    // Try LRC first - extract just the text
    if (lrcLyrics && isLrcFormat(lrcLyrics)) {
      const parsed = parseLrc(lrcLyrics);
      if (parsed.length > 0) {
        return parsed.map((line) => line.text);
      }
    }

    // Fallback to plain lyrics
    if (plainLyrics) {
      return plainLyrics
        .split('\n')
        .filter((line) => line.trim());
    }

    return [];
  }, [lrcLyrics, plainLyrics]);

  if (lines.length === 0) {
    return null;
  }

  const hasTimestamps = !!(lrcLyrics && isLrcFormat(lrcLyrics));

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

      {/* Lyrics content - static, SEO-crawlable */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto px-4 py-3 bg-purple-50/50">
          <div className="space-y-2">
            {lines.map((line, index) => (
              <p
                key={index}
                className={`
                  text-sm leading-relaxed px-2 py-1 -mx-2
                  ${index % 2 === 0 ? 'font-medium text-gray-800' : 'text-gray-600'}
                `}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
