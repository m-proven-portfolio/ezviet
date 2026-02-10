import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

async function checkAdminAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return { authorized: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { authorized: true, response: null };
}

/**
 * Converts seconds to LRC timestamp format [mm:ss.xx]
 */
function secondsToLrcTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `[${mins.toString().padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}]`;
}

/**
 * Generates LRC content from plain lyrics and song duration
 * Uses even distribution with a slight offset at the start
 */
function generateLrcFromPlain(plainLyrics: string, durationSeconds: number): string {
  // Split lyrics into lines, filter empty
  const lines = plainLyrics
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) return '';

  // Start 2 seconds in (skip intro), end 5 seconds before end (skip outro)
  const startOffset = 2;
  const endOffset = 5;
  const effectiveDuration = Math.max(durationSeconds - startOffset - endOffset, lines.length);

  // Calculate time per line
  const timePerLine = effectiveDuration / lines.length;

  // Generate LRC lines
  const lrcLines = lines.map((line, index) => {
    const timestamp = startOffset + (index * timePerLine);
    return `${secondsToLrcTimestamp(timestamp)}${line}`;
  });

  return lrcLines.join('\n');
}

// GET: Preview what would be generated (dry run)
export async function GET(_request: NextRequest) {
  const auth = await checkAdminAuth();
  if (!auth.authorized) {
    return auth.response!;
  }

  const adminClient = createAdminClient();

  const { data: songs, error } = await adminClient
    .from('card_songs')
    .select('id, title, lyrics_plain, lyrics_lrc, duration_seconds')
    .not('lyrics_plain', 'is', null)
    .order('title');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter to songs with plain lyrics but no LRC
  const needsLrc = songs.filter(s =>
    s.lyrics_plain &&
    s.lyrics_plain.trim() !== '' &&
    (!s.lyrics_lrc || s.lyrics_lrc.trim() === '')
  );

  const previews = needsLrc.map(song => {
    const duration = song.duration_seconds || 120; // Default 2 min if unknown
    const generatedLrc = generateLrcFromPlain(song.lyrics_plain!, duration);
    const lineCount = generatedLrc.split('\n').length;

    return {
      id: song.id,
      title: song.title,
      duration: duration,
      lineCount,
      preview: generatedLrc.split('\n').slice(0, 5).join('\n') + (lineCount > 5 ? '\n...' : ''),
    };
  });

  return NextResponse.json({
    message: 'Dry run - no changes made. POST to apply.',
    count: previews.length,
    songs: previews,
  });
}

// POST: Actually generate and save LRC for all songs without it
export async function POST(_request: NextRequest) {
  const auth = await checkAdminAuth();
  if (!auth.authorized) {
    return auth.response!;
  }

  const adminClient = createAdminClient();

  // Get songs that need LRC generation
  const { data: songs, error: fetchError } = await adminClient
    .from('card_songs')
    .select('id, title, lyrics_plain, lyrics_lrc, duration_seconds')
    .not('lyrics_plain', 'is', null)
    .order('title');

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // Filter to songs with plain lyrics but no LRC
  const needsLrc = songs.filter(s =>
    s.lyrics_plain &&
    s.lyrics_plain.trim() !== '' &&
    (!s.lyrics_lrc || s.lyrics_lrc.trim() === '')
  );

  if (needsLrc.length === 0) {
    return NextResponse.json({
      message: 'All songs with plain lyrics already have LRC!',
      updated: 0
    });
  }

  const results: { id: string; title: string; success: boolean; error?: string }[] = [];

  // Generate and update each song
  for (const song of needsLrc) {
    const duration = song.duration_seconds || 120;
    const generatedLrc = generateLrcFromPlain(song.lyrics_plain!, duration);

    const { error: updateError } = await adminClient
      .from('card_songs')
      .update({ lyrics_lrc: generatedLrc })
      .eq('id', song.id);

    results.push({
      id: song.id,
      title: song.title,
      success: !updateError,
      error: updateError?.message,
    });
  }

  const successCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;

  return NextResponse.json({
    message: `Generated LRC for ${successCount} songs${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
    updated: successCount,
    failed: failedCount,
    results,
  });
}
