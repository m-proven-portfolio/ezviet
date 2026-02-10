'use client';

import { Volume2 } from 'lucide-react';
import type { ConversationLine } from '@/lib/types/conversation';

interface ConversationBubbleProps {
  line: ConversationLine;
  isRevealed: boolean;
  isPlaying: boolean;
  onTap: () => void;
  isLeft: boolean;
}

/**
 * ConversationBubble
 *
 * A polished chat bubble for dialogue practice.
 * Clean design with subtle animations and clear hierarchy.
 */
export function ConversationBubble({
  line,
  isRevealed,
  isPlaying,
  onTap,
  isLeft,
}: ConversationBubbleProps) {
  return (
    <div className={`flex flex-col ${isLeft ? 'items-start' : 'items-end'}`}>
      {/* Speaker label - outside bubble for cleaner look */}
      <div
        className={`
          flex items-center gap-1.5 mb-1.5 px-1
          text-xs font-medium
          ${isLeft ? 'text-neutral-500' : 'text-jade-600'}
        `}
      >
        <span>{line.speaker}</span>
        {line.speaker_vi && (
          <span className="text-neutral-400">({line.speaker_vi})</span>
        )}
      </div>

      {/* Bubble */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTap();
        }}
        className={`
          relative max-w-[85%] text-left
          rounded-2xl px-4 py-3
          transition-all duration-200 ease-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-jade-500/30
          active:scale-[0.98]
          ${isLeft
            ? 'bg-neutral-100 rounded-tl-md'
            : 'bg-jade-50 rounded-tr-md border border-jade-100'
          }
          ${isPlaying
            ? 'ring-2 ring-jade-400 ring-offset-2 ring-offset-[var(--surface-page)]'
            : 'hover:shadow-md'
          }
        `}
      >
        {/* Vietnamese text */}
        <p className="text-neutral-800 font-medium leading-relaxed">
          {line.vietnamese}
        </p>

        {/* Revealed content with smooth animation */}
        <div
          className={`
            grid transition-all duration-300 ease-out
            ${isRevealed ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}
          `}
        >
          <div className="overflow-hidden">
            {/* Romanization */}
            {line.romanization && (
              <p className="text-sm text-neutral-500 italic mb-1.5">
                /{line.romanization}/
              </p>
            )}

            {/* English translation */}
            <p className={`
              text-sm pt-2
              border-t
              ${isLeft ? 'text-neutral-600 border-neutral-200' : 'text-jade-700 border-jade-200'}
            `}>
              {line.english}
            </p>
          </div>
        </div>

        {/* Tap hint - only show when not revealed */}
        {!isRevealed && (
          <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-neutral-200 flex items-center justify-center">
              <Volume2 className="w-2.5 h-2.5 text-neutral-500" />
            </span>
            <span>Tap to reveal</span>
          </p>
        )}

        {/* Playing indicator */}
        {isPlaying && (
          <div
            className={`
              absolute -top-1 -right-1
              w-6 h-6 rounded-full
              flex items-center justify-center
              shadow-md
              ${isLeft ? 'bg-neutral-700' : 'bg-jade-500'}
            `}
          >
            <Volume2 className="w-3 h-3 text-white animate-pulse" />
          </div>
        )}
      </button>
    </div>
  );
}
