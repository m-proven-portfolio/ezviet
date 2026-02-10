import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface CategoryBase {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  target_count: number | null;
  created_at: string;
}

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('include_stats') === 'true';
    const withCardsOnly = searchParams.get('with_cards') === 'true';

    // If we only want categories with cards, do a separate query with card counts
    if (withCardsOnly) {
      const { data: categoriesWithCounts, error } = await supabase
        .from('categories')
        .select('id, name, slug, icon, description, target_count, created_at, cards(count)')
        .order('name');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Filter to only categories with at least 1 card
      const filtered = (categoriesWithCounts || [])
        .filter((c) => {
          const count = (c.cards as unknown as { count: number }[])?.[0]?.count ?? 0;
          return count > 0;
        })
        .map((c): CategoryBase => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          icon: c.icon,
          description: c.description,
          target_count: c.target_count,
          created_at: c.created_at,
        }));

      return NextResponse.json(filtered);
    }

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Optionally include queue stats for each category
    if (includeStats && categories) {
      // Use Promise.all for parallel fetching
      const [{ data: queueItems }, { data: cardCounts }] = await Promise.all([
        supabase.from('card_queue').select('category_id, status'),
        supabase.from('cards').select('category_id'),
      ]);

      // Aggregate stats per category
      const statsMap = new Map<string, { pending: number; completed: number; cardCount: number }>();

      // Initialize all categories
      for (const cat of categories) {
        statsMap.set(cat.id, { pending: 0, completed: 0, cardCount: 0 });
      }

      // Count queue items
      if (queueItems) {
        for (const item of queueItems) {
          const stats = statsMap.get(item.category_id);
          if (stats) {
            if (item.status === 'pending') stats.pending++;
            else if (item.status === 'completed') stats.completed++;
          }
        }
      }

      // Count actual cards
      if (cardCounts) {
        for (const card of cardCounts) {
          if (card.category_id) {
            const stats = statsMap.get(card.category_id);
            if (stats) stats.cardCount++;
          }
        }
      }

      // Attach stats to categories
      const categoriesWithStats = categories.map((cat) => ({
        ...cat,
        queue_stats: statsMap.get(cat.id) || { pending: 0, completed: 0, cardCount: 0 },
      }));

      return NextResponse.json(categoriesWithStats);
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Fetch categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { name, icon, description, target_count } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        icon: icon || null,
        description: description || null,
        target_count: target_count || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { id, name, icon, description, target_count } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) {
      updates.name = name;
      updates.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    if (icon !== undefined) updates.icon = icon || null;
    if (description !== undefined) updates.description = description || null;
    if (target_count !== undefined) updates.target_count = target_count || null;

    const { data: category, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check if category has cards
    const { count } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${count} card(s). Remove cards first.` },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
