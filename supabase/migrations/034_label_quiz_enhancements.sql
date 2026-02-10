-- Label Quiz Enhancements
-- Adds TTS accent control and pronunciation guidance for Picture Quiz
--
-- Features:
-- 1. Set-level default accent (Northern/Southern Vietnamese)
-- 2. Per-label accent override
-- 3. TTS pronunciation hints
-- 4. Romanization field for learners

-- ============================================
-- LABEL_SETS: Add default accent for TTS
-- ============================================

ALTER TABLE label_sets
ADD COLUMN default_accent VARCHAR(10) DEFAULT 'south'
  CHECK (default_accent IN ('south', 'north'));

COMMENT ON COLUMN label_sets.default_accent IS
  'Default Vietnamese accent for TTS generation: south (Ho Chi Minh City/Saigon dialect) or north (Hanoi dialect)';

-- ============================================
-- LABELS: Add pronunciation/accent fields
-- ============================================

-- Per-label accent override (NULL means use set default)
ALTER TABLE labels
ADD COLUMN accent VARCHAR(10)
  CHECK (accent IN ('south', 'north') OR accent IS NULL);

-- TTS hint: modified text to help TTS pronounce correctly
-- Example: For "phở", might use "fuh" or phonetic spelling
ALTER TABLE labels
ADD COLUMN tts_hint TEXT;

-- Romanization: phonetic spelling for learners
-- Example: "/fuh (falling)/" for "phở"
ALTER TABLE labels
ADD COLUMN romanization TEXT;

-- Index for accent queries (when filtering by accent)
CREATE INDEX idx_labels_accent ON labels(accent) WHERE accent IS NOT NULL;

COMMENT ON COLUMN labels.accent IS
  'Per-label accent override. NULL = use label_sets.default_accent';
COMMENT ON COLUMN labels.tts_hint IS
  'Modified text to feed to TTS for better pronunciation. Used instead of vietnamese field when generating audio.';
COMMENT ON COLUMN labels.romanization IS
  'Phonetic romanization for learners, e.g., "/fuh (falling)/" for phở';
