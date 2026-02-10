'use client';

import { Suspense, useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mic2, Music, ArrowLeft, Loader2 } from 'lucide-react';
import { useAudioStore } from '@/lib/stores/audioStore';
import { KaraokeShareButton } from '@/components/karaoke/KaraokeShareButton';
import { KaraokeSongCard, type KaraokeSong } from '@/components/karaoke/KaraokeSongCard';
import { KaraokeFilters, type SortOption } from '@/components/karaoke/KaraokeFilters';
import {
  KaraokeWelcomeModal,
  hasSeenWelcome,
  getPreferredGenres,
} from '@/components/karaoke/KaraokeWelcomeModal';
import { createClient } from '@/lib/supabase/client';
import type { CardSong } from '@/lib/supabase/types';

interface CardTerm {
  lang: string;
  text: string;
  romanization: string | null;
}

interface CardInfo {
  id: string;
  slug: string;
  image_path: string;
  category: { name: string; icon: string | null } | null;
  terms: CardTerm[];
}

type CardInfoRaw = Omit<CardInfo, 'category' | 'terms'> & {
  category: CardInfo['category'] | CardInfo['category'][] | null;
  terms?: CardTerm[] | null;
};

type KaraokeSongRaw = CardSong & { card: CardInfoRaw | CardInfoRaw[] | null };

// Wrapper to handle Suspense boundary for useSearchParams (required in Next.js 14+)
export default function KaraokeHeroPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </main>
      }
    >
      <KaraokeHeroContent />
    </Suspense>
  );
}

function KaraokeHeroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Core state
  const [allSongs, setAllSongs] = useState<KaraokeSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state (synced with URL params)
  const [showWelcome, setShowWelcome] = useState(false);
  // Parse genres from URL - support both legacy 'genre' and new 'genres' params
  const [selectedGenres, setSelectedGenres] = useState<string[]>(() => {
    const genresParam = searchParams.get('genres');
    const genreParam = searchParams.get('genre');
    if (genresParam) {
      return genresParam.split(',').filter(Boolean);
    } else if (genreParam) {
      return [genreParam];
    }
    return [];
  });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'newest');

  const { playSong, launchKaraokeHero, currentSong, isPlaying } = useAudioStore();

  // Compute available genres (only those with songs) - check both 'genre' and 'genres' fields
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    allSongs.forEach((s) => {
      if (s.genre) genreSet.add(s.genre);
      // Also check genres array if present
      const songsGenres = (s as KaraokeSong & { genres?: string[] }).genres;
      if (songsGenres && Array.isArray(songsGenres)) {
        songsGenres.forEach((g) => genreSet.add(g));
      }
    });
    return Array.from(genreSet).sort();
  }, [allSongs]);

  // Client-side filtered and sorted songs
  const filteredSongs = useMemo(() => {
    let result = [...allSongs];

    // Multi-genre filter - show songs that have ANY of the selected genres
    if (selectedGenres.length > 0) {
      result = result.filter((s) => {
        // Check legacy genre field
        if (s.genre && selectedGenres.includes(s.genre)) return true;
        // Check genres array field
        const songGenres = (s as KaraokeSong & { genres?: string[] }).genres;
        if (songGenres && Array.isArray(songGenres)) {
          return songGenres.some((g) => selectedGenres.includes(g));
        }
        return false;
      });
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(searchLower) ||
          s.artist?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    switch (sort) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'duration':
        result.sort((a, b) => (a.duration_seconds || 0) - (b.duration_seconds || 0));
        break;
      default: // newest
        result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return result;
  }, [allSongs, selectedGenres, search, sort]);

  // Check for first visit
  useEffect(() => {
    if (!loading && availableGenres.length > 0 && !hasSeenWelcome()) {
      setShowWelcome(true);
    } else if (!loading && selectedGenres.length === 0) {
      // Apply saved preferences if no URL param
      const prefs = getPreferredGenres();
      if (prefs.length > 0) {
        setSelectedGenres(prefs);
      }
    }
  }, [loading, availableGenres, selectedGenres.length]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedGenres.length > 0) params.set('genres', selectedGenres.join(','));
    if (search) params.set('search', search);
    if (sort !== 'newest') params.set('sort', sort);

    const query = params.toString();
    router.replace(query ? `?${query}` : '/karaoke', { scroll: false });
  }, [selectedGenres, search, sort, router]);

  // Normalization helpers
  function normalizeCardInfo(card: CardInfoRaw | CardInfoRaw[] | null): CardInfo | null {
    if (!card) return null;
    const cardInfo = Array.isArray(card) ? card[0] ?? null : card;
    if (!cardInfo) return null;
    const normalizedCategory = Array.isArray(cardInfo.category)
      ? cardInfo.category[0] ?? null
      : cardInfo.category ?? null;
    return { ...cardInfo, category: normalizedCategory, terms: cardInfo.terms || [] };
  }

  function normalizeSong(song: KaraokeSongRaw): KaraokeSong {
    return {
      id: song.id,
      card_id: song.card_id,
      slug: song.slug ?? '',
      storage_path: song.storage_path,
      duration_seconds: song.duration_seconds ?? null,
      file_size: song.file_size ?? null,
      mime_type: song.mime_type ?? 'audio/mpeg',
      title: song.title,
      artist: song.artist ?? null,
      album: song.album ?? null,
      year: song.year ?? null,
      cover_image_path: song.cover_image_path ?? null,
      level: song.level ?? null,
      purpose: song.purpose ?? null,
      learning_goal: song.learning_goal ?? null,
      lyrics_lrc: song.lyrics_lrc ?? null,
      lyrics_plain: song.lyrics_plain ?? null,
      lyrics_enhanced: song.lyrics_enhanced ?? null,
      genre: song.genre ?? null,
      genres: (song as KaraokeSongRaw & { genres?: string[] | null }).genres ?? null,
      timing_offset: song.timing_offset ?? null,
      sort_order: song.sort_order ?? 0,
      created_at: song.created_at ?? '',
      updated_at: song.updated_at ?? song.created_at ?? '',
      parent_song_id: (song as KaraokeSongRaw & { parent_song_id?: string | null }).parent_song_id ?? null,
      variation_label: (song as KaraokeSongRaw & { variation_label?: string | null }).variation_label ?? null,
      is_primary: (song as KaraokeSongRaw & { is_primary?: boolean | null }).is_primary ?? null,
      card: normalizeCardInfo(song.card),
    };
  }

  function normalizeSongs(raw: unknown): KaraokeSong[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((song) => song?.lyrics_lrc && song.lyrics_lrc.trim().length > 0)
      .map((song) => normalizeSong(song as KaraokeSongRaw));
  }

  // Fetch functions
  const fetchSongsFromSupabase = useCallback(async () => {
    const supabase = createClient();
    const { data: songs, error } = await supabase
      .from('card_songs')
      .select(
        `id, card_id, slug, title, artist, album, year, storage_path, file_size, mime_type,
         cover_image_path, level, purpose, learning_goal, duration_seconds, lyrics_lrc,
         lyrics_plain, lyrics_enhanced, genre, timing_offset, sort_order, created_at, updated_at,
         card:cards(id, slug, image_path, category:categories(name, icon), terms:card_terms(lang, text, romanization))`
      )
      .not('lyrics_lrc', 'is', null)
      .not('storage_path', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    setAllSongs(normalizeSongs(songs));
  }, []);

  const fetchSongs = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch('/api/karaoke-songs', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('Failed to fetch songs');
      const data = await res.json();
      // Handle new API response structure: { songs, availableGenres, totalCount }
      const songsArray = data.songs || data; // Support both new and legacy format
      setAllSongs(normalizeSongs(songsArray));
    } catch {
      try {
        await fetchSongsFromSupabase();
      } catch (fallbackErr) {
        setError(fallbackErr instanceof Error ? fallbackErr.message : 'Failed to load songs');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchSongsFromSupabase]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  function handlePlaySong(song: KaraokeSong) {
    const cardSlug = song.card?.slug || 'unknown';
    playSong(song, cardSlug, allSongs);
    launchKaraokeHero();
  }

  function handleWelcomeSelect(genres: string[]) {
    setShowWelcome(false);
    if (genres.length > 0) {
      setSelectedGenres(genres);
    }
  }

  function clearFilters() {
    setSelectedGenres([]);
    setSearch('');
    setSort('newest');
  }

  const hasFilters = selectedGenres.length > 0 || search;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900">
      {/* Welcome Modal */}
      {showWelcome && availableGenres.length > 0 && (
        <KaraokeWelcomeModal
          genres={availableGenres}
          onSelect={handleWelcomeSelect}
          onDismiss={() => setShowWelcome(false)}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-white/70 hover:text-white transition-colors p-2 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <Mic2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Karaoke Hero</h1>
                  <p className="text-sm text-white/60">Sing along & learn Vietnamese</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm hidden sm:inline">
                {allSongs.length} {allSongs.length === 1 ? 'song' : 'songs'}
              </span>
              <KaraokeShareButton
                title="Karaoke Hero on EZViet"
                text={`Learn Vietnamese through music with Karaoke Hero! ${allSongs.length} songs available.`}
                url="https://ezviet.org/karaoke"
                variant="icon"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-4" />
            <p className="text-white/60">Loading karaoke songs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchSongs();
              }}
              className="text-purple-400 hover:text-purple-300"
            >
              Try again
            </button>
          </div>
        ) : allSongs.length === 0 ? (
          <div className="text-center py-20">
            <Music className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No karaoke songs yet</h2>
            <p className="text-white/60 mb-6">Songs with timed lyrics (LRC) will appear here</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors"
            >
              Browse Flashcards
            </Link>
          </div>
        ) : (
          <>
            {/* Filters */}
            {availableGenres.length > 0 && (
              <div className="mb-6">
                <KaraokeFilters
                  genres={availableGenres}
                  selectedGenres={selectedGenres}
                  onGenresChange={setSelectedGenres}
                  search={search}
                  onSearchChange={setSearch}
                  sort={sort}
                  onSortChange={setSort}
                  totalCount={allSongs.length}
                  filteredCount={filteredSongs.length}
                />
              </div>
            )}

            {/* Song Grid */}
            {filteredSongs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSongs.map((song) => (
                  <KaraokeSongCard
                    key={song.id}
                    song={song}
                    isPlaying={currentSong?.id === song.id && isPlaying}
                    onClick={() => handlePlaySong(song)}
                  />
                ))}
              </div>
            ) : hasFilters ? (
              <div className="text-center py-20">
                <Music className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">No songs found</h2>
                <p className="text-white/60 mb-4">Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="text-purple-400 hover:text-purple-300">
                  Clear filters
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
