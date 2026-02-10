'use client';

import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useMarketAudio } from '@/hooks/useMarketAudio';

interface AudioButtonProps {
  /** Vietnamese text to speak */
  text: string;
  /** Button size */
  size?: 'sm' | 'md';
  /** Visual style */
  variant?: 'ghost' | 'filled';
  /** Additional class names */
  className?: string;
  /** Called when playback starts */
  onPlay?: () => void;
  /** Called when playback ends */
  onEnd?: () => void;
}

export function AudioButton({
  text,
  size = 'sm',
  variant = 'ghost',
  className = '',
  onPlay,
  onEnd,
}: AudioButtonProps) {
  const { playText, stopAudio, isLoading, isPlaying, currentText } = useMarketAudio();

  const isActive = currentText === text;
  const isThisPlaying = isActive && isPlaying;
  const isThisLoading = isActive && isLoading;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger parent click handlers

    if (isThisPlaying) {
      stopAudio();
      onEnd?.();
    } else {
      onPlay?.();
      await playText(text);
      onEnd?.();
    }
  };

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
  };

  const variantClasses = {
    ghost: 'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
    filled: 'bg-amber-100 hover:bg-amber-200 text-amber-700',
  };

  return (
    <button
      onClick={handleClick}
      disabled={isThisLoading}
      className={`
        flex items-center justify-center rounded-full transition-all
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${isThisPlaying ? 'bg-amber-100 text-amber-700' : ''}
        ${isThisLoading ? 'opacity-50 cursor-wait' : ''}
        ${className}
      `}
      title={isThisPlaying ? 'Stop' : 'Listen'}
    >
      {isThisLoading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : isThisPlaying ? (
        <VolumeX className={iconSizes[size]} />
      ) : (
        <Volume2 className={iconSizes[size]} />
      )}
    </button>
  );
}
