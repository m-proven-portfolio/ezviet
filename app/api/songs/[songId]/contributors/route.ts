import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCoreTier, getCoreTierConfig } from '@/lib/core-tiers';

interface ContributorRow {
  user_id: string;
  edit_count: number;
  profiles: {
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  };
  lrc_contributors: {
    total_points: number;
  } | null;
}

export interface SongContributor {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  editCount: number;
  totalPoints: number;
  tier: {
    id: string;
    name: string;
    icon: string;
  };
}

// GET /api/songs/[songId]/contributors - Get contributors who improved this song
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ songId: string }> }
) {
  try {
    const { songId } = await params;
    const supabase = await createClient();

    // Query merged submissions grouped by user
    // Using a raw query approach since Supabase doesn't support GROUP BY well
    const { data: submissions, error } = await supabase
      .from('lrc_submissions')
      .select(`
        user_id,
        profiles!inner (
          username,
          avatar_url,
          display_name
        )
      `)
      .eq('song_id', songId)
      .eq('status', 'merged');

    if (error) {
      console.error('Failed to fetch contributors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contributors' },
        { status: 500 }
      );
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ contributors: [] });
    }

    // Group by user and count edits manually
    const userEdits = new Map<string, {
      userId: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      editCount: number;
    }>();

    for (const sub of submissions) {
      const profile = sub.profiles as unknown as {
        username: string;
        avatar_url: string | null;
        display_name: string | null;
      };

      const existing = userEdits.get(sub.user_id);
      if (existing) {
        existing.editCount++;
      } else {
        userEdits.set(sub.user_id, {
          userId: sub.user_id,
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          editCount: 1,
        });
      }
    }

    // Get contributor stats for all users
    const userIds = Array.from(userEdits.keys());
    const { data: contributorStats } = await supabase
      .from('lrc_contributors')
      .select('user_id, total_points')
      .in('user_id', userIds);

    // Create points lookup
    const pointsMap = new Map<string, number>();
    if (contributorStats) {
      for (const stat of contributorStats) {
        pointsMap.set(stat.user_id, stat.total_points);
      }
    }

    // Build final response with tier info
    const contributors: SongContributor[] = Array.from(userEdits.values())
      .map((user) => {
        const totalPoints = pointsMap.get(user.userId) ?? 0;
        const tierId = getCoreTier(totalPoints);
        const tierConfig = getCoreTierConfig(tierId);
        return {
          ...user,
          totalPoints,
          tier: {
            id: tierId,
            name: tierConfig.label,
            icon: tierConfig.icon,
          },
        };
      })
      .sort((a, b) => b.editCount - a.editCount) // Sort by most edits
      .slice(0, 5); // Limit to top 5

    return NextResponse.json({ contributors });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
