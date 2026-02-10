import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createAdminClient();

  const { data: songs, error } = await supabase
    .from('card_songs')
    .select('id, title, card_id, lyrics_lrc, lyrics_plain')
    .order('title');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const withoutLrc = songs.filter(s => !s.lyrics_lrc || s.lyrics_lrc.trim() === '');
  const withLrc = songs.filter(s => s.lyrics_lrc && s.lyrics_lrc.trim() !== '');

  return NextResponse.json({
    summary: {
      total: songs.length,
      withLrc: withLrc.length,
      withoutLrc: withoutLrc.length,
    },
    withoutLrc: withoutLrc.map(s => ({
      id: s.id,
      title: s.title,
      hasPlainLyrics: !!(s.lyrics_plain && s.lyrics_plain.trim() !== ''),
    })),
    withLrc: withLrc.map(s => ({
      id: s.id,
      title: s.title,
    })),
  });
}
