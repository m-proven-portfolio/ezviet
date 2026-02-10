import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || 'all';
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = 24;

    const supabase = await createClient();

    if (query) {
      // Server-side search: find cards where slug matches OR any term text matches
      const searchPattern = `%${query}%`;

      // First, find card IDs from card_terms that match the search
      const { data: matchingTerms } = await supabase
        .from('card_terms')
        .select('card_id')
        .ilike('text', searchPattern);

      // Get unique card IDs from terms
      const termCardIds = [...new Set(matchingTerms?.map(t => t.card_id) || [])];

      // Now fetch cards that either:
      // 1. Have a slug matching the search
      // 2. Have an image_path matching the search
      // 3. Are in the list of cards with matching terms
      let cardsQuery = supabase
        .from('cards')
        .select(`
          id,
          slug,
          image_path,
          category_id,
          created_at,
          card_terms (text, lang)
        `)
        .not('image_path', 'is', null);

      // Apply category filter
      if (category !== 'all') {
        cardsQuery = cardsQuery.eq('category_id', category);
      }

      // Build OR condition for search
      if (termCardIds.length > 0) {
        cardsQuery = cardsQuery.or(`slug.ilike.${searchPattern},image_path.ilike.${searchPattern},id.in.(${termCardIds.join(',')})`);
      } else {
        cardsQuery = cardsQuery.or(`slug.ilike.${searchPattern},image_path.ilike.${searchPattern}`);
      }

      // Apply sort
      switch (sort) {
        case 'oldest':
          cardsQuery = cardsQuery.order('created_at', { ascending: true });
          break;
        case 'az':
          cardsQuery = cardsQuery.order('slug', { ascending: true });
          break;
        case 'za':
          cardsQuery = cardsQuery.order('slug', { ascending: false });
          break;
        default: // newest
          cardsQuery = cardsQuery.order('created_at', { ascending: false });
      }

      // Pagination
      cardsQuery = cardsQuery.range(page * limit, (page + 1) * limit - 1);

      const { data: cards, error } = await cardsQuery;

      if (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        cards: cards || [],
        hasMore: (cards?.length || 0) === limit,
      });
    } else {
      // No search query - just paginate with filters
      let query = supabase
        .from('cards')
        .select(`
          id,
          slug,
          image_path,
          category_id,
          created_at,
          card_terms (text, lang)
        `)
        .not('image_path', 'is', null);

      // Apply category filter
      if (category !== 'all') {
        query = query.eq('category_id', category);
      }

      // Apply sort
      switch (sort) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'az':
          query = query.order('slug', { ascending: true });
          break;
        case 'za':
          query = query.order('slug', { ascending: false });
          break;
        default: // newest
          query = query.order('created_at', { ascending: false });
      }

      // Pagination
      query = query.range(page * limit, (page + 1) * limit - 1);

      const { data: cards, error } = await query;

      if (error) {
        console.error('Fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        cards: cards || [],
        hasMore: (cards?.length || 0) === limit,
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
