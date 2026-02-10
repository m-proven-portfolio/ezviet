import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

interface CloneLrcOptions {
  sourceSongId: string;
  targetSongId: string;
  userId: string;
  supabase: SupabaseClient<Database>;
}

interface CloneLrcResult {
  success: boolean;
  error?: string;
  lrcContent?: string;
  versionNumber?: number;
}

/**
 * Clones LRC lyrics from a source song to a target song.
 * Creates a version history entry with change_type: 'clone' for audit trail.
 *
 * @param options - Clone options including source/target song IDs and user ID
 * @returns Result object with success status and cloned LRC content
 */
export async function cloneLrc(options: CloneLrcOptions): Promise<CloneLrcResult> {
  const { sourceSongId, targetSongId, userId, supabase } = options;

  // 1. Fetch source song's LRC content
  const { data: sourceSong, error: fetchError } = await supabase
    .from('card_songs')
    .select('lyrics_lrc, lyrics_plain, lyrics_enhanced, title')
    .eq('id', sourceSongId)
    .single();

  if (fetchError || !sourceSong) {
    return {
      success: false,
      error: fetchError?.message || 'Source song not found',
    };
  }

  if (!sourceSong.lyrics_lrc) {
    return {
      success: false,
      error: 'Source song has no LRC lyrics to clone',
    };
  }

  // 2. Update target song with cloned lyrics
  const { error: updateError } = await supabase
    .from('card_songs')
    .update({
      lyrics_lrc: sourceSong.lyrics_lrc,
      lyrics_plain: sourceSong.lyrics_plain,
      lyrics_enhanced: sourceSong.lyrics_enhanced,
    })
    .eq('id', targetSongId);

  if (updateError) {
    return {
      success: false,
      error: `Failed to update target song: ${updateError.message}`,
    };
  }

  // 3. Get current max version number for target song
  const { data: maxVersion } = await supabase
    .from('lrc_version_history')
    .select('version_number')
    .eq('song_id', targetSongId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const nextVersionNumber = (maxVersion?.version_number || 0) + 1;

  // 4. Create version history entry for the clone
  const { error: historyError } = await supabase.from('lrc_version_history').insert({
    song_id: targetSongId,
    lyrics_lrc: sourceSong.lyrics_lrc,
    change_type: 'clone',
    changed_by: userId,
    version_number: nextVersionNumber,
    change_summary: `Cloned from "${sourceSong.title || 'parent song'}"`,
    cloned_from_song_id: sourceSongId,
  });

  if (historyError) {
    // Log but don't fail - the LRC was cloned successfully
    console.warn('Failed to create version history entry:', historyError);
  }

  return {
    success: true,
    lrcContent: sourceSong.lyrics_lrc,
    versionNumber: nextVersionNumber,
  };
}

/**
 * Batch clone LRC to multiple target songs.
 * Useful for bulk variation creation.
 */
export async function cloneLrcBatch(
  sourceSongId: string,
  targetSongIds: string[],
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<{ successful: string[]; failed: Array<{ id: string; error: string }> }> {
  const results = await Promise.all(
    targetSongIds.map(async (targetId) => {
      const result = await cloneLrc({
        sourceSongId,
        targetSongId: targetId,
        userId,
        supabase,
      });

      return {
        id: targetId,
        ...result,
      };
    })
  );

  return {
    successful: results.filter((r) => r.success).map((r) => r.id),
    failed: results
      .filter((r) => !r.success)
      .map((r) => ({ id: r.id, error: r.error || 'Unknown error' })),
  };
}
