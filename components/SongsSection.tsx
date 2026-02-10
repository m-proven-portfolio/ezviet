'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CardSong } from '@/lib/supabase/types';
import { SongPlayer } from './SongPlayer';
import { useAudioStore } from '@/lib/stores/audioStore';

interface SongsSectionProps {
  songs: CardSong[];
  cardSlug: string;
}

/**
 * Songs section for the full card page.
 * All play buttons trigger Karaoke Hero via the unified SongPlayer component.
 */
export function SongsSection({ songs, cardSlug }: SongsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get current song from global store to highlight active song
  const { currentSong, currentCardSlug, showLyrics } = useAudioStore();

  // Check if any song in this section is currently active
  const isThisCardActive = currentCardSlug === cardSlug;
  const activeSongIndex = isThisCardActive && currentSong
    ? songs.findIndex(s => s.id === currentSong.id)
    : -1;

  if (songs.length === 0) return null;

  const hasMultipleSongs = songs.length > 1;

  return (
    <div className="mt-6">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-purple-100 rounded-t-xl text-purple-800 font-semibold hover:bg-purple-200 transition-colors"
      >
        <span>Learning Songs ({songs.length})</span>
        <span className="text-xl">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="bg-white rounded-b-xl shadow-lg p-4 space-y-4">
          {songs.map((song, index) => (
            <div key={song.id}>
              {/* Show full player for active song, compact for others */}
              <SongPlayer
                song={song}
                cardSlug={cardSlug}
                playlist={songs}
                compact={activeSongIndex !== index}
                showLyrics={activeSongIndex === index}
                defaultLyricsExpanded={showLyrics && activeSongIndex === index}
              />

              {/* Song counter for multiple songs when this is the active song */}
              {hasMultipleSongs && activeSongIndex === index && (
                <div className="mt-2 text-center">
                  <span className="text-sm text-purple-600 font-medium">
                    {index + 1} of {songs.length} songs
                  </span>
                </div>
              )}

              {/* Link to full song page */}
              <div className="mt-2 text-center">
                <Link
                  href={`/learn/${cardSlug}/songs/${song.slug}`}
                  className="text-sm text-purple-600 hover:text-purple-800"
                >
                  View full song page →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
