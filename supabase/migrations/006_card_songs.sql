-- Card Songs Feature
-- Learning songs attached to vocabulary cards with karaoke lyrics

-- ============================================
-- CARD SONGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS card_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,

  -- File storage
  storage_path text NOT NULL,
  duration_seconds int,
  file_size int,
  mime_type text DEFAULT 'audio/mpeg',

  -- Metadata (auto-extracted from ID3, admin-editable)
  title text NOT NULL,
  artist text,
  album text,
  year int,
  cover_image_path text,

  -- Learning context
  level int CHECK (level IS NULL OR (level >= 1 AND level <= 10)),
  purpose text,
  learning_goal text,

  -- Lyrics
  lyrics_lrc text,    -- LRC format: "[00:12.34]Line one\n[00:15.00]Line two"
  lyrics_plain text,  -- Plain text fallback

  -- Ordering
  sort_order int DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_card_songs_card ON card_songs(card_id);
CREATE INDEX IF NOT EXISTS idx_card_songs_sort ON card_songs(card_id, sort_order);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE card_songs ENABLE ROW LEVEL SECURITY;

-- Everyone can read songs
CREATE POLICY "Card songs are viewable by everyone"
  ON card_songs FOR SELECT
  USING (true);

-- Admin operations use service role key (bypasses RLS)

-- ============================================
-- STORAGE BUCKET: cards-songs
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cards-songs',
  'cards-songs',
  true,
  52428800, -- 50MB limit for songs
  ARRAY['audio/mpeg', 'audio/mp3']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Public read access
CREATE POLICY "Public read access for cards-songs"
ON storage.objects FOR SELECT
USING (bucket_id = 'cards-songs');

-- Storage policy: Allow uploads (admin uses service role)
CREATE POLICY "Allow uploads to cards-songs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cards-songs');

-- Storage policy: Allow deletes
CREATE POLICY "Allow deletes from cards-songs"
ON storage.objects FOR DELETE
USING (bucket_id = 'cards-songs');

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_card_songs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER card_songs_updated_at
  BEFORE UPDATE ON card_songs
  FOR EACH ROW
  EXECUTE FUNCTION update_card_songs_updated_at();
