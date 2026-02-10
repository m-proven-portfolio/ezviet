import { Metadata } from 'next';
import Link from 'next/link';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getCoreTier, getCoreTierConfig } from '@/lib/core-tiers';
import { Header } from '@/components/Header';
import { LeaderboardClient } from './LeaderboardClient';

export const metadata: Metadata = {
  title: 'Weekly Leaderboard - EZViet Core',
  description:
    'See the top contributors who are improving karaoke timing on EZViet this week.',
};

// Revalidate every 5 minutes
export const revalidate = 300;

async function getLeaderboardData() {
  const supabase = createAdminClient();

  // Calculate week boundaries (Sunday to Saturday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Get weekly submissions
  const { data: weeklyData } = await supabase
    .from('lrc_submissions')
    .select('user_id, points_earned')
    .gte('created_at', weekStart.toISOString())
    .lt('created_at', weekEnd.toISOString());

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

  // Sort and get top 10
  const sortedUsers = Array.from(userAggregates.entries())
    .sort((a, b) => b[1].points - a[1].points);

  const topUserIds = sortedUsers.slice(0, 10).map(([userId]) => userId);

  if (topUserIds.length === 0) {
    return {
      leaderboard: [],
      totalContributors: 0,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    };
  }

  // Fetch profile and contributor data
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', topUserIds);

  const { data: contributors } = await supabase
    .from('lrc_contributors')
    .select('user_id, total_points')
    .in('user_id', topUserIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
  const contributorMap = new Map(contributors?.map((c) => [c.user_id, c]) || []);

  // Build leaderboard
  const leaderboard = sortedUsers.slice(0, 10).map(([userId, stats], index) => {
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

  return {
    leaderboard,
    totalContributors: sortedUsers.length,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
  };
}

async function getCurrentUserRank() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get all weekly data to find user's rank
  const adminSupabase = createAdminClient();

  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const { data: weeklyData } = await adminSupabase
    .from('lrc_submissions')
    .select('user_id, points_earned')
    .gte('created_at', weekStart.toISOString())
    .lt('created_at', weekEnd.toISOString());

  // Aggregate and find user's rank
  const userAggregates = new Map<string, number>();
  for (const submission of weeklyData || []) {
    const existing = userAggregates.get(submission.user_id) ?? 0;
    userAggregates.set(submission.user_id, existing + submission.points_earned);
  }

  const sortedUsers = Array.from(userAggregates.entries())
    .sort((a, b) => b[1] - a[1]);

  const userIndex = sortedUsers.findIndex(([userId]) => userId === user.id);

  return userIndex !== -1 ? userIndex + 1 : null;
}

export default async function LeaderboardPage() {
  const [leaderboardData, userRank] = await Promise.all([
    getLeaderboardData(),
    getCurrentUserRank(),
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-emerald-50">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Title */}
        <LeaderboardClient
          initialData={leaderboardData}
          initialUserRank={userRank}
        />

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-emerald-600 hover:text-emerald-700"
          >
            ← Back to learning
          </Link>
        </div>
      </div>
    </main>
  );
}
