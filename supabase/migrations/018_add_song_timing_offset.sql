-- Add timing_offset column to card_songs for per-song lyrics sync adjustment
-- Positive values = lyrics appear earlier, Negative = lyrics appear later
-- This overrides the global offset when set

ALTER TABLE card_songs
ADD COLUMN IF NOT EXISTS timing_offset DECIMAL(4,2) DEFAULT NULL;

COMMENT ON COLUMN card_songs.timing_offset IS 'Per-song lyrics timing offset in seconds. Positive = earlier, Negative = later. NULL = use global offset.';
