import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface CohortUser {
  id: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  cards_viewed: number;
  cards_mastered: number;
  current_streak: number;
  total_sessions: number;
  last_active_at: string | null;
  created_at: string;
  is_active_this_week: boolean;
  activity_this_week: {
    cards_viewed: number;
    sessions: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    const searchParams = request.nextUrl.searchParams;
    const cohortWeek = searchParams.get('cohort_week');
    const weekOffset = parseInt(searchParams.get('week_offset') || '0');

    if (!cohortWeek) {
      return NextResponse.json({ error: 'cohort_week is required' }, { status: 400 });
    }

    // Calculate the target week (cohort week + offset)
    const cohortDate = new Date(cohortWeek);
    const targetWeekStart = new Date(cohortDate);
    targetWeekStart.setDate(targetWeekStart.getDate() + weekOffset * 7);

    const targetWeekEnd = new Date(targetWeekStart);
    targetWeekEnd.setDate(targetWeekEnd.getDate() + 7);

    // Get the end of cohort signup week
    const cohortWeekEnd = new Date(cohortDate);
    cohortWeekEnd.setDate(cohortWeekEnd.getDate() + 7);

    // Fetch users who signed up in this cohort week
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        email,
        avatar_url,
        cards_viewed,
        cards_mastered,
        current_streak,
        total_sessions,
        last_active_at,
        created_at
      `)
      .gte('created_at', cohortDate.toISOString())
      .lt('created_at', cohortWeekEnd.toISOString())
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        users: [],
        summary: {
          total: 0,
          active: 0,
          churned: 0,
          cohort_week: cohortWeek,
          target_week_start: targetWeekStart.toISOString().split('T')[0],
          week_offset: weekOffset,
        },
      });
    }

    const userIds = profiles.map((p) => p.id);

    // Get learning history activity for the target week
    const { data: learningHistory } = await supabase
      .from('learning_history')
      .select('user_id, last_viewed_at')
      .in('user_id', userIds)
      .gte('last_viewed_at', targetWeekStart.toISOString())
      .lt('last_viewed_at', targetWeekEnd.toISOString());

    // Get session data for the target week
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('user_id, started_at')
      .in('user_id', userIds)
      .gte('started_at', targetWeekStart.toISOString())
      .lt('started_at', targetWeekEnd.toISOString());

    // Build activity map per user
    const userActivityMap: Map<string, { cards: number; sessions: number }> = new Map();

    // Count learning history entries (cards viewed this week)
    learningHistory?.forEach((h) => {
      if (!userActivityMap.has(h.user_id)) {
        userActivityMap.set(h.user_id, { cards: 0, sessions: 0 });
      }
      userActivityMap.get(h.user_id)!.cards++;
    });

    // Count sessions this week
    sessions?.forEach((s) => {
      if (!userActivityMap.has(s.user_id)) {
        userActivityMap.set(s.user_id, { cards: 0, sessions: 0 });
      }
      userActivityMap.get(s.user_id)!.sessions++;
    });

    // Also check last_active_at on profile
    profiles.forEach((p) => {
      if (p.last_active_at) {
        const lastActive = new Date(p.last_active_at);
        if (lastActive >= targetWeekStart && lastActive < targetWeekEnd) {
          if (!userActivityMap.has(p.id)) {
            userActivityMap.set(p.id, { cards: 0, sessions: 0 });
          }
        }
      }
    });

    // Build enriched user list
    const users: CohortUser[] = profiles.map((p) => {
      const activity = userActivityMap.get(p.id);
      return {
        id: p.id,
        username: p.username,
        display_name: p.display_name,
        email: p.email,
        avatar_url: p.avatar_url,
        cards_viewed: p.cards_viewed || 0,
        cards_mastered: p.cards_mastered || 0,
        current_streak: p.current_streak || 0,
        total_sessions: p.total_sessions || 0,
        last_active_at: p.last_active_at,
        created_at: p.created_at,
        is_active_this_week: !!activity,
        activity_this_week: {
          cards_viewed: activity?.cards || 0,
          sessions: activity?.sessions || 0,
        },
      };
    });

    // Sort: active users first, then by activity count
    users.sort((a, b) => {
      if (a.is_active_this_week !== b.is_active_this_week) {
        return a.is_active_this_week ? -1 : 1;
      }
      return b.activity_this_week.cards_viewed - a.activity_this_week.cards_viewed;
    });

    const activeCount = users.filter((u) => u.is_active_this_week).length;

    return NextResponse.json({
      users,
      summary: {
        total: users.length,
        active: activeCount,
        churned: users.length - activeCount,
        cohort_week: cohortWeek,
        target_week_start: targetWeekStart.toISOString().split('T')[0],
        week_offset: weekOffset,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
