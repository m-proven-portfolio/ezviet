-- EZViet Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text,  -- emoji or icon name
  created_at timestamptz DEFAULT now()
);

-- Insert default categories
INSERT INTO categories (name, slug, description, icon) VALUES
  ('Fruits', 'fruits', 'Common fruits and their Vietnamese names', '🍎'),
  ('Animals', 'animals', 'Animals and creatures', '🐕'),
  ('Food', 'food', 'Vietnamese dishes and ingredients', '🍜'),
  ('Numbers', 'numbers', 'Counting in Vietnamese', '🔢'),
  ('Colors', 'colors', 'Colors and descriptive words', '🎨'),
  ('Family', 'family', 'Family members and relationships', '👨‍👩‍👧‍👦'),
  ('Greetings', 'greetings', 'Common greetings and phrases', '👋')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- CARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,           -- URL-friendly: "banana"
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_path text NOT NULL,            -- Supabase storage path
  difficulty int DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  view_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_cards_slug ON cards(slug);
CREATE INDEX IF NOT EXISTS idx_cards_category ON cards(category_id);
CREATE INDEX IF NOT EXISTS idx_cards_created ON cards(created_at DESC);

-- ============================================
-- CARD TERMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS card_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  lang text NOT NULL,                  -- 'vi', 'en'
  region text,                         -- 'south', 'north', null
  text text NOT NULL,                  -- "chuối" or "banana"
  romanization text,                   -- "/chwoy/"
  audio_path text,                     -- Supabase storage path
  created_at timestamptz DEFAULT now(),
  UNIQUE(card_id, lang, region)
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_card_terms_card ON card_terms(card_id);
CREATE INDEX IF NOT EXISTS idx_card_terms_lang_region ON card_terms(lang, region);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_terms ENABLE ROW LEVEL SECURITY;

-- Categories: Everyone can read
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- Cards: Everyone can read
CREATE POLICY "Cards are viewable by everyone"
  ON cards FOR SELECT
  USING (true);

-- Card Terms: Everyone can read
CREATE POLICY "Card terms are viewable by everyone"
  ON card_terms FOR SELECT
  USING (true);

-- Admin policies (insert/update/delete) will use service role key
-- which bypasses RLS entirely

-- ============================================
-- HELPER FUNCTION: Increment view count
-- ============================================
CREATE OR REPLACE FUNCTION increment_view_count(card_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE cards
  SET view_count = view_count + 1
  WHERE slug = card_slug;
END;
$$;

-- ============================================
-- STORAGE BUCKETS (run separately in Storage settings)
-- ============================================
-- Note: Create these buckets manually in Supabase Dashboard:
-- 1. cards-images (public)
-- 2. cards-audio (public)
