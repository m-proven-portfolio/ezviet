import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Get query params for pagination and filtering
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // Build query for users with stats
    let query = supabase
      .from('profiles')
      .select(
        `
        id,
        username,
        display_name,
        email,
        avatar_url,
        learning_goal,
        experience_level,
        cards_viewed,
        cards_mastered,
        current_streak,
        longest_streak,
        total_sessions,
        last_active_at,
        created_at,
        is_admin,
        is_moderator,
        subscription_tier,
        vip_expires_at
      `,
        { count: 'exact' }
      );

    // Apply search filter
    if (search) {
      query = query.or(
        `username.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending, nullsFirst: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get learning history counts for each user (unique cards)
    const userIds = users?.map((u) => u.id) || [];

    // Get session stats for these users
    const { data: sessionStats } = await supabase
      .from('user_sessions')
      .select('user_id, started_at, ended_at, last_activity_at')
      .in('user_id', userIds);

    // Calculate average session duration per user
    const sessionDurations: Record<string, { avgMinutes: number; count: number }> = {};
    if (sessionStats) {
      const userSessions: Record<string, number[]> = {};
      for (const session of sessionStats) {
        const endTime = session.ended_at || session.last_activity_at;
        const duration =
          (new Date(endTime).getTime() - new Date(session.started_at).getTime()) / 1000 / 60; // minutes
        if (!userSessions[session.user_id]) {
          userSessions[session.user_id] = [];
        }
        userSessions[session.user_id].push(duration);
      }

      for (const [userId, durations] of Object.entries(userSessions)) {
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        sessionDurations[userId] = { avgMinutes: Math.round(avg * 10) / 10, count: durations.length };
      }
    }

    // Enrich users with session data
    const enrichedUsers = users?.map((user) => ({
      ...user,
      avg_session_minutes: sessionDurations[user.id]?.avgMinutes || 0,
      session_count: sessionDurations[user.id]?.count || user.total_sessions || 0,
    }));

    return NextResponse.json({
      users: enrichedUsers,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
