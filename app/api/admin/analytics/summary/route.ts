import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get basic counts
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalCards } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true });

    // Get active user counts
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { count: activeToday } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_active_at', oneDayAgo);

    const { count: active7Days } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_active_at', sevenDaysAgo);

    const { count: active30Days } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_active_at', thirtyDaysAgo);

    // Get new signups this week
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const { count: newThisWeek } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString());

    // Get average cards viewed
    const { data: avgData } = await supabase
      .from('profiles')
      .select('cards_viewed')
      .not('cards_viewed', 'eq', 0);

    const avgCardsViewed = avgData?.length
      ? Math.round(
          (avgData.reduce((sum, p) => sum + (p.cards_viewed || 0), 0) / avgData.length) * 10
        ) / 10
      : 0;

    // Get total views across all cards
    const { data: viewsData } = await supabase.from('cards').select('view_count');

    const totalViews = viewsData?.reduce((sum, c) => sum + (c.view_count || 0), 0) || 0;

    // Get learning goal distribution
    const { data: goalData } = await supabase
      .from('profiles')
      .select('learning_goal')
      .not('learning_goal', 'is', null);

    const goalDistribution: Record<string, number> = {};
    goalData?.forEach((p) => {
      const goal = p.learning_goal || 'unknown';
      goalDistribution[goal] = (goalDistribution[goal] || 0) + 1;
    });

    // Get experience level distribution
    const { data: levelData } = await supabase
      .from('profiles')
      .select('experience_level')
      .not('experience_level', 'is', null);

    const levelDistribution: Record<string, number> = {};
    levelData?.forEach((p) => {
      const level = p.experience_level || 'unknown';
      levelDistribution[level] = (levelDistribution[level] || 0) + 1;
    });

    return NextResponse.json({
      users: {
        total: totalUsers || 0,
        activeToday: activeToday || 0,
        active7Days: active7Days || 0,
        active30Days: active30Days || 0,
        newThisWeek: newThisWeek || 0,
        avgCardsViewed,
      },
      content: {
        totalCards: totalCards || 0,
        totalViews,
      },
      distribution: {
        learningGoals: goalDistribution,
        experienceLevels: levelDistribution,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
