-- Add the learning_goal constraint (011 migration partially failed)
-- This just adds the constraint since values were already cleared

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_learning_goal_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_learning_goal_check
  CHECK (learning_goal IS NULL OR learning_goal IN ('daily_life', 'social', 'transport', 'living', 'exploring'));
