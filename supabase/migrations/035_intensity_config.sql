-- Migration: Add intensity_config to label_sets
--
-- This adds the intensity_config JSONB column to support the new
-- Learning Intensity Levels system (Gentle/Standard/Intensive presets
-- with optional overrides).
--
-- The column is nullable - NULL means use legacy difficulty field.

-- Add intensity_config column to label_sets
ALTER TABLE label_sets
ADD COLUMN IF NOT EXISTS intensity_config JSONB DEFAULT NULL;

-- Add comment explaining the schema
COMMENT ON COLUMN label_sets.intensity_config IS
'Learning intensity configuration. Schema: { preset: "gentle"|"standard"|"intensive", matching?: "fuzzy"|"diacritic_insensitive"|"exact", hints?: {...}, timer?: {...}, scoring?: {...}, display?: {...}, gamification?: {...}, future?: {...} }. NULL means use legacy difficulty column for backward compatibility.';

-- Create index for querying by preset (useful for analytics)
CREATE INDEX IF NOT EXISTS idx_label_sets_intensity_preset
ON label_sets ((intensity_config->>'preset'))
WHERE intensity_config IS NOT NULL;

-- Future: Add to cards table when ready
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS intensity_config JSONB DEFAULT NULL;
