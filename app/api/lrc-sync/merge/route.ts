import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isModeratorOrAbove } from '@/lib/permissions';

/**
 * POST /api/lrc-sync/merge
 * Approve and merge a submitted LRC edit into production
 *
 * This endpoint:
 * 1. Validates moderator permissions
 * 2. Creates version history entry for rollback
 * 3. Updates song's lyrics_lrc with submitted content
 * 4. Updates submission status to 'approved'
 * 5. Awards points to contributor
 * 6. Marks queue item as completed
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check moderator permission
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_moderator')
      .eq('id', user.id)
      .single();

    if (!isModeratorOrAbove(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { submissionId, reviewNotes } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId is required' },
        { status: 400 }
      );
    }

    // Fetch the submission with song data
    const { data: submission, error: fetchError } = await supabase
      .from('lrc_submissions')
      .select(`
        *,
        song:card_songs(
          id,
          lyrics_lrc
        )
      `)
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (submission.status === 'approved') {
      return NextResponse.json(
        { error: 'Submission already approved' },
        { status: 400 }
      );
    }

    const songId = submission.song_id;
    const song = submission.song as { id: string; lyrics_lrc: string | null };
    const currentLrc = song?.lyrics_lrc || '';

    // Get the next version number for this song
    const { data: lastVersion } = await supabase
      .from('lrc_version_history')
      .select('version_number')
      .eq('song_id', songId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (lastVersion?.version_number || 0) + 1;

    // If this is version 1 and there's existing LRC, save it first as version 0
    if (nextVersion === 1 && currentLrc) {
      await adminSupabase
        .from('lrc_version_history')
        .insert({
          song_id: songId,
          lyrics_lrc: currentLrc,
          change_type: 'initial',
          changed_by: user.id,
          version_number: 0,
          change_summary: 'Original LRC before community edits',
        });
    }

    // Create version history entry for the new version
    const { error: versionError } = await adminSupabase
      .from('lrc_version_history')
      .insert({
        song_id: songId,
        lyrics_lrc: submission.submitted_lrc,
        change_type: 'merge',
        submission_id: submissionId,
        changed_by: user.id,
        version_number: nextVersion,
        change_summary: reviewNotes || `Merged submission from contributor`,
      });

    if (versionError) {
      console.error('Error creating version history:', versionError);
      return NextResponse.json(
        { error: 'Failed to create version history' },
        { status: 500 }
      );
    }

    // Update the song's lyrics_lrc
    const { error: songError } = await adminSupabase
      .from('card_songs')
      .update({ lyrics_lrc: submission.submitted_lrc })
      .eq('id', songId);

    if (songError) {
      console.error('Error updating song LRC:', songError);
      return NextResponse.json(
        { error: 'Failed to update song lyrics' },
        { status: 500 }
      );
    }

    // Update submission status to approved
    const { error: submissionError } = await adminSupabase
      .from('lrc_submissions')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (submissionError) {
      console.error('Error updating submission status:', submissionError);
      return NextResponse.json(
        { error: 'Failed to update submission status' },
        { status: 500 }
      );
    }

    // Award points to contributor (if not already awarded)
    if (submission.points_awarded && submission.points_awarded > 0) {
      const { error: pointsError } = await adminSupabase
        .from('profiles')
        .update({
          total_points: adminSupabase.rpc('increment_points', {
            user_id: submission.user_id,
            points: submission.points_awarded,
          }),
        })
        .eq('id', submission.user_id);

      // Use RPC for atomic increment if available, otherwise do manual update
      if (pointsError) {
        // Fallback: fetch and update
        const { data: contributor } = await supabase
          .from('profiles')
          .select('total_points')
          .eq('id', submission.user_id)
          .single();

        if (contributor) {
          await adminSupabase
            .from('profiles')
            .update({
              total_points: (contributor.total_points || 0) + submission.points_awarded,
            })
            .eq('id', submission.user_id);
        }
      }
    }

    // Mark queue item as completed
    await adminSupabase
      .from('lrc_review_queue')
      .update({ queue_status: 'completed' })
      .eq('submission_id', submissionId);

    return NextResponse.json({
      success: true,
      version: nextVersion,
      message: 'Submission merged successfully',
    });
  } catch (error) {
    console.error('Merge API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lrc-sync/merge
 * Reject a submission
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check moderator permission
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_moderator')
      .eq('id', user.id)
      .single();

    if (!isModeratorOrAbove(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { submissionId, rejectionReason } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId is required' },
        { status: 400 }
      );
    }

    // Update submission status to rejected
    const { error: submissionError } = await adminSupabase
      .from('lrc_submissions')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: rejectionReason || 'Rejected by moderator',
      })
      .eq('id', submissionId);

    if (submissionError) {
      console.error('Error rejecting submission:', submissionError);
      return NextResponse.json(
        { error: 'Failed to reject submission' },
        { status: 500 }
      );
    }

    // Mark queue item as completed
    await adminSupabase
      .from('lrc_review_queue')
      .update({ queue_status: 'completed' })
      .eq('submission_id', submissionId);

    return NextResponse.json({
      success: true,
      message: 'Submission rejected',
    });
  } catch (error) {
    console.error('Reject API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
