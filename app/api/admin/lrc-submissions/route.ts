import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// GET /api/admin/lrc-submissions - Get pending submissions for review
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const songId = searchParams.get('songId');

    const adminClient = createAdminClient();

    let query = adminClient
      .from('lrc_submissions')
      .select(`
        id,
        song_id,
        user_id,
        timing_data,
        accuracy_score,
        points_earned,
        lines_count,
        best_streak,
        status,
        reviewed_by,
        reviewed_at,
        review_notes,
        created_at
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (songId) {
      query = query.eq('song_id', songId);
    }

    const { data: submissions, error } = await query.limit(50);

    if (error) {
      console.error('Failed to fetch submissions:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    // Fetch related data
    const songIds = [...new Set(submissions?.map(s => s.song_id) || [])];
    const userIds = [...new Set(submissions?.map(s => s.user_id) || [])];

    const [songsRes, profilesRes] = await Promise.all([
      songIds.length > 0
        ? adminClient.from('card_songs').select('id, title, lyrics_lrc, storage_path').in('id', songIds)
        : { data: [] },
      userIds.length > 0
        ? adminClient.from('profiles').select('id, display_name, username').in('id', userIds)
        : { data: [] },
    ]);

    const songMap = new Map(songsRes.data?.map(s => [s.id, s]) || []);
    const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);

    // Combine data
    const enrichedSubmissions = submissions?.map(sub => ({
      ...sub,
      song: songMap.get(sub.song_id),
      user: profileMap.get(sub.user_id),
    })) || [];

    return NextResponse.json({ submissions: enrichedSubmissions });
  } catch (error) {
    console.error('Admin submissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/lrc-submissions - Update submission status (approve/reject)
export async function PATCH(request: NextRequest) {
  try {
    // Check if user is admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { submissionId, status, reviewNotes } = body;

    if (!submissionId || !['approved', 'rejected', 'merged'].includes(status)) {
      return NextResponse.json(
        { error: 'submissionId and valid status are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Get the submission
    const { data: submission, error: fetchError } = await adminClient
      .from('lrc_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Update submission status
    const { error: updateError } = await adminClient
      .from('lrc_submissions')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null,
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Failed to update submission:', updateError);
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
    }

    // If merged, update the song's LRC
    if (status === 'merged') {
      // Get song's current LRC
      const { data: song } = await adminClient
        .from('card_songs')
        .select('lyrics_lrc')
        .eq('id', submission.song_id)
        .single();

      if (song) {
        // Import merge function
        const { mergeLrc } = await import('@/lib/lrc-sync');
        const newLrc = mergeLrc(song.lyrics_lrc || '', submission.timing_data);

        // Update song
        await adminClient
          .from('card_songs')
          .update({ lyrics_lrc: newLrc, updated_at: new Date().toISOString() })
          .eq('id', submission.song_id);
      }

      // Increase user's trust score slightly
      const { data: contributor } = await adminClient
        .from('lrc_contributors')
        .select('trust_score')
        .eq('user_id', submission.user_id)
        .single();

      if (contributor) {
        await adminClient
          .from('lrc_contributors')
          .update({
            trust_score: Math.min(1.0, (contributor.trust_score || 0) + 0.05),
          })
          .eq('user_id', submission.user_id);
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Admin submission update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
