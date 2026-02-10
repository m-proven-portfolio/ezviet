import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/cards/[id]/songs - List all songs for a card
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = createAdminClient();

    const { data: songs, error } = await supabase
      .from('card_songs')
      .select('*')
      .eq('card_id', id)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching songs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 });
  }
}

// POST /api/cards/[id]/songs - Create a new song for a card
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const supabase = createAdminClient();

    // Verify the card exists
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('id')
      .eq('id', id)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Get the next sort_order
    const { data: existingSongs } = await supabase
      .from('card_songs')
      .select('sort_order')
      .eq('card_id', id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = existingSongs && existingSongs.length > 0
      ? existingSongs[0].sort_order + 1
      : 0;

    // Create the song record
    const { data: song, error: insertError } = await supabase
      .from('card_songs')
      .insert({
        card_id: id,
        storage_path: body.storage_path,
        duration_seconds: body.duration_seconds || null,
        file_size: body.file_size || null,
        mime_type: body.mime_type || 'audio/mpeg',
        title: body.title,
        artist: body.artist || null,
        album: body.album || null,
        year: body.year || null,
        cover_image_path: body.cover_image_path || null,
        level: body.level || null,
        genre: body.genre || null,
        purpose: body.purpose || null,
        learning_goal: body.learning_goal || null,
        lyrics_lrc: body.lyrics_lrc || null,
        lyrics_plain: body.lyrics_plain || null,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating song:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(song, { status: 201 });
  } catch (error) {
    console.error('Error creating song:', error);
    return NextResponse.json({ error: 'Failed to create song' }, { status: 500 });
  }
}

// PATCH /api/cards/[id]/songs - Reorder songs
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const supabase = createAdminClient();

    // Expect body.order to be an array of song IDs in the new order
    const { order } = body as { order: string[] };

    if (!Array.isArray(order)) {
      return NextResponse.json(
        { error: 'order must be an array of song IDs' },
        { status: 400 }
      );
    }

    // Update each song's sort_order
    const updates = order.map((songId, index) =>
      supabase
        .from('card_songs')
        .update({ sort_order: index })
        .eq('id', songId)
        .eq('card_id', id)
    );

    await Promise.all(updates);

    // Fetch updated songs
    const { data: songs, error } = await supabase
      .from('card_songs')
      .select('*')
      .eq('card_id', id)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(songs);
  } catch (error) {
    console.error('Error reordering songs:', error);
    return NextResponse.json({ error: 'Failed to reorder songs' }, { status: 500 });
  }
}
