import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isModeratorOrAbove } from '@/lib/permissions';

interface EnhancedLyricsBody {
  lyrics_enhanced: {
    version: number;
    lines: unknown[];
  };
}

// POST /api/songs/[songId]/enhanced-lyrics - Save enhanced lyrics (moderator+)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ songId: string }> }
) {
  try {
    const { songId } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check moderator permission
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_moderator, is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !isModeratorOrAbove(profile)) {
      return NextResponse.json(
        { error: 'Moderator access required' },
        { status: 403 }
      );
    }

    const body: EnhancedLyricsBody = await request.json();

    // Validate request
    if (!body.lyrics_enhanced || typeof body.lyrics_enhanced !== 'object') {
      return NextResponse.json(
        { error: 'lyrics_enhanced is required' },
        { status: 400 }
      );
    }

    // Use admin client for writes
    const adminClient = createAdminClient();

    // Verify song exists
    const { data: song, error: songError } = await adminClient
      .from('card_songs')
      .select('id, title')
      .eq('id', songId)
      .single();

    if (songError || !song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    // Update song with enhanced lyrics
    const { error: updateError } = await adminClient
      .from('card_songs')
      .update({
        lyrics_enhanced: body.lyrics_enhanced,
      })
      .eq('id', songId);

    if (updateError) {
      console.error('Failed to update song:', updateError);
      return NextResponse.json(
        { error: 'Failed to save enhanced lyrics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enhanced lyrics saved successfully',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET /api/songs/[songId]/enhanced-lyrics - Get enhanced lyrics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ songId: string }> }
) {
  try {
    const { songId } = await params;
    const supabase = await createClient();

    const { data: song, error } = await supabase
      .from('card_songs')
      .select('lyrics_enhanced')
      .eq('id', songId)
      .single();

    if (error || !song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json({
      lyrics_enhanced: song.lyrics_enhanced,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
