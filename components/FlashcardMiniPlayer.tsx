'use client';

import type { CardSong } from '@/lib/supabase/types';
import { PlayKaraokeButton } from './PlayKaraokeButton';

interface FlashcardMiniPlayerProps {
  currentSong: CardSong;
  cardSlug: string;
  songs: CardSong[];
  currentSongIndex: number;
  songCount: number;
  hasMultipleSongs: boolean;
  currentTime: number;
  duration: number;
  getCoverUrl: (song: CardSong) => string | null;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrevious: (e?: React.MouseEvent) => void;
  onNext: (e?: React.MouseEvent) => void;
  onClose: (e?: React.MouseEvent) => void;
}

// Helper to format seconds as MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function FlashcardMiniPlayer({
  currentSong,
  cardSlug,
  songs,
  currentSongIndex,
  songCount,
  hasMultipleSongs,
  currentTime,
  duration,
  getCoverUrl,
  onSeek,
  onPrevious,
  onNext,
  onClose,
}: FlashcardMiniPlayerProps) {
  return (
    <div
      className="bg-gradient-to-r from-purple-50 to-indigo-50 border-t border-purple-100 px-4 py-3"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Row 1: Cover + Title + Close */}
      <div className="flex items-center gap-3">
        {/* Cover Art */}
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-purple-100 flex-shrink-0 flex items-center justify-center">
          {getCoverUrl(currentSong) ? (
            <img
              src={getCoverUrl(currentSong)!}
              alt={currentSong.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl">🎵</span>
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

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          title="Close player"
        >
          ✕
        </button>
      </div>

      {/* Row 2: Progress bar */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-gray-400 w-9 text-right tabular-nums">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={onSeek}
          className="flex-1 h-1.5 bg-purple-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:rounded-full"
        />
        <span className="text-xs text-gray-400 w-9 tabular-nums">
          {formatTime(duration)}
        </span>
      </div>

      {/* Row 3: Playback controls (centered) */}
      <div className="flex items-center justify-center gap-4 mt-3">
        {hasMultipleSongs && (
          <button
            onClick={onPrevious}
            className="w-10 h-10 flex items-center justify-center text-purple-600 hover:bg-purple-100 rounded-full transition-colors text-lg"
            title="Previous song"
          >
            ⏮
          </button>
        )}
        {/* Unified play button for current song */}
        <PlayKaraokeButton
          song={currentSong}
          cardSlug={cardSlug}
          playlist={songs}
          size="lg"
        />
        {hasMultipleSongs && (
          <button
            onClick={onNext}
            className="w-10 h-10 flex items-center justify-center text-purple-600 hover:bg-purple-100 rounded-full transition-colors text-lg"
            title="Next song"
          >
            ⏭
          </button>
        )}
      </div>

      {/* Song counter for multiple songs */}
      {hasMultipleSongs && (
        <div className="text-center mt-2">
          <span className="text-xs text-purple-600 font-medium">
            {currentSongIndex + 1} of {songCount} songs
          </span>
        </div>
      )}
    </div>
  );
}
