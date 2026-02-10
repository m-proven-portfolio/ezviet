import { createAdminClient } from '../lib/supabase/server';

const supabase = createAdminClient();

async function checkLrcStatus() {
  const { data: songs, error } = await supabase
    .from('card_songs')
    .select('id, title, card_id, lyrics_lrc, lyrics_plain')
    .order('title');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== SONGS WITHOUT LRC LYRICS ===\n');

  const withoutLrc = songs.filter(s => !s.lyrics_lrc || s.lyrics_lrc.trim() === '');
  const withLrc = songs.filter(s => s.lyrics_lrc && s.lyrics_lrc.trim() !== '');

  withoutLrc.forEach(s => {
    const hasPlain = s.lyrics_plain && s.lyrics_plain.trim() !== '';
    console.log('- ' + s.title + (hasPlain ? ' (has plain lyrics)' : ' (no lyrics at all)'));
  });

  console.log('\n=== SUMMARY ===');
  console.log('Total songs: ' + songs.length);
  console.log('With LRC: ' + withLrc.length);
  console.log('Without LRC: ' + withoutLrc.length);

  if (withLrc.length > 0) {
    console.log('\n=== SONGS WITH LRC (Karaoke Hero ready) ===\n');
    withLrc.forEach(s => console.log('✓ ' + s.title));
  }
}

checkLrcStatus();
