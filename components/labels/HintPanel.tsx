'use client';

import { Volume2, Type, ALargeSmall, Lightbulb } from 'lucide-react';
import { type HintType, type Label } from '@/lib/labels/types';
import {
  generateFirstLettersHint,
  generateNoTonesHint,
} from '@/lib/labels/matching';
import type { ResolvedIntensityConfig } from '@/lib/intensity';

interface HintPanelProps {
  label: Label;
  hintsUsed: HintType[];
  hintPenalty: number;
  onUseHint: (type: HintType) => void;
  onPlayAudio: () => void;
  disabled?: boolean;
  /** Intensity configuration for hint availability and penalties */
  intensityConfig: ResolvedIntensityConfig;
}

/** Hint metadata for display */
const HINT_METADATA: Record<HintType, { label: string; icon: string }> = {
  audio: { label: 'Listen', icon: 'Volume2' },
  first_letters: { label: 'Show letters', icon: 'Type' },
  no_tones: { label: 'Show base', icon: 'ALargeSmall' },
};

/**
 * Progressive hint panel for quiz mode
 * Shows hint buttons with penalty info and reveals hints when used
 */
export function HintPanel({
  label,
  hintsUsed,
  hintPenalty,
  onUseHint,
  onPlayAudio,
  disabled = false,
  intensityConfig,
}: HintPanelProps) {
  const hasAudio = Boolean(label.audio_url);

  // If hints are disabled in config, don't show the panel
  if (!intensityConfig.hints.enabled) {
    return null;
  }

  // Get available hints from config
  const availableHints = intensityConfig.hints.available;

  // Get icon component for hint type
  const getIcon = (type: HintType) => {
    switch (type) {
      case 'audio':
        return Volume2;
      case 'first_letters':
        return Type;
      case 'no_tones':
        return ALargeSmall;
    }
  };

  // Handle hint button click
  const handleHintClick = (type: HintType) => {
    if (type === 'audio') {
      onPlayAudio();
    }
    if (!hintsUsed.includes(type)) {
      onUseHint(type);
    }
  };

  // Check if hint is available (must be in config + audio needs audio_url)
  const isHintAvailable = (type: HintType) => {
    if (!availableHints.includes(type)) return false;
    if (type === 'audio') return hasAudio;
    return true;
  };

  // Get penalty for a hint type from config
  const getPenalty = (type: HintType) => {
    return intensityConfig.hints.penalties[type] ?? 0;
  };

  // Filter to only show hints that are configured as available
  const hintsToShow = (['audio', 'first_letters', 'no_tones'] as HintType[]).filter(
    (type) => availableHints.includes(type)
  );

  // If no hints are available, don't show the panel
  if (hintsToShow.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-amber-700">
          <Lightbulb className="h-4 w-4" />
          <span className="text-sm font-medium">Need help?</span>
        </div>
        {hintPenalty > 0 && (
          <span className="text-xs font-medium text-amber-600">
            -{hintPenalty} pts
          </span>
        )}
      </div>

      {/* Hint buttons */}
      <div className="flex gap-2">
        {hintsToShow.map((type) => {
          const Icon = getIcon(type);
          const isUsed = hintsUsed.includes(type);
          const isAvailable = isHintAvailable(type);
          const penalty = getPenalty(type);
          const meta = HINT_METADATA[type];

          return (
            <button
              key={type}
              type="button"
              onClick={() => handleHintClick(type)}
              disabled={disabled || !isAvailable}
              className={`
                flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-all
                ${
                  isUsed
                    ? 'bg-amber-200 text-amber-800'
                    : isAvailable
                      ? 'bg-white text-amber-700 hover:bg-amber-100'
                      : 'cursor-not-allowed bg-slate-100 text-slate-400'
                }
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
              `}
              title={
                !isAvailable
                  ? type === 'audio' ? 'No audio available' : 'Not available'
                  : isUsed
                    ? 'Hint used'
                    : `-${penalty} pts`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{meta.label}</span>
              {!isUsed && isAvailable && penalty > 0 && (
                <span className="text-[10px] text-amber-500">
                  -{penalty}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Revealed hints */}
      {hintsUsed.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-amber-200 pt-2">
          {hintsUsed.includes('first_letters') && (
            <div className="flex items-center gap-2 text-sm">
              <Type className="h-3.5 w-3.5 text-amber-600" />
              <span className="font-mono text-lg font-medium text-slate-700">
                {generateFirstLettersHint(label.vietnamese)}
              </span>
            </div>
          )}
          {hintsUsed.includes('no_tones') && (
            <div className="flex items-center gap-2 text-sm">
              <ALargeSmall className="h-3.5 w-3.5 text-amber-600" />
              <span className="font-medium text-slate-700">
                {generateNoTonesHint(label.vietnamese)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
