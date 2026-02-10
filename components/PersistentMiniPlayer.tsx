'use client';

import { useMemo } from 'react';
import { ChevronUp, Gamepad2 } from 'lucide-react';
import { useAudioStore } from '@/lib/stores/audioStore';
import { getStorageUrl } from '@/lib/utils';
import { parseLrc, getCurrentLineIndex, isLrcFormat } from '@/lib/lrc-parser';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Spacer component to prevent content from being hidden behind the fixed player
export function MiniPlayerSpacer() {
  const { currentSong, miniPlayerDismissed, karaokeLevel } = useAudioStore();

  // Only show spacer when mini player (level 1) is visible
  if (!currentSong || miniPlayerDismissed || karaokeLevel !== 1) {
    return null;
  }

  // Height matches the mini-player: ~140px with lyrics, ~88px without
  return <div className="h-36 sm:h-28" />;
}

export function PersistentMiniPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    playlist,
    playlistIndex,
    miniPlayerDismissed,
    karaokeLevel,
    lyricsOffset,
    pause,
    resume,
    seek,
    nextSong,
    prevSong,
    stepDownKaraoke,
    setKaraokeLevel,
    launchKaraokeHero,
  } = useAudioStore();

  // Parse lyrics for inline display
  const { lines, hasTimestamps } = useMemo(() => {
    if (!currentSong) return { lines: [], hasTimestamps: false };

    const lrcLyrics = currentSong.lyrics_lrc;
    if (lrcLyrics && isLrcFormat(lrcLyrics)) {
      const parsed = parseLrc(lrcLyrics);
      if (parsed.length > 0) {
        return { lines: parsed, hasTimestamps: true };
      }
    }

    return { lines: [], hasTimestamps: false };
  }, [currentSong]);

  // Determine effective offset (per-song override or global)
  const effectiveOffset = useMemo(() => {
    const songOffset = (currentSong as { timing_offset?: number | null })?.timing_offset;
    if (songOffset !== null && songOffset !== undefined) {
      return songOffset;
    }
    return lyricsOffset;
  }, [currentSong, lyricsOffset]);

  // Get current line index (with user-adjustable offset)
  const currentLineIndex = useMemo(() => {
    if (!hasTimestamps || lines.length === 0) return -1;
    return getCurrentLineIndex(lines, currentTime, effectiveOffset);
  }, [hasTimestamps, lines, currentTime, effectiveOffset]);

  // Get next 3 lines (current + 2 upcoming)
  const displayLines = useMemo(() => {
    if (lines.length === 0) return [];
    const startIdx = Math.max(0, currentLineIndex);
    return lines.slice(startIdx, startIdx + 3);
  }, [lines, currentLineIndex]);

  // Only render at level 1 (footer bar)
  // Hide when no song, user dismissed, or at higher levels (theater/hero)
  if (!currentSong || miniPlayerDismissed || karaokeLevel !== 1) {
    return null;
  }

  const hasMultipleSongs = playlist.length > 1;
  const hasLyrics = lines.length > 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  const getCoverUrl = () => {
    if (currentSong.cover_image_path) {
      return getStorageUrl('cards-images', currentSong.cover_image_path);
    }
    return null;
  };

  const handleExpand = () => {
    // Expand from level 1 (footer) to level 2 (theater)
    setKaraokeLevel(2);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
      {/* Progress bar (thin line at top of player) */}
      <div className="h-1 bg-gray-100 relative">
        <div
          className="absolute inset-y-0 left-0 bg-purple-600 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="px-4 py-2">
        {/* Main controls row */}
        <div className="flex items-center gap-3 max-w-screen-lg mx-auto">
          {/* Cover Art */}
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-purple-100 flex-shrink-0 flex items-center justify-center">
            {getCoverUrl() ? (
              <img
                src={getCoverUrl()!}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl">🎵</span>
            )}
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate text-sm">
              {currentSong.title}
            </p>
            {currentSong.artist && (
              <p className="text-xs text-gray-500 truncate">
                {currentSong.artist}
              </p>
            )}
          </div>

          {/* Time display (desktop only) */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Game button (when timed lyrics available) */}
          {hasLyrics && hasTimestamps && (
            <button
              onClick={launchKaraokeHero}
              className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full hover:from-yellow-600 hover:to-orange-600 transition-colors shadow-md"
              title="Play Karaoke Hero"
            >
              <Gamepad2 className="w-5 h-5" />
            </button>
          )}

          {/* Expand button (when lyrics available) */}
          {hasLyrics && (
            <button
              onClick={handleExpand}
              className="w-10 h-10 flex items-center justify-center text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
              title="Expand karaoke"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          )}

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Previous button */}
            {hasMultipleSongs && (
              <button
                onClick={prevSong}
                disabled={playlistIndex === 0}
                className="w-10 h-10 flex items-center justify-center text-purple-600 hover:bg-purple-50 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous song"
              >
                <span className="text-lg">⏮</span>
              </button>
            )}

            {/* Play/Pause button */}
            <button
              onClick={togglePlay}
              className="w-12 h-12 flex items-center justify-center bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors text-xl"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Next button */}
            {hasMultipleSongs && (
              <button
                onClick={nextSong}
                disabled={playlistIndex === playlist.length - 1}
                className="w-10 h-10 flex items-center justify-center text-purple-600 hover:bg-purple-50 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next song"
              >
                <span className="text-lg">⏭</span>
              </button>
            )}
          </div>

          {/* Close button - steps down from level 1 to 0 (closed) */}
          <button
            onClick={stepDownKaraoke}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors ml-1"
            title="Close player"
          >
            <span className="text-lg">✕</span>
          </button>
        </div>

        {/* Inline lyrics - next 3 lines */}
        {hasLyrics && displayLines.length > 0 && (
          <div
            className="mt-2 max-w-screen-lg mx-auto cursor-pointer hover:bg-purple-50 rounded-lg py-1 px-2 -mx-2 transition-colors"
            onClick={handleExpand}
          >
            <div className="flex flex-col items-center gap-0.5 text-center">
              {displayLines.map((line, idx) => (
                <p
                  key={`${line.time}-${idx}`}
                  className={`text-sm truncate max-w-full transition-all ${
                    idx === 0
                      ? 'text-purple-700 font-medium'
                      : 'text-gray-400 text-xs'
                  }`}
                >
                  {line.text}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Seekable progress bar (mobile: full width below controls) */}
        <div className="mt-2 sm:hidden">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-purple-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:rounded-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
