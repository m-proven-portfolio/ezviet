import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ songId: string }>;
}

// GET /api/songs/[songId] - Get a single song
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { songId } = await context.params;
    const supabase = createAdminClient();

    const { data: song, error } = await supabase
      .from('card_songs')
      .select('*')
      .eq('id', songId)
      .single();

    if (error || !song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json(song);
  } catch (error) {
    console.error('Error fetching song:', error);
    return NextResponse.json({ error: 'Failed to fetch song' }, { status: 500 });
  }
}

// PATCH /api/songs/[songId] - Update a song
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { songId } = await context.params;
    const body = await request.json();
    const supabase = createAdminClient();

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};

    const allowedFields = [
      'title',
      'artist',
      'album',
      'year',
      'cover_image_path',
      'level',
      'purpose',
      'learning_goal',
      'lyrics_lrc',
      'lyrics_plain',
      'sort_order',
      'timing_offset',
      'genre',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: song, error } = await supabase
      .from('card_songs')
      .update(updateData)
      .eq('id', songId)
      .select()
      .single();

    if (error) {
      console.error('Error updating song:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json(song);
  } catch (error) {
    console.error('Error updating song:', error);
    return NextResponse.json({ error: 'Failed to update song' }, { status: 500 });
  }
}

// DELETE /api/songs/[songId] - Delete a song
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { songId } = await context.params;
    const supabase = createAdminClient();

    // First, get the song to retrieve storage paths
    const { data: song, error: fetchError } = await supabase
      .from('card_songs')
      .select('storage_path, cover_image_path')
      .eq('id', songId)
      .single();

    if (fetchError || !song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    // Delete from storage
    if (song.storage_path) {
      await supabase.storage.from('cards-songs').remove([song.storage_path]);
    }

    // Delete cover if it was extracted
    if (song.cover_image_path && song.cover_image_path.startsWith('song-cover-')) {
      await supabase.storage.from('cards-images').remove([song.cover_image_path]);
    }

    // Delete the database record
    const { error: deleteError } = await supabase
      .from('card_songs')
      .delete()
      .eq('id', songId);

    if (deleteError) {
      console.error('Error deleting song:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting song:', error);
    return NextResponse.json({ error: 'Failed to delete song' }, { status: 500 });
  }
}
