import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Cleans LRC content by removing non-lyric lines:
 * - Section markers (Intro, Verse, Chorus, etc.)
 * - Separator lines (dashes, dots, etc.)
 * - Bracketed annotations ((pause), [instrumental], etc.)
 */
function cleanLrcContent(lrc: string): string {
  const lines = lrc.split('\n');
  const cleanedLines: string[] = [];

  // Regex to match timestamp
  const timeRegex = /^\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      cleanedLines.push(line);
      continue;
    }

    // Keep metadata lines like [ar:Artist]
    if (/^\[[a-z]{2}:/.test(trimmed)) {
      cleanedLines.push(line);
      continue;
    }

    // Check if it's a timestamped line
    const match = trimmed.match(timeRegex);
    if (!match) {
      // Not a timestamped line, keep it (might be header or other content)
      cleanedLines.push(line);
      continue;
    }

    // Extract text after timestamp(s)
    const textMatch = trimmed.match(/\]([^\[]*?)$/);
    const text = textMatch ? textMatch[1].trim() : '';

    // Skip empty lines
    if (!text) continue;

    // Skip section markers
    const sectionPattern = /^[\[(]?(intro|verse|chorus|pre-chorus|bridge|outro|hook|interlude|instrumental|break|ad[- ]?lib)(\s*\d*)?[\])]?$/i;
    if (sectionPattern.test(text)) continue;

    // Skip separator lines
    if (/^[-–—_.·•*=~]+$/.test(text)) continue;

    // Skip bracketed annotations
    if (/^[(\[{][^)\]}]*[)\]}]$/.test(text)) continue;

    // Keep this line
    cleanedLines.push(line);
  }

  return cleanedLines.join('\n');
}

export async function POST() {
  try {
    const supabase = createAdminClient();

    // Fetch all songs with LRC lyrics
    const { data: songs, error: fetchError } = await supabase
      .from('card_songs')
      .select('id, title, lyrics_lrc')
      .not('lyrics_lrc', 'is', null);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!songs || songs.length === 0) {
      return NextResponse.json({ message: 'No songs with LRC found', updated: 0 });
    }

    let updated = 0;
    const changes: { id: string; title: string; before: number; after: number }[] = [];

    for (const song of songs) {
      if (!song.lyrics_lrc) continue;

      const cleaned = cleanLrcContent(song.lyrics_lrc);

      // Only update if content changed
      if (cleaned !== song.lyrics_lrc) {
        const { error: updateError } = await supabase
          .from('card_songs')
          .update({ lyrics_lrc: cleaned })
          .eq('id', song.id);

        if (!updateError) {
          updated++;
          changes.push({
            id: song.id,
            title: song.title,
            before: song.lyrics_lrc.split('\n').length,
            after: cleaned.split('\n').length,
          });
        }
      }
    }

    return NextResponse.json({
      message: `Cleaned ${updated} songs`,
      total: songs.length,
      updated,
      changes,
    });
  } catch (error) {
    console.error('LRC cleanup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
