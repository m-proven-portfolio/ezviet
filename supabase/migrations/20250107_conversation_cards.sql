-- ============================================
-- CONVERSATION CARDS SCHEMA
-- ============================================
-- Interactive conversation flashcards that teach
-- Vietnamese phrases in real-world contexts.
-- ============================================

-- Main conversation cards table
CREATE TABLE IF NOT EXISTS conversation_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_vi TEXT, -- Vietnamese title (optional)

  -- Scene image (required)
  scene_image_path TEXT NOT NULL,

  -- Categorization (reuses existing categories)
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Difficulty 1-5 (matches regular cards)
  difficulty INTEGER DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),

  -- AI generation metadata
  generated_by_ai BOOLEAN DEFAULT false,
  prompt_used TEXT, -- The prompt that generated this conversation
  prompt_version TEXT,

  -- SEO
  meta_description TEXT,

  -- Publishing
  is_published BOOLEAN DEFAULT true,

  -- Analytics
  view_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Individual dialogue lines within a conversation
CREATE TABLE IF NOT EXISTS conversation_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_card_id UUID NOT NULL REFERENCES conversation_cards(id) ON DELETE CASCADE,

  -- Speaker info (e.g., "Customer", "Barista", "A", "B")
  speaker TEXT NOT NULL,
  speaker_vi TEXT, -- Vietnamese speaker name (optional, e.g., "Khách hàng")

  -- The dialogue content
  vietnamese TEXT NOT NULL,
  english TEXT NOT NULL,
  romanization TEXT, -- Phonetic pronunciation guide

  -- Audio for this specific line
  audio_path TEXT,
  audio_source TEXT CHECK (audio_source IN ('auto', 'admin', 'community')),

  -- Order in the conversation
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_cards_category ON conversation_cards(category_id);
CREATE INDEX IF NOT EXISTS idx_conversation_cards_published ON conversation_cards(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_conversation_cards_slug ON conversation_cards(slug);
CREATE INDEX IF NOT EXISTS idx_conversation_lines_card ON conversation_lines(conversation_card_id);
CREATE INDEX IF NOT EXISTS idx_conversation_lines_order ON conversation_lines(conversation_card_id, sort_order);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_conversation_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversation_cards_updated_at
  BEFORE UPDATE ON conversation_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_cards_updated_at();

-- View count increment function
CREATE OR REPLACE FUNCTION increment_conversation_view_count(p_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE conversation_cards
  SET view_count = view_count + 1
  WHERE slug = p_slug;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (assuming similar to cards table)
ALTER TABLE conversation_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_lines ENABLE ROW LEVEL SECURITY;

-- Public read access for published conversations
CREATE POLICY "Public read access for published conversations"
  ON conversation_cards FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public read access for conversation lines"
  ON conversation_lines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_cards
      WHERE conversation_cards.id = conversation_lines.conversation_card_id
      AND conversation_cards.is_published = true
    )
  );

-- Admin full access (requires authenticated admin)
CREATE POLICY "Admin full access to conversation_cards"
  ON conversation_cards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admin full access to conversation_lines"
  ON conversation_lines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- COMMENTS for documentation
-- ============================================
COMMENT ON TABLE conversation_cards IS 'Interactive conversation flashcards for contextual Vietnamese learning';
COMMENT ON TABLE conversation_lines IS 'Individual dialogue lines within a conversation card';
COMMENT ON COLUMN conversation_cards.prompt_used IS 'The user prompt that was used to generate this conversation via AI';
COMMENT ON COLUMN conversation_lines.romanization IS 'Phonetic pronunciation guide for English speakers';
COMMENT ON COLUMN conversation_lines.audio_path IS 'Path to TTS audio file in Supabase storage';
