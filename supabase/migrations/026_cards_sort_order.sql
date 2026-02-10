-- Add sort_order to cards table for admin-controlled ordering within categories
-- This enables "blocked practice" - showing cards in logical order within each category

-- Add the sort_order column (default 0 for existing cards)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create compound index for efficient category-based sorted queries
CREATE INDEX IF NOT EXISTS idx_cards_category_sort ON cards(category_id, sort_order);

-- Backfill existing cards with sort_order based on created_at within each category
-- This preserves the chronological order as the initial sort order
WITH ranked_cards AS (
  SELECT
    id,
    category_id,
    ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) - 1 as new_order
  FROM cards
)
UPDATE cards
SET sort_order = ranked_cards.new_order
FROM ranked_cards
WHERE cards.id = ranked_cards.id;
