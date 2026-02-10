import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getCoreTier, getCoreTierConfig } from '@/lib/core-tiers';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  weeklyPoints: number;
  weeklySubmissions: number;
  totalPoints: number;
  tier: {
    id: string;
    name: string;
    icon: string;
  };
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  userRank: number | null; // Current user's rank
  totalContributors: number;
  weekStart: string;
  weekEnd: string;
}

/**
 * GET /api/leaderboard
 * Fetch weekly leaderboard of top contributors
 *
 * Query params:
 * - limit: number (default 10)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '10', 10);

    // Calculate week boundaries (Sunday to Saturday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const supabase = createAdminClient();

    // Get weekly points aggregation
    // Note: This uses a raw query approach since Supabase JS doesn't support GROUP BY well
    const { data: weeklyData, error: weeklyError } = await supabase
      .from('lrc_submissions')
      .select(`
        user_id,
        points_earned
      `)
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString());

    if (weeklyError) {
      console.error('Failed to fetch weekly data:', weeklyError);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Aggregate by user
    const userAggregates = new Map<string, { points: number; submissions: number }>();

    for (const submission of weeklyData || []) {
      const existing = userAggregates.get(submission.user_id);
      if (existing) {
        existing.points += submission.points_earned;
        existing.submissions++;
      } else {
        userAggregates.set(submission.user_id, {
          points: submission.points_earned,
          submissions: 1,
        });
      }
    }

    // Get unique user IDs sorted by points
    const sortedUsers = Array.from(userAggregates.entries())
      .sort((a, b) => b[1].points - a[1].points);

    const topUserIds = sortedUsers.slice(0, limit).map(([userId]) => userId);

    if (topUserIds.length === 0) {
      return NextResponse.json({
        leaderboard: [],
        userRank: null,
        totalContributors: 0,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
      });
    }

    // Fetch profile and contributor data for top users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', topUserIds);

    const { data: contributors } = await supabase
      .from('lrc_contributors')
      .select('user_id, total_points')
      .in('user_id', topUserIds);

    // Create lookup maps
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
    const contributorMap = new Map(contributors?.map((c) => [c.user_id, c]) || []);

    // Build leaderboard entries
    const leaderboard: LeaderboardEntry[] = sortedUsers
      .slice(0, limit)
      .map(([userId, stats], index) => {
        const profile = profileMap.get(userId);
        const contributor = contributorMap.get(userId);
        const totalPoints = contributor?.total_points ?? 0;
        const tierId = getCoreTier(totalPoints);
        const tierConfig = getCoreTierConfig(tierId);

        return {
          rank: index + 1,
          userId,
          username: profile?.username ?? 'Anonymous',
          displayName: profile?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
          weeklyPoints: stats.points,
          weeklySubmissions: stats.submissions,
          totalPoints,
          tier: {
            id: tierId,
            name: tierConfig.label,
            icon: tierConfig.icon,
          },
        };
      });

    // Get current user's rank if authenticated
    let userRank: number | null = null;
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();

    if (user) {
      const userIndex = sortedUsers.findIndex(([userId]) => userId === user.id);
      if (userIndex !== -1) {
        userRank = userIndex + 1;
      }
    }

    return NextResponse.json({
      leaderboard,
      userRank,
      totalContributors: sortedUsers.length,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
