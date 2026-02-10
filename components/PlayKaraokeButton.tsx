'use client';

import { useCallback } from 'react';
import type { CardSong } from '@/lib/supabase/types';
import { useAudioStore } from '@/lib/stores/audioStore';

type ButtonSize = 'sm' | 'md' | 'lg';

interface PlayKaraokeButtonProps {
  song: CardSong;
  cardSlug: string;
  playlist?: CardSong[];
  size?: ButtonSize;
  showLabel?: boolean;
  className?: string;
  showHint?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'w-8 h-8 text-base',
  md: 'w-10 h-10 text-lg',
  lg: 'w-12 h-12 text-xl',
};

/**
 * Unified play button that ALWAYS triggers Karaoke Hero.
 * Single source of truth for all play interactions.
 *
 * When clicked:
 * - Calls playSong() from global store
 * - Auto-launches to Level 3 (Karaoke Hero) if song has LRC lyrics
 * - Falls back to Level 1 (mini player) for songs without LRC
 */
export function PlayKaraokeButton({
  song,
  cardSlug,
  playlist = [],
  size = 'md',
  showLabel = false,
  className = '',
  showHint = false,
}: PlayKaraokeButtonProps) {
  const {
    currentSong,
    isPlaying,
    playSong,
    pause,
    resume,
  } = useAudioStore();

  // Check if THIS song is currently playing
  const isThisSongPlaying = currentSong?.id === song.id && isPlaying;
  const isThisSongActive = currentSong?.id === song.id;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isThisSongPlaying) {
      // Currently playing this song -> pause
      pause();
    } else if (isThisSongActive) {
      // This song is loaded but paused -> resume
      resume();
    } else {
      // Different song or nothing playing -> start this song
      // playSong() automatically launches Karaoke Hero (level 3) if song has LRC
      playSong(song, cardSlug, playlist.length > 0 ? playlist : [song]);
    }
  }, [isThisSongPlaying, isThisSongActive, song, cardSlug, playlist, pause, resume, playSong]);

  const sizeClass = sizeClasses[size];

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`
          ${sizeClass}
          rounded-full flex items-center justify-center gap-2
          transition-all shadow-md
          ${isThisSongPlaying
            ? 'bg-purple-600 text-white scale-110'
            : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
          }
          ${showHint && !isThisSongPlaying ? 'animate-pulse ring-2 ring-purple-300 ring-offset-2' : ''}
          ${className}
        `}
        title={isThisSongPlaying ? 'Pause' : `Play: ${song.title}`}
      >
        <span>{isThisSongPlaying ? '⏸' : '▶'}</span>
        {showLabel && (
          <span className="text-sm font-medium pr-1">
            {isThisSongPlaying ? 'Pause' : 'Play'}
          </span>
        )}
      </button>
      {/* First-visit tooltip */}
      {showHint && !isThisSongPlaying && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-purple-600 font-medium animate-bounce">
          Learn with songs!
        </div>
      )}
    </div>
  );
}
