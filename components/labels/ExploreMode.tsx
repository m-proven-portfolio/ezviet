'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Play, CheckCircle } from 'lucide-react';
import { LabelMarker } from './LabelMarker';
import { LabelTooltip } from './LabelTooltip';
import type { LabelSetWithLabels, Label } from '@/lib/labels/types';

interface ExploreModeProps {
  labelSet: LabelSetWithLabels;
  exploredIds: Set<string>;
  onLabelExplored: (labelId: string) => void;
  onStartQuiz: () => void;
}

export function ExploreMode({
  labelSet,
  exploredIds,
  onLabelExplored,
  onStartQuiz,
}: ExploreModeProps) {
  const [activeLabel, setActiveLabel] = useState<Label | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const allExplored = exploredIds.size >= labelSet.labels.length;

  // Handle label click
  const handleLabelClick = useCallback(
    (label: Label) => {
      if (activeLabel?.id === label.id) {
        // Toggle off if clicking same label
        setActiveLabel(null);
        return;
      }

      // Mark as explored
      if (!exploredIds.has(label.id)) {
        onLabelExplored(label.id);
      }

      // Calculate tooltip position
      setActiveLabel(label);

      // Auto-play audio if available
      if (label.audio_url) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(label.audio_url);
        audioRef.current.play().catch(console.error);
      }
    },
    [activeLabel, exploredIds, onLabelExplored]
  );

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking on a marker or tooltip
      if (target.closest('[data-label-marker]') || target.closest('[data-label-tooltip]')) {
        return;
      }
      setActiveLabel(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Calculate tooltip position relative to label
  const getTooltipStyle = (label: Label) => {
    // Position tooltip above or below based on label position
    const isTopHalf = label.y < 50;

    return {
      left: `${Math.min(Math.max(label.x, 20), 80)}%`,
      top: isTopHalf ? `${label.y + 8}%` : 'auto',
      bottom: !isTopHalf ? `${100 - label.y + 8}%` : 'auto',
      transform: 'translateX(-50%)',
    };
  };

  const imageUrl = labelSet.image_url;

  return (
    <div className="space-y-4">
      {/* Image with markers - breakout for larger display */}
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden shadow-lg bg-slate-100 -mx-4 md:-mx-8 lg:-mx-12"
      >
        <Image
          src={imageUrl}
          alt={labelSet.title}
          width={1200}
          height={900}
          className="w-full h-auto object-contain"
          priority
        />

        {/* Label markers */}
        {labelSet.labels.map((label, index) => (
          <div key={label.id} data-label-marker>
            <LabelMarker
              label={label}
              index={index}
              isExplored={exploredIds.has(label.id)}
              isActive={activeLabel?.id === label.id}
              onClick={() => handleLabelClick(label)}
              mode="explore"
            />
          </div>
        ))}

        {/* Active tooltip */}
        {activeLabel && (
          <div
            data-label-tooltip
            className="absolute z-10"
            style={getTooltipStyle(activeLabel)}
          >
            <LabelTooltip
              label={activeLabel}
              onClose={() => setActiveLabel(null)}
              onPlayAudio={
                activeLabel.audio_url
                  ? () => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                        audioRef.current.play().catch(console.error);
                      }
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>

      {/* Progress and quiz button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {allExplored ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
            )}
            <span className="text-sm text-slate-600">
              {exploredIds.size} / {labelSet.labels.length} explored
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{
                width: `${(exploredIds.size / labelSet.labels.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onStartQuiz}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl font-semibold
            transition-all duration-200 shadow-md hover:shadow-lg
            ${
              allExplored
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }
          `}
        >
          <Play size={20} />
          {allExplored ? 'Start Quiz' : 'Skip to Quiz'}
        </button>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Vocabulary ({labelSet.labels.length} words)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {labelSet.labels.map((label, index) => (
            <button
              key={label.id}
              type="button"
              onClick={() => handleLabelClick(label)}
              className={`
                flex items-center gap-3 p-2 rounded-lg text-left transition-colors
                ${
                  exploredIds.has(label.id)
                    ? 'bg-emerald-50 hover:bg-emerald-100'
                    : 'bg-slate-50 hover:bg-slate-100'
                }
              `}
            >
              <span
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                  ${exploredIds.has(label.id) ? 'bg-emerald-500' : 'bg-blue-500'}
                `}
              >
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{label.vietnamese}</p>
                <p className="text-sm text-slate-500 truncate">{label.english}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
