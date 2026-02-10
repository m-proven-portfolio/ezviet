-- Add genre column to card_songs for music style categorization
-- Used for filtering songs in /karaoke by genre

ALTER TABLE card_songs
ADD COLUMN IF NOT EXISTS genre text DEFAULT NULL;

-- Add index for genre filtering
CREATE INDEX IF NOT EXISTS idx_card_songs_genre ON card_songs(genre);

-- Comment for documentation
COMMENT ON COLUMN card_songs.genre IS 'Music genre/style (e.g., Lo-Fi, Hip-Hop, Vina House, Pop)';
