-- =============================================================================
-- EZVIET Book Engine - Database Schema
-- Migration: 015_books.sql
-- =============================================================================

-- Book Series (optional grouping)
CREATE TABLE IF NOT EXISTS book_series (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_path TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books
CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT NOT NULL DEFAULT 'EZViet Team',
  description TEXT,

  -- Language configuration (stored as codes: 'en', 'vi', 'fr', etc.)
  base_lang TEXT NOT NULL DEFAULT 'en',
  target_lang TEXT NOT NULL DEFAULT 'vi',
  target_region TEXT, -- 'north', 'south', 'central' for Vietnamese

  -- Difficulty (CEFR levels)
  level TEXT NOT NULL DEFAULT 'A1' CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),

  -- Series (optional)
  series_id UUID REFERENCES book_series(id) ON DELETE SET NULL,
  series_order INTEGER,

  -- Print configuration
  trim_size TEXT NOT NULL DEFAULT 'kdp-6x9',
  template_id TEXT NOT NULL DEFAULT 'ezviet',

  -- Publishing
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  isbn TEXT,
  published_at TIMESTAMPTZ,
  version TEXT DEFAULT '1.0.0',

  -- Cover
  cover_image_path TEXT,

  -- Front/back matter stored as JSONB
  front_matter JSONB DEFAULT '{"titlePage": true, "tableOfContents": true}'::jsonb,
  back_matter JSONB DEFAULT '{}'::jsonb,

  -- Ownership
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters
CREATE TABLE IF NOT EXISTS book_chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,

  -- Chapter metadata
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,

  -- Learning objectives
  objectives TEXT[], -- Array of strings

  -- Content stored as JSONB array of sections
  -- Each section: { id, title?, blocks: Block[] }
  content JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Summary blocks at end of chapter
  summary JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique chapter numbers per book
  UNIQUE(book_id, number)
);

-- Index for fast chapter lookups
CREATE INDEX idx_book_chapters_book_id ON book_chapters(book_id);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_series_id ON books(series_id);
CREATE INDEX idx_books_slug ON books(slug);

-- Vocabulary references (track which cards are used in which books)
-- This helps with: "show me all books that teach this word"
CREATE TABLE IF NOT EXISTS book_vocabulary_refs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES book_chapters(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  block_id TEXT, -- Reference to the block ID within the chapter content

  -- For vocabulary not linked to cards, store inline
  target_text TEXT,
  base_text TEXT,

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate refs
  UNIQUE(book_id, chapter_id, card_id)
);

CREATE INDEX idx_book_vocab_refs_book_id ON book_vocabulary_refs(book_id);
CREATE INDEX idx_book_vocab_refs_card_id ON book_vocabulary_refs(card_id);

-- Book assets (images uploaded for books)
CREATE TABLE IF NOT EXISTS book_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image', 'audio'
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  dpi INTEGER, -- For print quality validation
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_book_assets_book_id ON book_assets(book_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_chapters_updated_at
  BEFORE UPDATE ON book_chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_series_updated_at
  BEFORE UPDATE ON book_series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_vocabulary_refs ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_assets ENABLE ROW LEVEL SECURITY;

-- Public can read published books
CREATE POLICY "Published books are viewable by everyone"
  ON books FOR SELECT
  USING (status = 'published');

-- Admins can do everything
CREATE POLICY "Admins can manage all books"
  ON books FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Public can view published book chapters"
  ON book_chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_chapters.book_id
      AND books.status = 'published'
    )
  );

CREATE POLICY "Admins can manage all chapters"
  ON book_chapters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Similar policies for other tables
CREATE POLICY "Public can view book series"
  ON book_series FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage book series"
  ON book_series FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Public can view vocab refs for published books"
  ON book_vocabulary_refs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_vocabulary_refs.book_id
      AND books.status = 'published'
    )
  );

CREATE POLICY "Admins can manage vocab refs"
  ON book_vocabulary_refs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Public can view assets for published books"
  ON book_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_assets.book_id
      AND books.status = 'published'
    )
  );

CREATE POLICY "Admins can manage assets"
  ON book_assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create storage bucket for book assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-assets', 'book-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for book assets
CREATE POLICY "Book assets are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-assets');

CREATE POLICY "Admins can upload book assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'book-assets'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete book assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'book-assets'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
