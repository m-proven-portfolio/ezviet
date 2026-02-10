-- Song Variations: Allow multiple musical versions of the same song
-- Migration: 031_song_variations.sql
--
-- Enables:
-- - Linking variations to a parent song (same lyrics, different style)
-- - Multi-genre tagging for filtering (Hip-Hop + Vina House)
-- - Independent LRC editing per variation
-- - Bulk upload workflows

-- ============================================================================
-- COLUMNS: Add variation relationship to card_songs
-- ============================================================================

-- Parent song reference (NULL = original/standalone, set = variation)
ALTER TABLE card_songs
ADD COLUMN IF NOT EXISTS parent_song_id UUID REFERENCES card_songs(id) ON DELETE SET NULL;

-- Human-readable variation label (e.g., "Lo-Fi Remix", "Hip-Hop Version")
ALTER TABLE card_songs
ADD COLUMN IF NOT EXISTS variation_label TEXT;

-- Primary version flag (shown by default in listings)
ALTER TABLE card_songs
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true;

-- ============================================================================
-- COLUMN: Multi-genre support (array replaces single genre)
-- ============================================================================

-- Array of genre tags for multi-genre filtering
ALTER TABLE card_songs
ADD COLUMN IF NOT EXISTS genres TEXT[] DEFAULT NULL;

-- ============================================================================
-- INDEXES: Efficient lookups for variations and genres
-- ============================================================================

-- Find all variations of a parent song
CREATE INDEX IF NOT EXISTS idx_card_songs_parent
  ON card_songs(parent_song_id)
  WHERE parent_song_id IS NOT NULL;

-- GIN index for array containment queries (multi-genre filtering)
CREATE INDEX IF NOT EXISTS idx_card_songs_genres
  ON card_songs USING GIN(genres);

-- Combined index for filtering by card + parent (variation grouping)
CREATE INDEX IF NOT EXISTS idx_card_songs_card_parent
  ON card_songs(card_id, parent_song_id);

-- ============================================================================
-- DATA MIGRATION: Migrate existing genre to genres array
-- ============================================================================

-- Preserve existing genre data in the new array column
UPDATE card_songs
SET genres = ARRAY[genre]
WHERE genre IS NOT NULL
  AND genre != ''
  AND genres IS NULL;

-- ============================================================================
-- VERSION HISTORY: Support 'clone' as a change type for LRC cloning
-- ============================================================================

-- Drop existing constraint (PostgreSQL doesn't support ALTER CHECK directly)
ALTER TABLE lrc_version_history
DROP CONSTRAINT IF EXISTS lrc_version_history_change_type_check;

-- Add updated constraint with 'clone' option
ALTER TABLE lrc_version_history
ADD CONSTRAINT lrc_version_history_change_type_check
CHECK (change_type IN ('initial', 'merge', 'rollback', 'admin_edit', 'clone'));

-- Track which song the LRC was cloned from (for audit trail)
ALTER TABLE lrc_version_history
ADD COLUMN IF NOT EXISTS cloned_from_song_id UUID REFERENCES card_songs(id) ON DELETE SET NULL;

-- ============================================================================
-- COMMENTS: Document the new columns
-- ============================================================================

COMMENT ON COLUMN card_songs.parent_song_id IS
  'Links to parent song for variations. NULL = original/standalone song';

COMMENT ON COLUMN card_songs.variation_label IS
  'Human-readable label like "Lo-Fi Version" or "Hip-Hop Remix"';

COMMENT ON COLUMN card_songs.is_primary IS
  'Primary version shown by default in listings (usually the original)';

COMMENT ON COLUMN card_songs.genres IS
  'Array of genre tags for multi-genre filtering (e.g., {"Hip-Hop", "Vina House"})';

COMMENT ON COLUMN lrc_version_history.cloned_from_song_id IS
  'Source song when LRC was cloned for a variation';
