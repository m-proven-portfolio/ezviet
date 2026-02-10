import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/lrc-sync/leaderboard - Get leaderboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // 'weekly' | 'monthly' | 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const supabase = createAdminClient();

    // For weekly/monthly, we'd need to filter submissions by date
    // For MVP, we just use the all-time stats from lrc_contributors
    const { data: contributors, error } = await supabase
      .from('lrc_contributors')
      .select(`
        id,
        user_id,
        total_points,
        level,
        songs_synced,
        lines_synced,
        accuracy_rate,
        best_streak,
        trust_score
      `)
      .order('total_points', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Leaderboard query error:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    // Fetch profile info for each contributor
    const userIds = contributors?.map(c => c.user_id) || [];

    if (userIds.length === 0) {
      return NextResponse.json({
        period,
        leaderboard: [],
      });
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Combine data
    const leaderboard = contributors?.map((c, index) => {
      const profile = profileMap.get(c.user_id);
      return {
        rank: index + 1,
        userId: c.user_id,
        displayName: profile?.display_name || 'Anonymous',
        username: profile?.username,
        avatarUrl: profile?.avatar_url,
        totalPoints: c.total_points,
        level: c.level,
        songsSynced: c.songs_synced,
        linesSynced: c.lines_synced,
        accuracyRate: c.accuracy_rate,
        bestStreak: c.best_streak,
        trustScore: c.trust_score,
      };
    }) || [];

    return NextResponse.json({
      period,
      leaderboard,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
