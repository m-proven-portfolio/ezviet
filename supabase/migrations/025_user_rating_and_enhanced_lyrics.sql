-- Migration: Add user_rating to lrc_submissions and lyrics_enhanced to card_songs
-- This supports:
-- 1. Mandatory rating feedback before submission
-- 2. Per-syllable timing for precision karaoke editing

-- ============================================================================
-- COLUMN: Add user_rating to lrc_submissions
-- ============================================================================
ALTER TABLE lrc_submissions
  ADD COLUMN IF NOT EXISTS user_rating TEXT
    CHECK (user_rating IN ('accurate', 'inaccurate', 'edit'));

COMMENT ON COLUMN lrc_submissions.user_rating IS 'User feedback on timing quality: accurate=good, inaccurate=needs work, edit=wants to fix';

-- Index for analyzing feedback patterns
CREATE INDEX IF NOT EXISTS idx_lrc_submissions_rating
  ON lrc_submissions(user_rating) WHERE user_rating IS NOT NULL;

-- ============================================================================
-- COLUMN: Add lyrics_enhanced to card_songs for syllable-level timing
-- ============================================================================
ALTER TABLE card_songs
  ADD COLUMN IF NOT EXISTS lyrics_enhanced JSONB;

COMMENT ON COLUMN card_songs.lyrics_enhanced IS 'Syllable-level timing data for precision karaoke. Format: {"lines": [{"time": 15.5, "text": "Xin chào", "syllables": [{"text": "Xin", "startTime": 15.5, "endTime": 15.8}, ...]}]}';

-- Index for songs with enhanced lyrics
CREATE INDEX IF NOT EXISTS idx_card_songs_has_enhanced
  ON card_songs((lyrics_enhanced IS NOT NULL));
