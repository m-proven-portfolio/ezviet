'use client';

import { useState, useMemo } from 'react';
import { GitBranch } from 'lucide-react';
import type { CardSong } from '@/lib/supabase/types';
import SongEditor from './SongEditor';

interface SongListProps {
  songs: CardSong[];
  onDelete: (songId: string) => void;
  onReorder: (songIds: string[]) => void;
  onUpdate?: (updatedSong: CardSong) => void;
}

export default function SongList({ songs, onDelete, onReorder, onUpdate }: SongListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Group songs by parent (originals first, then their variations)
  const groupedSongs = useMemo(() => {
    const originals = songs.filter((s) => !s.parent_song_id);
    const variationMap = new Map<string, CardSong[]>();

    // Group variations by parent
    songs.forEach((s) => {
      if (s.parent_song_id) {
        const existing = variationMap.get(s.parent_song_id) || [];
        variationMap.set(s.parent_song_id, [...existing, s]);
      }
    });

    // Build flat list with parent/child ordering
    const result: Array<CardSong & { isVariation?: boolean; variationCount?: number }> = [];
    originals.forEach((original) => {
      const variations = variationMap.get(original.id) || [];
      result.push({ ...original, variationCount: variations.length });
      variations.forEach((v) => result.push({ ...v, isVariation: true }));
    });

    // Add orphan variations (parent deleted?)
    songs
      .filter((s) => s.parent_song_id && !originals.find((o) => o.id === s.parent_song_id))
      .forEach((s) => result.push({ ...s, isVariation: true }));

    return result;
  }, [songs]);

  function formatDuration(seconds: number | null): string {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async function handleDelete(songId: string) {
    if (!confirm('Delete this song?')) return;

    setDeletingId(songId);
    try {
      const res = await fetch(`/api/songs/${songId}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(songId);
      }
    } finally {
      setDeletingId(null);
    }
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const newOrder = [...songs];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onReorder(newOrder.map(s => s.id));
  }

  function moveDown(index: number) {
    if (index === songs.length - 1) return;
    const newOrder = [...songs];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onReorder(newOrder.map(s => s.id));
  }

  function handleSongUpdate(updatedSong: CardSong) {
    // Don't close editor - let auto-save update silently
    // Editor closes only when user clicks Done/X
    onUpdate?.(updatedSong);
  }

  if (songs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No songs yet. Add one above!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groupedSongs.map((song, index) => {
        const isVariation = 'isVariation' in song && song.isVariation;
        const variationCount = 'variationCount' in song ? song.variationCount : 0;
        const displayLabel = song.variation_label || (song.genres?.[0]) || song.genre;

        return (
          <div key={song.id}>
            {editingId === song.id ? (
              <SongEditor
                song={song}
                onSave={handleSongUpdate}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  isVariation ? 'bg-purple-50 ml-6 border-l-2 border-purple-300' : 'bg-gray-50'
                }`}
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === groupedSongs.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move down"
                  >
                    ▼
                  </button>
                </div>

                {/* Cover or icon */}
                {song.cover_image_path ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cards-images/${song.cover_image_path}`}
                    alt=""
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-purple-100 flex items-center justify-center text-xl">
                    {isVariation ? '🔀' : '🎵'}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 truncate">{song.title}</p>
                    {song.lyrics_lrc && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium shrink-0">
                        🎤 LRC
                      </span>
                    )}
                    {isVariation && displayLabel && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium shrink-0">
                        {displayLabel}
                      </span>
                    )}
                    {variationCount && variationCount > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium shrink-0 flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        {variationCount} version{variationCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {song.artist || 'Unknown'} • {formatDuration(song.duration_seconds)}
                    {song.level && ` • Level ${song.level}`}
                  </p>
                </div>

                {/* Audio preview */}
                <audio
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cards-songs/${song.storage_path}`}
                  controls
                  className="h-8 w-32"
                />

                {/* Edit */}
                <button
                  onClick={() => setEditingId(song.id)}
                  className="text-purple-500 hover:text-purple-700 p-2"
                  title="Edit song"
                >
                  ✏️
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(song.id)}
                  disabled={deletingId === song.id}
                  className="text-red-500 hover:text-red-700 p-2"
                  title="Delete"
                >
                  {deletingId === song.id ? '...' : '🗑️'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
