'use client';

import { useRef, useEffect } from 'react';
import { Scissors, Merge, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SyllableTiming } from '@/lib/lrc-parser';
import { formatTimestamp } from '@/lib/lrc-parser';

interface SyllableTimelineProps {
  syllables: SyllableTiming[];
  selectedIndex: number | null;
  currentSyllableIndex: number;
  onSelect: (index: number) => void;
  onSplit: (index: number) => void;
  onMerge: (startIndex: number) => void;
  onTimeChange: (index: number, newTime: number) => void;
}

/**
 * SyllableTimeline - Horizontal display of syllables with timing controls
 *
 * Features:
 * - Click to select syllable
 * - Split syllable into two
 * - Merge adjacent syllables
 * - Inline time editing
 */
export function SyllableTimeline({
  syllables,
  selectedIndex,
  currentSyllableIndex,
  onSelect,
  onSplit,
  onMerge,
  onTimeChange,
}: SyllableTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to selected syllable
  useEffect(() => {
    if (selectedRef.current && containerRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedIndex]);

  // Handle time input change
  const handleTimeInput = (index: number, value: string) => {
    const match = value.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?$/);
    if (!match) return;

    const mins = parseInt(match[1], 10);
    const secs = parseInt(match[2], 10);
    const centis = match[3] ? parseInt(match[3].padEnd(2, '0'), 10) : 0;
    const newTime = mins * 60 + secs + centis / 100;

    onTimeChange(index, newTime);
  };

  // Handle nudge (fine-tune timing)
  const handleNudge = (index: number, delta: number) => {
    const newTime = Math.max(0, syllables[index].startTime + delta);
    onTimeChange(index, newTime);
  };

  if (syllables.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 text-center text-white/50">
        No syllables to edit. Add some lyrics first.
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      {/* Syllables row */}
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/20"
      >
        {syllables.map((syllable, index) => {
          const isSelected = index === selectedIndex;
          const isCurrent = index === currentSyllableIndex;
          const canMerge = index < syllables.length - 1;

          return (
            <button
              key={index}
              ref={isSelected ? selectedRef : null}
              onClick={() => onSelect(index)}
              className={`
                flex-shrink-0 px-3 py-2 rounded-lg border-2 transition-all
                ${isSelected
                  ? 'bg-purple-600/30 border-purple-500 ring-2 ring-purple-500/50'
                  : isCurrent
                    ? 'bg-emerald-600/20 border-emerald-500'
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                }
              `}
            >
              <span className={`text-sm font-medium ${isSelected ? 'text-purple-300' : 'text-white'}`}>
                {syllable.text}
              </span>
              <span className={`block text-xs mt-0.5 ${isSelected ? 'text-purple-400' : 'text-white/50'}`}>
                {formatTimestamp(syllable.startTime)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected syllable controls */}
      {selectedIndex !== null && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Timing controls */}
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">Time:</span>
              <button
                onClick={() => handleNudge(selectedIndex, -0.05)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors"
                title="-50ms"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <input
                type="text"
                value={formatTimestamp(syllables[selectedIndex].startTime)}
                onChange={(e) => handleTimeInput(selectedIndex, e.target.value)}
                className="w-20 px-2 py-1 bg-black/30 border border-white/20 rounded text-white text-sm font-mono text-center focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => handleNudge(selectedIndex, 0.05)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors"
                title="+50ms"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Split/Merge controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSplit(selectedIndex)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors"
                title="Split syllable into two"
              >
                <Scissors className="w-4 h-4" />
                <span className="text-sm">Split</span>
              </button>
              {selectedIndex < syllables.length - 1 && (
                <button
                  onClick={() => onMerge(selectedIndex)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 rounded-lg transition-colors"
                  title="Merge with next syllable"
                >
                  <Merge className="w-4 h-4" />
                  <span className="text-sm">Merge</span>
                </button>
              )}
            </div>
          </div>

          {/* Selected syllable info */}
          <div className="mt-3 text-sm text-white/50">
            Syllable {selectedIndex + 1} of {syllables.length}:
            <span className="text-white ml-2">&quot;{syllables[selectedIndex].text}&quot;</span>
          </div>
        </div>
      )}
    </div>
  );
}
