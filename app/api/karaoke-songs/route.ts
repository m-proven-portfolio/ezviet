import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type SortOption = 'newest' | 'oldest' | 'title' | 'duration';

/**
 * GET /api/karaoke-songs
 *
 * Returns all "karaoke-ready" songs - songs that have:
 * - lyrics_lrc (timed lyrics for karaoke sync)
 * - storage_path (audio file)
 *
 * Query params:
 * - genre: Filter by single genre (legacy, e.g., "Lo-Fi")
 * - genres: Filter by multiple genres, comma-separated (e.g., "Lo-Fi,Hip-Hop")
 * - search: Search in title and artist
 * - sort: "newest" | "oldest" | "title" | "duration"
 * - cardId: Filter by card ID (all songs teaching this word)
 * - primaryOnly: If "true", only show primary versions (hide variations)
 *
 * Includes card info for context (what word/phrase the song teaches)
 * Includes variation metadata (parent_song_id, variation_label, is_primary)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    // Parse query params
    const genre = searchParams.get('genre'); // Legacy single genre
    const genresParam = searchParams.get('genres'); // New multi-genre (comma-separated)
    const search = searchParams.get('search')?.toLowerCase();
    const sort = (searchParams.get('sort') || 'newest') as SortOption;
    const cardId = searchParams.get('cardId');
    const primaryOnly = searchParams.get('primaryOnly') === 'true';

    // Parse genres (support both single and multi-genre)
    const genres: string[] = [];
    if (genresParam) {
      genres.push(...genresParam.split(',').map((g) => g.trim()).filter(Boolean));
    } else if (genre) {
      genres.push(genre);
    }

    // Build query with variation fields included
    let query = supabase
      .from('card_songs')
      .select(`
        id,
        card_id,
        slug,
        title,
        artist,
        album,
        year,
        storage_path,
        file_size,
        mime_type,
        cover_image_path,
        level,
        purpose,
        learning_goal,
        duration_seconds,
        lyrics_lrc,
        lyrics_plain,
        lyrics_enhanced,
        genre,
        genres,
        timing_offset,
        sort_order,
        created_at,
        updated_at,
        parent_song_id,
        variation_label,
        is_primary,
        card:cards(
          id,
          slug,
          image_path,
          category:categories(name, icon),
          terms:card_terms(lang, text, romanization)
        )
      `)
      .not('lyrics_lrc', 'is', null)
      .not('storage_path', 'is', null);

    // Filter by card ID (all songs for a specific vocabulary word)
    if (cardId) {
      query = query.eq('card_id', cardId);
    }

    // Filter to primary only (hide variations)
    if (primaryOnly) {
      query = query.or('is_primary.eq.true,is_primary.is.null');
    }

    // Genre filter - support both single genre (eq) and multi-genre (overlaps)
    if (genres.length === 1) {
      // Single genre: check both legacy 'genre' field and new 'genres' array
      query = query.or(`genre.eq.${genres[0]},genres.cs.{${genres[0]}}`);
    } else if (genres.length > 1) {
      // Multi-genre: use overlaps operator on genres array
      // This returns songs that have ANY of the selected genres
      query = query.overlaps('genres', genres);
    }

    // Sort options
    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'title':
        query = query.order('title', { ascending: true });
        break;
      case 'duration':
        query = query.order('duration_seconds', { ascending: true, nullsFirst: false });
        break;
      default: // newest
        query = query.order('created_at', { ascending: false });
    }

    const { data: songs, error } = await query;

    if (error) {
      console.error('Error fetching karaoke songs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter out songs with empty lyrics_lrc (just in case)
    let karaokeSongs =
      songs?.filter((song) => song.lyrics_lrc && song.lyrics_lrc.trim().length > 0) ?? [];

    // Client-side search (title, artist) - keeps API simple
    if (search) {
      karaokeSongs = karaokeSongs.filter(
        (song) =>
          song.title.toLowerCase().includes(search) ||
          song.artist?.toLowerCase().includes(search)
      );
    }

    // Extract unique genres for filter UI (from both 'genre' and 'genres' fields)
    const allGenres = new Set<string>();
    karaokeSongs.forEach((song) => {
      if (song.genre) allGenres.add(song.genre);
      if (song.genres) {
        (song.genres as string[]).forEach((g) => allGenres.add(g));
      }
    });

    return NextResponse.json({
      songs: karaokeSongs,
      availableGenres: Array.from(allGenres).sort(),
      totalCount: karaokeSongs.length,
    });
  } catch (error) {
    console.error('Error in karaoke-songs API:', error);
    return NextResponse.json({ error: 'Failed to fetch karaoke songs' }, { status: 500 });
  }
}
