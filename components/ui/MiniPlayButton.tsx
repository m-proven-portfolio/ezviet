'use client';

import { useState, useRef, useCallback } from 'react';
import { Volume2, Loader2, VolumeX } from 'lucide-react';

/**
 * MiniPlayButton Component
 *
 * A compact, reusable audio play button for pronunciation.
 * Supports pre-recorded URLs or on-demand TTS generation.
 *
 * @example
 * // With pre-recorded audio URL
 * <MiniPlayButton audioUrl="https://..." />
 *
 * // With on-demand TTS generation
 * <MiniPlayButton text="xin chào" accent="south" />
 *
 * // With both (prefers audioUrl if available)
 * <MiniPlayButton audioUrl={label.audio_url} text={label.vietnamese} accent="north" />
 */

type ButtonSize = 'xs' | 'sm' | 'md';
type VietAccent = 'north' | 'south';

interface MiniPlayButtonProps {
  /** Pre-recorded audio URL (preferred if available) */
  audioUrl?: string | null;
  /** Text to generate TTS for (fallback if no audioUrl) */
  text?: string;
  /** Vietnamese accent for TTS generation */
  accent?: VietAccent;
  /** Button size */
  size?: ButtonSize;
  /** Additional CSS classes */
  className?: string;
  /** Called when audio starts playing */
  onPlay?: () => void;
  /** Called when audio ends */
  onEnd?: () => void;
  /** Called with generated audio URL after TTS */
  onGenerated?: (url: string) => void;
  /** Disable the button */
  disabled?: boolean;
  /** Label for accessibility */
  'aria-label'?: string;
}

const sizeStyles: Record<ButtonSize, { button: string; icon: string }> = {
  xs: {
    button: 'w-6 h-6 rounded-md',
    icon: 'w-3 h-3',
  },
  sm: {
    button: 'w-8 h-8 rounded-lg',
    icon: 'w-4 h-4',
  },
  md: {
    button: 'w-10 h-10 rounded-lg',
    icon: 'w-5 h-5',
  },
};

// Voice mapping for Vietnamese accents
const VOICE_MAP: Record<VietAccent, string> = {
  north: 'vi-VN-Wavenet-D', // Male, northern
  south: 'vi-VN-Wavenet-A', // Female, southern (default)
};

export function MiniPlayButton({
  audioUrl,
  text,
  accent = 'south',
  size = 'sm',
  className = '',
  onPlay,
  onEnd,
  onGenerated,
  disabled = false,
  'aria-label': ariaLabel,
}: MiniPlayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  // Determine the URL to use (prefer pre-recorded, then generated, then generate new)
  const effectiveUrl = audioUrl || generatedUrl;
  const canPlay = Boolean(effectiveUrl || text);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playAudio = useCallback(
    async (url: string) => {
      stopAudio();
      setHasError(false);

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        onPlay?.();
      };

      audio.onended = () => {
        setIsPlaying(false);
        onEnd?.();
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setHasError(true);
        console.error('Audio playback error:', url);
      };

      try {
        await audio.play();
      } catch (error) {
        setIsPlaying(false);
        setHasError(true);
        console.error('Failed to play audio:', error);
      }
    },
    [stopAudio, onPlay, onEnd]
  );

  const generateAndPlay = useCallback(async () => {
    if (!text) return;

    setIsLoading(true);
    setHasError(false);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName: VOICE_MAP[accent],
        }),
      });

      if (!response.ok) {
        throw new Error('TTS generation failed');
      }

      const data = await response.json();
      const newUrl = data.publicUrl;

      setGeneratedUrl(newUrl);
      onGenerated?.(newUrl);

      // Play the newly generated audio
      await playAudio(newUrl);
    } catch (error) {
      console.error('TTS generation error:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [text, accent, playAudio, onGenerated]);

  const handleClick = useCallback(async () => {
    if (isLoading || disabled) return;

    // If playing, stop
    if (isPlaying) {
      stopAudio();
      return;
    }

    // If we have a URL, play it
    if (effectiveUrl) {
      await playAudio(effectiveUrl);
      return;
    }

    // Otherwise, generate TTS
    if (text) {
      await generateAndPlay();
    }
  }, [
    isLoading,
    disabled,
    isPlaying,
    effectiveUrl,
    text,
    playAudio,
    generateAndPlay,
    stopAudio,
  ]);

  const styles = sizeStyles[size];
  const isDisabled = disabled || !canPlay;

  // Determine icon to show
  const Icon = hasError ? VolumeX : Volume2;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={ariaLabel || (text ? `Play "${text}"` : 'Play audio')}
      className={`
        inline-flex items-center justify-center
        transition-all duration-200 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-jade-500/30 focus-visible:ring-offset-1
        active:scale-95
        ${styles.button}
        ${
          isDisabled
            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
            : hasError
              ? 'bg-coral-100 text-coral-500 hover:bg-coral-200'
              : isPlaying
                ? 'bg-jade-100 text-jade-600 hover:bg-jade-200'
                : 'bg-slate-100 text-slate-600 hover:bg-jade-100 hover:text-jade-600'
        }
        ${className}
      `}
      title={
        hasError
          ? 'Audio unavailable'
          : isPlaying
            ? 'Stop'
            : effectiveUrl
              ? 'Play'
              : text
                ? 'Generate & play'
                : 'No audio'
      }
    >
      {isLoading ? (
        <Loader2 className={`${styles.icon} animate-spin`} />
      ) : (
        <Icon className={`${styles.icon} ${isPlaying ? 'animate-pulse' : ''}`} />
      )}
    </button>
  );
}
