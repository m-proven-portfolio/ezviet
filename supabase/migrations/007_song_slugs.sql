-- Add SEO-friendly slugs to card_songs
-- Enables URLs like /learn/pomelo/songs/con-buom-xuan instead of UUIDs

-- ============================================
-- VIETNAMESE SLUG FUNCTION
-- ============================================
-- Converts Vietnamese text to URL-safe slugs
-- "Con Bướm Xuân" -> "con-buom-xuan"

CREATE OR REPLACE FUNCTION vietnamese_to_slug(input_text text)
RETURNS text AS $$
DECLARE
  result text;
BEGIN
  result := input_text;

  -- Lowercase
  result := lower(result);

  -- Vietnamese diacritics to ASCII
  -- A variations
  result := regexp_replace(result, '[àáạảãâầấậẩẫăằắặẳẵ]', 'a', 'g');
  -- E variations
  result := regexp_replace(result, '[èéẹẻẽêềếệểễ]', 'e', 'g');
  -- I variations
  result := regexp_replace(result, '[ìíịỉĩ]', 'i', 'g');
  -- O variations
  result := regexp_replace(result, '[òóọỏõôồốộổỗơờớợởỡ]', 'o', 'g');
  -- U variations
  result := regexp_replace(result, '[ùúụủũưừứựửữ]', 'u', 'g');
  -- Y variations
  result := regexp_replace(result, '[ỳýỵỷỹ]', 'y', 'g');
  -- D with stroke
  result := regexp_replace(result, 'đ', 'd', 'g');

  -- Replace spaces and special chars with hyphens
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');

  -- Remove leading/trailing hyphens
  result := trim(both '-' from result);

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- ADD SLUG COLUMN
-- ============================================
ALTER TABLE card_songs ADD COLUMN IF NOT EXISTS slug text;

-- Generate slugs for existing songs
UPDATE card_songs
SET slug = vietnamese_to_slug(title)
WHERE slug IS NULL;

-- Handle duplicate slugs within the same card by appending a number
WITH duplicates AS (
  SELECT id, card_id, slug,
    ROW_NUMBER() OVER (PARTITION BY card_id, slug ORDER BY created_at) as rn
  FROM card_songs
)
UPDATE card_songs cs
SET slug = cs.slug || '-' || (d.rn)::text
FROM duplicates d
WHERE cs.id = d.id AND d.rn > 1;

-- Now make slug NOT NULL and add unique constraint per card
ALTER TABLE card_songs ALTER COLUMN slug SET NOT NULL;

-- Unique slug per card (same song title can exist under different cards)
CREATE UNIQUE INDEX IF NOT EXISTS idx_card_songs_slug
ON card_songs(card_id, slug);

-- Index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_card_songs_slug_lookup
ON card_songs(slug);

-- ============================================
-- AUTO-GENERATE SLUG ON INSERT
-- ============================================
CREATE OR REPLACE FUNCTION auto_generate_song_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 1;
BEGIN
  -- Generate base slug from title if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := vietnamese_to_slug(NEW.title);
  ELSE
    base_slug := vietnamese_to_slug(NEW.slug);
  END IF;

  final_slug := base_slug;

  -- Check for uniqueness within the card, append number if needed
  WHILE EXISTS (
    SELECT 1 FROM card_songs
    WHERE card_id = NEW.card_id
    AND slug = final_slug
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::text;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER card_songs_auto_slug
  BEFORE INSERT OR UPDATE OF title ON card_songs
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_song_slug();
