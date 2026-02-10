import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { calculatePoints, checkAchievements, type AchievementType } from '@/lib/lrc-sync';
import type { VoteType } from '@/lib/lrc-voting';

interface SubmitRequestBody {
  songId: string;
  timingData: Array<{
    lineIndex: number;
    timestamp: number;
    text: string;
  }>;
  accuracyScore: number;
  linesCount: number;
  bestStreak: number;
  userRating: VoteType; // Required: user's feedback on timing quality
}

// POST /api/lrc-sync/submit - Submit sync timing data
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SubmitRequestBody = await request.json();

    // Validate request
    if (!body.songId || !Array.isArray(body.timingData) || body.timingData.length === 0) {
      return NextResponse.json(
        { error: 'songId and timingData are required' },
        { status: 400 }
      );
    }

    // Validate userRating
    const validRatings: VoteType[] = ['accurate', 'inaccurate', 'edit'];
    if (!body.userRating || !validRatings.includes(body.userRating)) {
      return NextResponse.json(
        { error: 'userRating is required (accurate, inaccurate, or edit)' },
        { status: 400 }
      );
    }

    // Use admin client for writes (bypasses RLS for inserts)
    const adminClient = createAdminClient();

    // Verify song exists
    const { data: song, error: songError } = await adminClient
      .from('card_songs')
      .select('id, title')
      .eq('id', body.songId)
      .single();

    if (songError || !song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    // Calculate points
    const pointsEarned = calculatePoints(
      body.accuracyScore,
      body.linesCount,
      body.bestStreak
    );

    // Create submission with user rating
    const { data: submission, error: submissionError } = await adminClient
      .from('lrc_submissions')
      .insert({
        song_id: body.songId,
        user_id: user.id,
        timing_data: body.timingData,
        accuracy_score: body.accuracyScore,
        points_earned: pointsEarned,
        lines_count: body.linesCount,
        best_streak: body.bestStreak,
        user_rating: body.userRating, // Store the user's timing feedback
        status: 'pending',
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Failed to create submission:', submissionError);
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      );
    }

    // Get or create contributor record
    const { data: contributor } = await adminClient
      .from('lrc_contributors')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (contributor) {
      // Update existing contributor stats
      const newTotalPoints = contributor.total_points + pointsEarned;
      const newSongsSynced = contributor.songs_synced + 1;
      const newLinesSynced = contributor.lines_synced + body.linesCount;
      const newBestStreak = Math.max(contributor.best_streak, body.bestStreak);

      // Calculate new accuracy rate (weighted average)
      const totalLinesEver = contributor.lines_synced + body.linesCount;
      const newAccuracyRate = totalLinesEver > 0
        ? ((contributor.accuracy_rate * contributor.lines_synced) + (body.accuracyScore * body.linesCount)) / totalLinesEver
        : body.accuracyScore;

      // Calculate level (every 500 points = 1 level)
      const newLevel = Math.floor(newTotalPoints / 500) + 1;

      await adminClient
        .from('lrc_contributors')
        .update({
          total_points: newTotalPoints,
          songs_synced: newSongsSynced,
          lines_synced: newLinesSynced,
          best_streak: newBestStreak,
          accuracy_rate: Math.round(newAccuracyRate * 100) / 100,
          level: newLevel,
        })
        .eq('user_id', user.id);

      // Check for new achievements
      const { data: existingAchievements } = await adminClient
        .from('lrc_achievements')
        .select('achievement_type')
        .eq('user_id', user.id);

      const existingSet = new Set(existingAchievements?.map(a => a.achievement_type) || []);
      const newAchievements = checkAchievements(
        {
          songsCount: newSongsSynced,
          totalPoints: newTotalPoints,
          bestStreak: newBestStreak,
          trustScore: contributor.trust_score,
          hadPerfectScore: body.accuracyScore >= 99.5,
        },
        existingSet
      );

      // Insert new achievements
      if (newAchievements.length > 0) {
        await adminClient.from('lrc_achievements').insert(
          newAchievements.map((type: AchievementType) => ({
            user_id: user.id,
            achievement_type: type,
          }))
        );
      }

      return NextResponse.json({
        submission,
        pointsEarned,
        totalPoints: newTotalPoints,
        level: newLevel,
        newAchievements,
      });
    } else {
      // Create new contributor record
      const newLevel = Math.floor(pointsEarned / 500) + 1;

      await adminClient
        .from('lrc_contributors')
        .insert({
          user_id: user.id,
          total_points: pointsEarned,
          level: newLevel,
          songs_synced: 1,
          lines_synced: body.linesCount,
          best_streak: body.bestStreak,
          accuracy_rate: body.accuracyScore,
        });

      // Grant first_sync achievement
      await adminClient.from('lrc_achievements').insert({
        user_id: user.id,
        achievement_type: 'first_sync',
        metadata: { song_id: body.songId, song_title: song.title },
      });

      return NextResponse.json({
        submission,
        pointsEarned,
        totalPoints: pointsEarned,
        level: newLevel,
        newAchievements: ['first_sync'],
      });
    }
  } catch (error) {
    console.error('LRC sync submit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
