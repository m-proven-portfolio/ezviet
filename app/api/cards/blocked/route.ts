import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { BLOCKED_PRACTICE_CONFIG } from '@/lib/blocked-practice';
import { getCycleTimestamp, seededShuffle } from '@/lib/utils';

/**
 * GET /api/cards/blocked
 *
 * Fetches cards organized by category for "blocked practice" learning.
 * Cards are returned in category groups, ordered by sort_order within each category.
 *
 * Query params:
 * - exclude: comma-separated slugs to exclude (already seen cards)
 * - categories: comma-separated category slugs (defaults to STARTER_CATEGORIES)
 * - limit: total number of cards to return (defaults to 6)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    // Parse params
    const excludeParam = searchParams.get('exclude') || '';
    const exclude = excludeParam ? excludeParam.split(',').filter(Boolean) : [];

    const categoriesParam = searchParams.get('categories') || '';
    const requestedCategories = categoriesParam
      ? categoriesParam.split(',').filter(Boolean)
      : BLOCKED_PRACTICE_CONFIG.STARTER_CATEGORIES;

    const totalLimit = parseInt(
      searchParams.get('limit') ||
        String(BLOCKED_PRACTICE_CONFIG.DEFAULT_TOTAL_LIMIT),
      10
    );

    // Get categories with card counts (only show categories with cards)
    const { data: categoriesWithCounts, error: catError } = await supabase
      .from('categories')
      .select('id, name, slug, icon, cards(count)')
      .in('slug', requestedCategories);

    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 500 });
    }

    // Filter to only categories that have at least 1 card
    const categories = (categoriesWithCounts || []).filter((c) => {
      const count = (c.cards as unknown as { count: number }[])?.[0]?.count ?? 0;
      return count > 0;
    });

    if (categories.length === 0) {
      return NextResponse.json({
        cards: [],
        categories: [],
        hasMore: false,
        message: 'No categories with cards found',
      });
    }

    // Calculate cards per category to distribute evenly up to the limit
    // e.g., limit=6, 4 categories = ~2 per category (with remainder going to first cats)
    const cardsPerCategory = Math.max(
      1,
      Math.ceil(totalLimit / categories.length)
    );

    // Create a map of category slug to id for ordering
    const categoryIdMap = new Map(categories.map((c) => [c.slug, c.id]));

    // Fetch cards from each category, ordered by sort_order
    const allCards = [];

    for (const catSlug of requestedCategories) {
      const catId = categoryIdMap.get(catSlug);
      if (!catId) continue;

      // Stop if we've reached the total limit
      if (allCards.length >= totalLimit) break;

      // Only fetch what we still need (respect total limit)
      const remainingSlots = totalLimit - allCards.length;
      const fetchLimit = Math.min(cardsPerCategory, remainingSlots);

      let query = supabase
        .from('cards')
        .select(
          `
          *,
          category:categories(*),
          terms:card_terms(*),
          songs:card_songs(id, storage_path, title, duration_seconds, sort_order, lyrics_lrc, lyrics_plain, cover_image_path, artist, level)
        `
        )
        .eq('category_id', catId)
        .order('sort_order', { ascending: true })
        .limit(fetchLimit);

      // Exclude already seen cards
      if (exclude.length > 0) {
        query = query.not('slug', 'in', `(${exclude.join(',')})`);
      }

      const { data: catCards, error } = await query;

      if (error) {
        console.error(`Error fetching category ${catSlug}:`, error);
        continue;
      }

      if (catCards && catCards.length > 0) {
        allCards.push(...catCards);
      }
    }

    // Check if there are more cards available beyond what we returned
    const totalAvailable = await supabase
      .from('cards')
      .select('id', { count: 'exact', head: true })
      .in(
        'category_id',
        categories.map((c) => c.id)
      );

    const hasMore =
      totalAvailable.count !== null &&
      totalAvailable.count > allCards.length + exclude.length;

    // Return only categories that have cards (strip the count data)
    const cleanCategories = categories.map(({ cards: _cards, ...cat }) => cat);

    // Shuffle cards using 6-hour cycle timestamp as seed (same order for all users)
    const shuffledCards = seededShuffle(allCards, getCycleTimestamp());

    return NextResponse.json({
      cards: shuffledCards,
      categories: cleanCategories,
      hasMore,
      total: shuffledCards.length,
    });
  } catch (error) {
    console.error('Blocked fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}
