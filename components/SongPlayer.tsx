'use client';

import { useState } from 'react';
import type { CardSong } from '@/lib/supabase/types';
import { useAudioStore } from '@/lib/stores/audioStore';
import { PlayKaraokeButton } from './PlayKaraokeButton';
import { KaraokeLyrics } from './KaraokeLyrics';

interface SongPlayerProps {
  song: CardSong;
  cardSlug: string;
  playlist?: CardSong[];
  showLyrics?: boolean;
  compact?: boolean;
  defaultLyricsExpanded?: boolean;
}

/**
 * Song player display component.
 * Always uses global audio store - no local audio.
 * Click play triggers Karaoke Hero via PlayKaraokeButton.
 */
export function SongPlayer({
  song,
  cardSlug,
  playlist = [],
  showLyrics = true,
  compact = false,
  defaultLyricsExpanded = false,
}: SongPlayerProps) {
  // Initialize with defaultLyricsExpanded, and reset when it changes from false to true
  const [showFullLyrics, setShowFullLyrics] = useState(defaultLyricsExpanded);
  const [prevDefaultExpanded, setPrevDefaultExpanded] = useState(defaultLyricsExpanded);

  // Sync state when prop changes (React recommended pattern)
  if (defaultLyricsExpanded !== prevDefaultExpanded) {
    setPrevDefaultExpanded(defaultLyricsExpanded);
    if (defaultLyricsExpanded) {
      setShowFullLyrics(true);
    }
  }

  // Global audio store
  const {
    currentSong,
    currentTime,
    duration: globalDuration,
    seek,
  } = useAudioStore();

  // Check if THIS song is active in global store
  const isThisSongActive = currentSong?.id === song.id;

  // Use global time/duration when this song is active, otherwise show song's stored duration
  const displayCurrentTime = isThisSongActive ? currentTime : 0;
  const displayDuration = isThisSongActive ? (globalDuration || song.duration_seconds || 0) : (song.duration_seconds || 0);

  const coverUrl = song.cover_image_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cards-images/${song.cover_image_path}`
    : null;

  const hasLyrics = !!(song.lyrics_lrc || song.lyrics_plain);


  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const time = parseFloat(e.target.value);
    handleSeekToTime(time);
  }

  function handleSeekToTime(time: number) {
    if (isThisSongActive) {
      seek(time);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Compact mode - minimal player card
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        {/* Play button - triggers karaoke */}
        <PlayKaraokeButton
          song={song}
          cardSlug={cardSlug}
          playlist={playlist}
          size="md"
        />

        {/* Song info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{song.title}</p>
          <p className="text-xs text-gray-500">{song.artist || 'EZViet'}</p>
        </div>

        {/* Duration or progress */}
        <span className="text-xs text-gray-500 tabular-nums">
          {isThisSongActive
            ? `${formatTime(displayCurrentTime)} / ${formatTime(displayDuration)}`
            : formatTime(displayDuration)
          }
        </span>
      </div>
    );
  }

  // Full mode
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-purple-500 flex items-center justify-center text-2xl">
            🎵
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate">{song.title}</h3>
          <p className="text-purple-200 text-sm">{song.artist || 'EZViet'}</p>
          {song.level && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-500 rounded text-xs">
              Level {song.level}
            </span>
          )}
        </div>
      </div>

      {/* Purpose */}
      {song.purpose && (
        <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
          <p className="text-sm text-purple-800">{song.purpose}</p>
        </div>
      )}

      {/* Audio Player Controls */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          {/* Unified play button */}
          <PlayKaraokeButton
            song={song}
            cardSlug={cardSlug}
            playlist={playlist}
            size="lg"
          />

          <div className="flex-1 space-y-1">
            <input
              type="range"
              min="0"
              max={displayDuration || 100}
              value={displayCurrentTime}
              onChange={handleSeek}
              disabled={!isThisSongActive}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-xs text-gray-500 tabular-nums">
              <span>{formatTime(displayCurrentTime)}</span>
              <span>{formatTime(displayDuration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Karaoke Lyrics */}
      {showLyrics && hasLyrics && isThisSongActive && (
        <KaraokeLyrics
          lrcLyrics={song.lyrics_lrc}
          plainLyrics={song.lyrics_plain}
          currentTime={displayCurrentTime}
          isExpanded={showFullLyrics}
          onToggle={() => setShowFullLyrics(!showFullLyrics)}
          onSeek={handleSeekToTime}
          maxHeight="max-h-64"
        />
      )}

      {/* Learning Goal */}
      {song.learning_goal && (
        <div className="px-4 py-3 bg-green-50 border-t">
          <p className="text-sm text-green-800">
            <span className="font-medium">Goal:</span> {song.learning_goal}
          </p>
        </div>
      )}

      {/* Download */}
      <div className="px-4 py-3 border-t flex justify-end">
        <a
          href={`/api/songs/${song.id}/download`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
        >
          <span>⬇️</span>
          Download
        </a>
      </div>
    </div>
  );
}
