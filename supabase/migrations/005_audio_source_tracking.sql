-- Track audio source for Vietnamese terms
-- Enables distinguishing between auto-generated TTS and manual uploads
-- Future-proofs for community voice submissions

ALTER TABLE card_terms
ADD COLUMN IF NOT EXISTS audio_source text DEFAULT 'auto';
-- Values: 'auto' (Google TTS), 'admin' (manual upload), 'community' (future user submissions)

-- Add comment for documentation
COMMENT ON COLUMN card_terms.audio_source IS
  'Source of audio: auto (TTS), admin (manual upload), community (future user submissions)';
