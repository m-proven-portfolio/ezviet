-- Update learning_goal constraint to new values
-- Old: travel, heritage, business, fun
-- New: daily_life, social, transport, living, exploring

-- Drop the old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_learning_goal_check;

-- Clear old values that would violate new constraint
UPDATE profiles SET learning_goal = NULL
WHERE learning_goal NOT IN ('daily_life', 'social', 'transport', 'living', 'exploring');

-- Add the new constraint with updated values (allow NULL)
ALTER TABLE profiles ADD CONSTRAINT profiles_learning_goal_check
  CHECK (learning_goal IS NULL OR learning_goal IN ('daily_life', 'social', 'transport', 'living', 'exploring'));
