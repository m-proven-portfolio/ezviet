import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/vietquest/levels
 *
 * Fetch all live levels, optionally filtered by world
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const worldSlug = searchParams.get('world');

    const supabase = createAdminClient();

    let query = supabase
      .from('vq_levels')
      .select(`
        id,
        world_id,
        level_number,
        slug,
        title_vi,
        title_en,
        description,
        base_dong_reward,
        energy_cost,
        status,
        vq_worlds (
          id,
          slug,
          name_vi,
          name_en
        )
      `)
      .eq('status', 'live')
      .order('level_number', { ascending: true });

    // Filter by world if specified
    if (worldSlug) {
      const { data: world } = await supabase
        .from('vq_worlds')
        .select('id')
        .eq('slug', worldSlug)
        .single();

      if (world) {
        query = query.eq('world_id', world.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch levels:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
