import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { cloneLrcBatch } from '@/lib/songs/cloneLrc';

interface RouteContext {
  params: Promise<{ songId: string }>;
}

interface VariationInput {
  storage_path: string;
  title: string;
  genre?: string;
  genres?: string[];
  variation_label?: string;
  artist?: string;
  album?: string;
  duration_seconds?: number;
  file_size?: number;
  cover_image_path?: string;
}

/**
 * GET /api/songs/[id]/variations
 *
 * Returns all variations of a song (songs where parent_song_id = id).
 * Also returns the parent song data if the given ID is a variation itself.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { songId: parentSongId } = await context.params;
    const supabase = createAdminClient();

    // First, check if this song exists and get its parent_song_id
    const { data: song, error: songError } = await supabase
      .from('card_songs')
      .select('id, parent_song_id, card_id, title')
      .eq('id', parentSongId)
      .single();

    if (songError || !song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    // If this is a variation, get the parent's variations instead
    const effectiveParentId = song.parent_song_id || song.id;

    // Get all variations (including the original)
    const { data: variations, error: variationsError } = await supabase
      .from('card_songs')
      .select(
        `
        id,
        title,
        artist,
        genre,
        genres,
        variation_label,
        is_primary,
        parent_song_id,
        storage_path,
        duration_seconds,
        cover_image_path,
        lyrics_lrc,
        created_at
      `
      )
      .or(`id.eq.${effectiveParentId},parent_song_id.eq.${effectiveParentId}`)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (variationsError) {
      console.error('Error fetching variations:', variationsError);
      return NextResponse.json({ error: variationsError.message }, { status: 500 });
    }

    // Identify the original (parent) song
    const original = variations?.find((v) => v.id === effectiveParentId);
    const variationList = variations?.filter((v) => v.parent_song_id === effectiveParentId) || [];

    return NextResponse.json({
      original,
      variations: variationList,
      totalCount: (variations?.length || 0),
    });
  } catch (error) {
    console.error('Error fetching variations:', error);
    return NextResponse.json({ error: 'Failed to fetch variations' }, { status: 500 });
  }
}

/**
 * POST /api/songs/[id]/variations
 *
 * Creates one or more variations of a parent song.
 * Optionally clones LRC from the parent song.
 *
 * Request body:
 * {
 *   variations: [{ storage_path, title, genre, variation_label, ... }],
 *   cloneLrc: boolean,
 *   userId: string  // Required for LRC version history
 * }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { songId: parentSongId } = await context.params;
    const body = await request.json();
    const { variations, cloneLrc, userId } = body as {
      variations: VariationInput[];
      cloneLrc?: boolean;
      userId?: string;
    };

    if (!variations || !Array.isArray(variations) || variations.length === 0) {
      return NextResponse.json(
        { error: 'No variations provided. Expected { variations: [...] }' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Verify parent song exists and get its data
    const { data: parentSong, error: parentError } = await supabase
      .from('card_songs')
      .select('id, card_id, title, lyrics_lrc, artist, album')
      .eq('id', parentSongId)
      .single();

    if (parentError || !parentSong) {
      return NextResponse.json({ error: 'Parent song not found' }, { status: 404 });
    }

    // 2. Mark parent as primary if not already (it's the original)
    await supabase
      .from('card_songs')
      .update({ is_primary: true, parent_song_id: null })
      .eq('id', parentSongId);

    // 3. Get next sort_order for the card
    const { data: existingSongs } = await supabase
      .from('card_songs')
      .select('sort_order')
      .eq('card_id', parentSong.card_id)
      .order('sort_order', { ascending: false })
      .limit(1);

    let nextSortOrder =
      existingSongs && existingSongs.length > 0 ? existingSongs[0].sort_order + 1 : 1;

    // 4. Create variation records
    const variationRecords = variations.map((v, index) => ({
      card_id: parentSong.card_id,
      parent_song_id: parentSongId,
      storage_path: v.storage_path,
      title: v.title,
      artist: v.artist || parentSong.artist,
      album: v.album || parentSong.album,
      genre: v.genre || null,
      genres: v.genres || (v.genre ? [v.genre] : null),
      variation_label: v.variation_label || null,
      is_primary: false,
      duration_seconds: v.duration_seconds || null,
      file_size: v.file_size || null,
      cover_image_path: v.cover_image_path || null,
      mime_type: 'audio/mpeg',
      sort_order: nextSortOrder + index,
      // Don't copy LRC yet - will clone separately if requested
      lyrics_lrc: null,
      lyrics_plain: null,
    }));

    const { data: createdVariations, error: insertError } = await supabase
      .from('card_songs')
      .insert(variationRecords)
      .select();

    if (insertError) {
      console.error('Error creating variations:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 5. Clone LRC if requested and parent has LRC
    let lrcCloneResults = null;
    if (cloneLrc && parentSong.lyrics_lrc && createdVariations && userId) {
      const targetIds = createdVariations.map((v) => v.id);
      lrcCloneResults = await cloneLrcBatch(parentSongId, targetIds, userId, supabase);
    }

    return NextResponse.json(
      {
        created: createdVariations,
        lrcCloned: lrcCloneResults,
        parentSong: {
          id: parentSong.id,
          title: parentSong.title,
          hasLrc: !!parentSong.lyrics_lrc,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating variations:', error);
    return NextResponse.json({ error: 'Failed to create variations' }, { status: 500 });
  }
}

/**
 * DELETE /api/songs/[id]/variations
 *
 * Unlinks a variation from its parent (doesn't delete the song).
 * Use query param ?songId=xxx to specify which variation to unlink.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { songId: parentSongId } = await context.params;
    const { searchParams } = new URL(request.url);
    const variationId = searchParams.get('songId');

    if (!variationId) {
      return NextResponse.json(
        { error: 'songId query parameter required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify the variation belongs to this parent
    const { data: variation, error: fetchError } = await supabase
      .from('card_songs')
      .select('id, parent_song_id')
      .eq('id', variationId)
      .single();

    if (fetchError || !variation) {
      return NextResponse.json({ error: 'Variation not found' }, { status: 404 });
    }

    if (variation.parent_song_id !== parentSongId) {
      return NextResponse.json(
        { error: 'This song is not a variation of the specified parent' },
        { status: 400 }
      );
    }

    // Unlink the variation (make it standalone)
    const { error: updateError } = await supabase
      .from('card_songs')
      .update({
        parent_song_id: null,
        is_primary: true,
        variation_label: null,
      })
      .eq('id', variationId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, unlinkedSongId: variationId });
  } catch (error) {
    console.error('Error unlinking variation:', error);
    return NextResponse.json({ error: 'Failed to unlink variation' }, { status: 500 });
  }
}
