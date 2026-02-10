import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isModeratorOrAbove } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/moderator/queue
 * Fetches the review queue with submissions, song info, and submitter details
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check moderator permission
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_moderator')
      .eq('id', user.id)
      .single();

    if (!isModeratorOrAbove(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Fetch queue items with full context
    const { data: queueItems, error, count } = await supabase
      .from('lrc_review_queue')
      .select(`
        *,
        submission:lrc_submissions(
          id,
          song_id,
          user_id,
          status,
          submission_type,
          lines_changed,
          impact_score,
          submitted_lrc,
          points_awarded,
          created_at,
          song:card_songs(
            id,
            title,
            artist,
            slug,
            lyrics_lrc
          ),
          submitter:profiles(
            id,
            display_name,
            username,
            avatar_url,
            trust_score
          )
        ),
        assigned_user:profiles!lrc_review_queue_assigned_to_fkey(
          id,
          display_name,
          username
        )
      `, { count: 'exact' })
      .eq('queue_status', status)
      .order('priority_score', { ascending: false })
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching review queue:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      items: queueItems || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error('Queue API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/moderator/queue
 * Update queue item status (claim, release, escalate, complete)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check moderator permission
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_moderator')
      .eq('id', user.id)
      .single();

    if (!isModeratorOrAbove(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { queueId, action, escalationReason } = body;

    if (!queueId || !action) {
      return NextResponse.json(
        { error: 'queueId and action are required' },
        { status: 400 }
      );
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'claim':
        updateData = {
          queue_status: 'assigned',
          assigned_to: user.id,
          assigned_at: new Date().toISOString(),
        };
        break;

      case 'release':
        updateData = {
          queue_status: 'pending',
          assigned_to: null,
          assigned_at: null,
        };
        break;

      case 'start_review':
        updateData = {
          queue_status: 'in_review',
        };
        break;

      case 'escalate':
        updateData = {
          queue_status: 'escalated',
          escalated_by: user.id,
          escalation_reason: escalationReason || 'Needs admin review',
        };
        break;

      case 'complete':
        updateData = {
          queue_status: 'completed',
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from('lrc_review_queue')
      .update(updateData)
      .eq('id', queueId)
      .select()
      .single();

    if (error) {
      console.error('Error updating queue item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error('Queue PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
