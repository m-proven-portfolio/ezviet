'use client';

import { useState, useRef, useCallback } from 'react';
import { Volume2, Loader2, Check, X } from 'lucide-react';
import type { ToneVariant, VietnameseTone } from '@/lib/tone-gym/types';
import { TONE_DISPLAY_NAMES } from '@/lib/tone-gym/types';

// Audio cache (persists across re-renders)
const audioCache = new Map<string, string>();

interface ToneOptionButtonProps {
  variant: ToneVariant;
  isSelected: boolean;
  isCorrect?: boolean; // undefined = not revealed yet
  isDisabled: boolean;
  showFeedback: boolean; // Whether to show correct/incorrect state
  onSelect: (tone: VietnameseTone) => void;
  onPlayAudio?: () => void;
}

/**
 * ToneOptionButton - A tappable option for tone discrimination
 *
 * Features:
 * - Tap speaker icon to preview audio
 * - Tap card to select this option
 * - Visual feedback for selected/correct/incorrect states
 */
export function ToneOptionButton({
  variant,
  isSelected,
  isCorrect,
  isDisabled,
  showFeedback,
  onSelect,
  onPlayAudio,
}: ToneOptionButtonProps) {
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get audio URL (from cache, storage, or generate via TTS)
  const getAudioUrl = useCallback(async (): Promise<string | null> => {
    const cacheKey = variant.word;

    // Check cache
    if (audioCache.has(cacheKey)) {
      return audioCache.get(cacheKey)!;
    }

    // Check for pre-recorded audio
    if (variant.audio_path) {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tone-gym-audio/${variant.audio_path}`;
      audioCache.set(cacheKey, url);
      return url;
    }

    // Generate via TTS
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: variant.word,
          filenameHint: `tone-gym-${variant.word}`,
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const url = data.publicUrl as string;
      audioCache.set(cacheKey, url);
      return url;
    } catch {
      return null;
    }
  }, [variant]);

  // Play audio for this option
  const handlePlayAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    // Toggle off if already playing
    if (isPlayingAudio) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingAudio(false);
      return;
    }

    setIsLoadingAudio(true);
    const url = await getAudioUrl();
    setIsLoadingAudio(false);

    if (!url) return;

    audioRef.current.src = url;
    audioRef.current.play();
    setIsPlayingAudio(true);
    onPlayAudio?.();

    audioRef.current.onended = () => setIsPlayingAudio(false);
    audioRef.current.onerror = () => setIsPlayingAudio(false);
  };

  // Handle card tap
  const handleTap = () => {
    if (isDisabled) return;
    onSelect(variant.tone);
  };

  // Determine styling based on state
  const getCardStyle = () => {
    if (showFeedback) {
      if (isCorrect === true) {
        return 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500';
      }
      if (isCorrect === false && isSelected) {
        return 'border-red-500 bg-red-500/20 ring-2 ring-red-500';
      }
      // Not selected, not the correct one during feedback
      return 'border-slate-700 bg-slate-800/50 opacity-50';
    }

    if (isSelected) {
      return 'border-blue-500 bg-blue-500/20 ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900';
    }

    if (isDisabled) {
      return 'border-slate-700 bg-slate-800/50 opacity-50 cursor-not-allowed';
    }

    return 'border-slate-600 bg-slate-800 hover:border-slate-500 hover:bg-slate-700/50 cursor-pointer';
  };

  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      onClick={handleTap}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
          e.preventDefault();
          handleTap();
        }
      }}
      className={`
        relative p-4 rounded-xl border-2 transition-all
        ${getCardStyle()}
        active:scale-[0.98]
      `}
    >
      <div className="flex items-center gap-3">
        {/* Audio button */}
        <button
          onClick={handlePlayAudio}
          disabled={isLoadingAudio}
          className={`
            p-2.5 rounded-full transition-all flex-shrink-0
            ${
              isPlayingAudio
                ? 'bg-emerald-500 text-white'
                : isLoadingAudio
                  ? 'bg-slate-600 text-slate-400'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }
          `}
        >
          {isLoadingAudio ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>

        {/* Word and meaning */}
        <div className="flex-1 min-w-0">
          <p className="text-xl font-medium text-white">{variant.word}</p>
          <p className="text-sm text-slate-400">{variant.meaning_en}</p>
        </div>

        {/* Feedback icon */}
        {showFeedback && isCorrect !== undefined && (
          <div className="flex-shrink-0">
            {isCorrect ? (
              <div className="p-1.5 rounded-full bg-emerald-500">
                <Check className="w-4 h-4 text-white" />
              </div>
            ) : isSelected ? (
              <div className="p-1.5 rounded-full bg-red-500">
                <X className="w-4 h-4 text-white" />
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Tone name (subtle) */}
      <div className="mt-2 text-xs text-slate-500">{TONE_DISPLAY_NAMES[variant.tone]}</div>
    </div>
  );
}
