-- Add display option to cards table
-- Controls whether Northern Vietnamese is shown on the public card view

ALTER TABLE cards
ADD COLUMN IF NOT EXISTS show_north boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN cards.show_north IS 'Whether to display Northern Vietnamese section on the card';
