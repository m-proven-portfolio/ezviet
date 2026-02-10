import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { aggregateVotes, type VoteType } from '@/lib/lrc-voting';

interface VoteRequestBody {
  songId: string;
  voteType: VoteType;
  editSubmissionId?: string;
  accuracyScore?: number;
}

/**
 * POST /api/lrc-votes - Submit a vote after karaoke session
 *
 * Users can vote once per song per day
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

    const body: VoteRequestBody = await request.json();

    // Validate request
    if (!body.songId || !['accurate', 'inaccurate', 'edit'].includes(body.voteType)) {
      return NextResponse.json(
        { error: 'songId and valid voteType (accurate/inaccurate/edit) required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verify song exists
    const { data: song, error: songError } = await adminClient
      .from('card_songs')
      .select('id')
      .eq('id', body.songId)
      .single();

    if (songError || !song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    // Check if user already voted on this song today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingVote } = await adminClient
      .from('lrc_votes')
      .select('id')
      .eq('user_id', user.id)
      .eq('song_id', body.songId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .maybeSingle();

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this song today', code: 'ALREADY_VOTED' },
        { status: 429 }
      );
    }

    // Insert the vote
    const { data: vote, error: voteError } = await adminClient
      .from('lrc_votes')
      .insert({
        song_id: body.songId,
        user_id: user.id,
        vote_type: body.voteType,
        edit_submission_id: body.editSubmissionId || null,
        accuracy_score_at_vote: body.accuracyScore || null,
      })
      .select()
      .single();

    if (voteError) {
      console.error('Failed to insert vote:', voteError);
      return NextResponse.json({ error: 'Failed to save vote' }, { status: 500 });
    }

    // Get updated vote stats for this song
    const { data: allVotes } = await adminClient
      .from('lrc_votes')
      .select('vote_type, created_at')
      .eq('song_id', body.songId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const stats = aggregateVotes(body.songId, allVotes || []);

    return NextResponse.json({
      vote,
      stats,
      message: 'Thanks for your feedback!',
    });
  } catch (error) {
    console.error('Vote API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/lrc-votes?songId=xxx - Get vote stats for a song
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('songId');

    if (!songId) {
      return NextResponse.json({ error: 'songId query parameter required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Get votes from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: votes, error } = await adminClient
      .from('lrc_votes')
      .select('vote_type, created_at')
      .eq('song_id', songId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Failed to fetch votes:', error);
      return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 });
    }

    const stats = aggregateVotes(songId, votes || []);

    // Also check if the current user has voted today
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userVotedToday = false;
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayVote } = await adminClient
        .from('lrc_votes')
        .select('vote_type')
        .eq('user_id', user.id)
        .eq('song_id', songId)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .maybeSingle();

      userVotedToday = !!todayVote;
    }

    return NextResponse.json({
      stats,
      userVotedToday,
    });
  } catch (error) {
    console.error('Vote stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
