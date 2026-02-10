'use client';

import { useAudioStore } from '@/lib/stores/audioStore';
import { PlayKaraokeButton } from '@/components/PlayKaraokeButton';
import type { CardSong } from '@/lib/supabase/types';

interface SongPagePlayerProps {
  song: CardSong;
  cardSlug: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Song page player - uses unified PlayKaraokeButton.
 * Clicking play launches Karaoke Hero if song has LRC lyrics.
 */
export function SongPagePlayer({ song, cardSlug }: SongPagePlayerProps) {
  const {
    currentSong,
    currentTime: globalCurrentTime,
    duration: globalDuration,
    seek,
  } = useAudioStore();

  // Check if THIS song is the one currently playing globally
  const isThisSong = currentSong?.id === song.id;
  const currentTime = isThisSong ? globalCurrentTime : 0;
  const duration = isThisSong ? globalDuration : (song.duration_seconds || 0);

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const time = parseFloat(e.target.value);
    if (isThisSong) {
      seek(time);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Unified play button - triggers Karaoke Hero */}
        <PlayKaraokeButton
          song={song}
          cardSlug={cardSlug}
          size="lg"
          className="w-14 h-14 text-2xl shadow-lg"
        />

        <div className="flex-1 space-y-2">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            disabled={!isThisSong}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50"
          />
          <div className="flex justify-between text-sm text-gray-500 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
