-- Card Queue Feature
-- Allows professors to define target cards per category
-- and track contributor progress with auto-matching

-- ============================================
-- ADD TARGET_COUNT TO CATEGORIES
-- ============================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS target_count int DEFAULT NULL;

-- ============================================
-- CARD QUEUE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS card_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,

  -- Card details to create
  vietnamese text NOT NULL,
  english text NOT NULL,
  notes text,  -- Optional notes for the creator

  -- Status tracking
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  card_id uuid REFERENCES cards(id) ON DELETE SET NULL,  -- Links when completed

  -- Audit
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_card_queue_category ON card_queue(category_id);
CREATE INDEX IF NOT EXISTS idx_card_queue_status ON card_queue(status);
CREATE INDEX IF NOT EXISTS idx_card_queue_vietnamese ON card_queue(category_id, vietnamese);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE card_queue ENABLE ROW LEVEL SECURITY;

-- Everyone can read queue items (for progress visibility)
CREATE POLICY "Card queue is viewable by everyone"
  ON card_queue FOR SELECT
  USING (true);

-- Admin operations use service role key (bypasses RLS)
