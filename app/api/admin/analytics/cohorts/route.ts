import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface CohortData {
  cohort_week: string;
  total_users: number;
  week_0: number; // signup week
  week_1: number;
  week_2: number;
  week_3: number;
  week_4: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    const searchParams = request.nextUrl.searchParams;
    const weeksBack = parseInt(searchParams.get('weeks') || '12');

    // Get all profiles with their signup dates
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeksBack * 7);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, created_at, last_active_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    // Get learning history for activity tracking
    const { data: history, error: historyError } = await supabase
      .from('learning_history')
      .select('user_id, last_viewed_at')
      .gte('last_viewed_at', startDate.toISOString());

    if (historyError) {
      console.error('Error fetching history:', historyError);
      return NextResponse.json({ error: historyError.message }, { status: 500 });
    }

    // Build activity map: user_id -> Set of active week starts
    const userActivity: Map<string, Set<string>> = new Map();

    // Add profile last_active_at
    profiles?.forEach((p) => {
      if (!userActivity.has(p.id)) {
        userActivity.set(p.id, new Set());
      }
      if (p.last_active_at) {
        const weekStart = getWeekStart(new Date(p.last_active_at));
        userActivity.get(p.id)!.add(weekStart);
      }
    });

    // Add learning history activity
    history?.forEach((h) => {
      if (!userActivity.has(h.user_id)) {
        userActivity.set(h.user_id, new Set());
      }
      const weekStart = getWeekStart(new Date(h.last_viewed_at));
      userActivity.get(h.user_id)!.add(weekStart);
    });

    // Group users by signup week
    const cohorts: Map<string, string[]> = new Map();

    profiles?.forEach((p) => {
      const signupWeek = getWeekStart(new Date(p.created_at));
      if (!cohorts.has(signupWeek)) {
        cohorts.set(signupWeek, []);
      }
      cohorts.get(signupWeek)!.push(p.id);
    });

    // Calculate retention for each cohort
    const cohortData: CohortData[] = [];

    const sortedWeeks = Array.from(cohorts.keys()).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    for (const cohortWeek of sortedWeeks) {
      const users = cohorts.get(cohortWeek)!;
      const cohortDate = new Date(cohortWeek);

      const retention: CohortData = {
        cohort_week: cohortWeek,
        total_users: users.length,
        week_0: 0,
        week_1: 0,
        week_2: 0,
        week_3: 0,
        week_4: 0,
      };

      // Count retained users for each week
      for (const userId of users) {
        const activity = userActivity.get(userId) || new Set();

        for (let weekOffset = 0; weekOffset <= 4; weekOffset++) {
          const targetWeekDate = new Date(cohortDate);
          targetWeekDate.setDate(targetWeekDate.getDate() + weekOffset * 7);
          const targetWeek = getWeekStart(targetWeekDate);

          // Only count if that week has passed
          if (new Date(targetWeek) <= new Date()) {
            if (activity.has(targetWeek)) {
              const key = `week_${weekOffset}` as keyof CohortData;
              (retention[key] as number)++;
            }
          }
        }
      }

      cohortData.push(retention);
    }

    // Calculate retention rates
    const cohortsWithRates = cohortData.map((c) => ({
      ...c,
      rates: {
        week_0: c.total_users > 0 ? Math.round((c.week_0 / c.total_users) * 100) : 0,
        week_1: c.total_users > 0 ? Math.round((c.week_1 / c.total_users) * 100) : 0,
        week_2: c.total_users > 0 ? Math.round((c.week_2 / c.total_users) * 100) : 0,
        week_3: c.total_users > 0 ? Math.round((c.week_3 / c.total_users) * 100) : 0,
        week_4: c.total_users > 0 ? Math.round((c.week_4 / c.total_users) * 100) : 0,
      },
    }));

    return NextResponse.json({
      cohorts: cohortsWithRates,
      summary: {
        totalCohorts: cohortData.length,
        totalUsers: profiles?.length || 0,
        avgWeek1Retention:
          cohortData.length > 0
            ? Math.round(
                (cohortData.reduce((sum, c) => sum + (c.total_users > 0 ? c.week_1 / c.total_users : 0), 0) /
                  cohortData.length) *
                  100
              )
            : 0,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get the start of the week (Sunday) for a date
function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}
