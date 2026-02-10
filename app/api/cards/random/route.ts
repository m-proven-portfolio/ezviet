import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET: Fetch random cards excluding already seen ones
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    // Parse exclude list (comma-separated slugs)
    const excludeParam = searchParams.get('exclude') || '';
    const exclude = excludeParam ? excludeParam.split(',').filter(Boolean) : [];
    const limit = parseInt(searchParams.get('limit') || '1', 10);

    // Build query
    let query = supabase
      .from('cards')
      .select(`
        *,
        category:categories(*),
        terms:card_terms(*),
        songs:card_songs(id, storage_path, title, duration_seconds, sort_order, lyrics_lrc, lyrics_plain, cover_image_path, artist, level)
      `);

    // Exclude already seen cards
    if (exclude.length > 0) {
      query = query.not('slug', 'in', `(${exclude.join(',')})`);
    }

    // Get random cards
    // Note: Supabase doesn't have ORDER BY RANDOM() directly,
    // so we fetch more and shuffle on the server
    const { data: cards, error } = await query.limit(Math.max(limit * 10, 50));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!cards || cards.length === 0) {
      return NextResponse.json({
        cards: [],
        hasMore: false,
        message: 'No more cards available'
      });
    }

    // Shuffle and take requested limit
    const shuffled = cards.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, limit);

    return NextResponse.json({
      cards: selected,
      hasMore: cards.length > limit,
      total: cards.length,
    });
  } catch (error) {
    console.error('Random fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}
