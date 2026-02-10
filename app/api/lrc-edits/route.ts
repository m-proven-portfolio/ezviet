import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  calculateEditPoints,
  calculateImpactScore,
  checkAchievements,
  type EditType,
  type AchievementType,
} from '@/lib/lrc-sync';
import { shouldAutoApprove } from '@/lib/permissions';
import { notifyAdminsLrcSubmission } from '@/lib/notifications';

interface EditEntry {
  editType: EditType;
  lineIndex: number;
  originalTimestamp?: number;
  newTimestamp?: number;
  originalText?: string;
  newText?: string;
  deltaMagnitude?: number;
  contextBefore?: { timestamp: number; text: string } | null;
  contextAfter?: { timestamp: number; text: string } | null;
}

interface EditRequestBody {
  songId: string;
  edits: EditEntry[];
  newLrc?: string; // Full LRC for preview/reference
}

/**
 * POST /api/lrc-edits - Submit community LRC edits
 *
 * Creates a submission with individual edit records for granular review
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: EditRequestBody = await request.json();

    // Validate request
    if (!body.songId || !Array.isArray(body.edits) || body.edits.length === 0) {
      return NextResponse.json(
        { error: 'songId and edits array are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verify song exists and get current LRC
    const { data: song, error: songError } = await adminClient
      .from('card_songs')
      .select('id, title, lyrics_lrc')
      .eq('id', body.songId)
      .single();

    if (songError || !song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    // Get user's contributor record for trust score
    const { data: contributor } = await adminClient
      .from('lrc_contributors')
      .select('trust_score, total_points, songs_synced, best_streak')
      .eq('user_id', user.id)
      .single();

    const trustScore = contributor?.trust_score || 0;

    // Calculate points based on edits
    const { points: pointsEarned, breakdown } = calculateEditPoints({
      edits: body.edits.map((e) => ({
        editType: e.editType,
        deltaMagnitude: e.deltaMagnitude,
      })),
      submitterTrustScore: trustScore,
      matchesConsensus: false, // Will be determined during review
    });

    // Calculate average delta magnitude for impact score
    const timingEdits = body.edits.filter(
      (e) => e.editType === 'timing' && e.deltaMagnitude !== undefined
    );
    const avgDelta =
      timingEdits.length > 0
        ? timingEdits.reduce((sum, e) => sum + (e.deltaMagnitude || 0), 0) / timingEdits.length
        : 0;

    const maxDelta = Math.max(...body.edits.map((e) => e.deltaMagnitude || 0), 0);

    // Calculate impact score for review queue
    const impactScore = calculateImpactScore({
      linesChanged: body.edits.length,
      averageDeltaMagnitude: avgDelta,
      songPlayCount: 100, // TODO: Get actual play count
      negativeVoteRatio: 0,
    });

    // Check if this should be auto-approved
    const autoApproved = shouldAutoApprove({
      submitterTrustScore: trustScore,
      linesChanged: body.edits.length,
      maxDeltaMagnitude: maxDelta,
    });

    // Create submission
    const { data: submission, error: submissionError } = await adminClient
      .from('lrc_submissions')
      .insert({
        song_id: body.songId,
        user_id: user.id,
        timing_data: body.edits,
        submission_type: 'edit',
        lines_changed: body.edits.length,
        impact_score: impactScore,
        points_earned: pointsEarned,
        lines_count: body.edits.length,
        best_streak: 0,
        status: autoApproved ? 'approved' : 'pending',
        auto_approved: autoApproved,
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Failed to create submission:', submissionError);
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
    }

    // Create individual edit records for granular review
    const editRecords = body.edits.map((edit) => ({
      song_id: body.songId,
      user_id: user.id,
      submission_id: submission.id,
      edit_type: edit.editType,
      line_index: edit.lineIndex,
      original_timestamp: edit.originalTimestamp ?? null,
      new_timestamp: edit.newTimestamp ?? null,
      original_text: edit.originalText ?? null,
      new_text: edit.newText ?? null,
      delta_magnitude: edit.deltaMagnitude ?? null,
      context_before: edit.contextBefore ?? null,
      context_after: edit.contextAfter ?? null,
    }));

    const { error: editsError } = await adminClient.from('lrc_edits').insert(editRecords);

    if (editsError) {
      console.error('Failed to create edit records:', editsError);
      // Don't fail the whole request, submission was created
    }

    // If not auto-approved, add to review queue and notify admins
    if (!autoApproved) {
      await adminClient.from('lrc_review_queue').insert({
        submission_id: submission.id,
        priority_score: impactScore,
        submitter_trust_score: trustScore,
        lines_changed: body.edits.length,
        queue_status: 'pending',
      });

      // Get user's display name for notification
      const { data: profile } = await adminClient
        .from('profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .single();

      const submitterName = profile?.display_name || profile?.username || 'A contributor';

      // Notify admins about the new submission
      await notifyAdminsLrcSubmission(
        submitterName,
        song.title,
        body.songId,
        submission.id,
        body.edits.length
      );
    }

    // Update contributor stats
    if (contributor) {
      const newTotalPoints = contributor.total_points + pointsEarned;
      const newLevel = Math.floor(newTotalPoints / 500) + 1;

      await adminClient
        .from('lrc_contributors')
        .update({
          total_points: newTotalPoints,
          level: newLevel,
        })
        .eq('user_id', user.id);

      // Check for new achievements
      const { data: existingAchievements } = await adminClient
        .from('lrc_achievements')
        .select('achievement_type')
        .eq('user_id', user.id);

      const existingSet = new Set(existingAchievements?.map((a) => a.achievement_type) || []);
      const newAchievements = checkAchievements(
        {
          songsCount: contributor.songs_synced,
          totalPoints: newTotalPoints,
          bestStreak: contributor.best_streak,
          trustScore: trustScore,
          hadPerfectScore: false,
        },
        existingSet
      );

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
        breakdown,
        totalPoints: newTotalPoints,
        level: newLevel,
        autoApproved,
        newAchievements,
        message: autoApproved
          ? 'Your edit was auto-approved! Thank you for contributing.'
          : 'Your edit has been submitted for review. Thank you!',
      });
    } else {
      // Create new contributor record
      const newLevel = Math.floor(pointsEarned / 500) + 1;

      await adminClient.from('lrc_contributors').insert({
        user_id: user.id,
        total_points: pointsEarned,
        level: newLevel,
        songs_synced: 1,
        lines_synced: body.edits.length,
        best_streak: 0,
        accuracy_rate: 0,
      });

      // Grant first_sync achievement (first contribution)
      await adminClient.from('lrc_achievements').insert({
        user_id: user.id,
        achievement_type: 'first_sync',
        metadata: { song_id: body.songId, song_title: song.title, type: 'edit' },
      });

      return NextResponse.json({
        submission,
        pointsEarned,
        breakdown,
        totalPoints: pointsEarned,
        level: newLevel,
        autoApproved,
        newAchievements: ['first_sync'],
        message: autoApproved
          ? 'Your edit was auto-approved! Thank you for contributing.'
          : 'Your edit has been submitted for review. Thank you!',
      });
    }
  } catch (error) {
    console.error('Edit submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/lrc-edits?songId=xxx - Get pending edits for a song
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('songId');

    if (!songId) {
      return NextResponse.json({ error: 'songId query parameter required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Get pending submissions for this song
    const { data: submissions, error } = await adminClient
      .from('lrc_submissions')
      .select(
        `
        id,
        user_id,
        timing_data,
        lines_changed,
        status,
        created_at,
        user:profiles(display_name, username, avatar_url)
      `
      )
      .eq('song_id', songId)
      .eq('submission_type', 'edit')
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Failed to fetch edits:', error);
      return NextResponse.json({ error: 'Failed to fetch edits' }, { status: 500 });
    }

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Get edits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
