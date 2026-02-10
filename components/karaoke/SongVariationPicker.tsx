'use client';

import { useEffect, useState } from 'react';
import { Disc3, Loader2 } from 'lucide-react';

interface SongVariation {
  id: string;
  title: string;
  artist: string | null;
  genre: string | null;
  genres: string[] | null;
  variation_label: string | null;
  is_primary: boolean | null;
  parent_song_id: string | null;
  duration_seconds: number | null;
}

interface SongVariationPickerProps {
  currentSongId: string;
  onSelectVariation: (songId: string) => void;
}

/**
 * Shows alternative versions of a song when variations exist.
 * Displays genre pills that users can click to switch versions.
 */
export function SongVariationPicker({ currentSongId, onSelectVariation }: SongVariationPickerProps) {
  const [variations, setVariations] = useState<SongVariation[]>([]);
  const [original, setOriginal] = useState<SongVariation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVariations() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/songs/${currentSongId}/variations`);
        if (!res.ok) throw new Error('Failed to fetch variations');

        const data = await res.json();
        setOriginal(data.original || null);
        setVariations(data.variations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }

    fetchVariations();
  }, [currentSongId]);

  // Don't show if no variations exist
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/40 text-sm">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Loading versions...</span>
      </div>
    );
  }

  if (error || variations.length === 0) {
    return null; // Hide if no variations
  }

  // Build list of all versions (original + variations)
  const allVersions = original ? [original, ...variations] : variations;

  // Get display label for a version
  const getLabel = (song: SongVariation): string => {
    if (song.variation_label) return song.variation_label;
    if (song.genres && song.genres.length > 0) return song.genres[0];
    if (song.genre) return song.genre;
    if (song.is_primary || !song.parent_song_id) return 'Original';
    return 'Version';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-white/60 text-xs">
        <Disc3 className="w-3 h-3" />
        <span>Also available in:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {allVersions.map((version) => {
          const isActive = version.id === currentSongId;
          const label = getLabel(version);

          return (
            <button
              key={version.id}
              onClick={() => !isActive && onSelectVariation(version.id)}
              disabled={isActive}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-all
                ${
                  isActive
                    ? 'bg-white text-purple-900 cursor-default'
                    : 'bg-white/10 text-white/80 hover:bg-white/20 cursor-pointer'
                }
              `}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
