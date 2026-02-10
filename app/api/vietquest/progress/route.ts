import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/vietquest/progress
 *
 * Fetch player progress for all levels (requires auth)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('vq_progress')
      .select(`
        *,
        vq_levels (
          id,
          slug,
          title_vi,
          title_en,
          level_number,
          world_id
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to fetch progress:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST /api/vietquest/progress
 *
 * Save or update player progress for a level
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      level_id,
      status,
      checkpoint_data,
      best_score,
      dong_earned,
      translator_uses,
      choices_made,
    } = body;

    if (!level_id) {
      return NextResponse.json({ error: 'level_id is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Upsert progress (insert or update)
    const progressData: Record<string, unknown> = {
      user_id: user.id,
      level_id,
      last_played_at: new Date().toISOString(),
    };

    // Only include fields that are provided
    if (status) progressData.status = status;
    if (checkpoint_data) progressData.checkpoint_data = checkpoint_data;
    if (typeof best_score === 'number') progressData.best_score = best_score;
    if (typeof dong_earned === 'number') progressData.dong_earned = dong_earned;
    if (typeof translator_uses === 'number') progressData.translator_uses = translator_uses;
    if (choices_made) progressData.choices_made = choices_made;

    // Set timestamps based on status
    if (status === 'in_progress' && !body.started_at) {
      progressData.started_at = new Date().toISOString();
    }
    if (status === 'completed') {
      progressData.completed_at = new Date().toISOString();
    }

    const { data, error } = await adminClient
      .from('vq_progress')
      .upsert(progressData, {
        onConflict: 'user_id,level_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save progress:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If level completed, update player stats
    if (status === 'completed') {
      // Update player stats
      const { error: statsError } = await adminClient.rpc('init_vq_player_stats', {
        p_user_id: user.id,
      });

      if (statsError) {
        console.error('Failed to init player stats:', statsError);
      }

      // Increment levels completed
      await adminClient
        .from('vq_player_stats')
        .update({
          levels_completed: adminClient.rpc('increment', { row_id: user.id, amount: 1 }) as unknown as number,
          total_dong: adminClient.rpc('increment', { row_id: user.id, amount: dong_earned || 0 }) as unknown as number,
        })
        .eq('user_id', user.id);
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
