-- User Profiles & Learning Progress
-- Adds profiles table linked to Supabase Auth and learning history tracking

-- ============================================
-- USERNAME GENERATION FUNCTION
-- ============================================
-- Converts display name to URL-safe username
-- "John Smith" -> "johnsmith"
-- Reuses vietnamese_to_slug logic for consistency

CREATE OR REPLACE FUNCTION name_to_username(input_name text)
RETURNS text AS $$
DECLARE
  result text;
BEGIN
  result := input_name;

  -- Lowercase
  result := lower(result);

  -- Vietnamese diacritics to ASCII (in case name has Vietnamese chars)
  result := regexp_replace(result, '[àáạảãâầấậẩẫăằắặẳẵ]', 'a', 'g');
  result := regexp_replace(result, '[èéẹẻẽêềếệểễ]', 'e', 'g');
  result := regexp_replace(result, '[ìíịỉĩ]', 'i', 'g');
  result := regexp_replace(result, '[òóọỏõôồốộổỗơờớợởỡ]', 'o', 'g');
  result := regexp_replace(result, '[ùúụủũưừứựửữ]', 'u', 'g');
  result := regexp_replace(result, '[ỳýỵỷỹ]', 'y', 'g');
  result := regexp_replace(result, 'đ', 'd', 'g');

  -- Remove all non-alphanumeric chars (no hyphens in usernames)
  result := regexp_replace(result, '[^a-z0-9]', '', 'g');

  -- Limit length to 30 chars
  result := substring(result from 1 for 30);

  -- Default if empty
  IF result = '' OR result IS NULL THEN
    result := 'user';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  email text,
  avatar_url text,
  bio text,

  -- Onboarding
  onboarding_completed boolean DEFAULT false,
  learning_goal text CHECK (learning_goal IN ('travel', 'heritage', 'business', 'fun')),
  experience_level text CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),

  -- Stats (denormalized for fast reads)
  cards_viewed integer DEFAULT 0,
  cards_mastered integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_active_at timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- LEARNING HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS learning_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,

  -- Progress tracking
  times_viewed integer DEFAULT 1,
  mastery_level integer DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  last_viewed_at timestamptz DEFAULT now(),
  first_viewed_at timestamptz DEFAULT now(),

  UNIQUE(user_id, card_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_history_user ON learning_history(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_history_card ON learning_history(card_id);
CREATE INDEX IF NOT EXISTS idx_learning_history_last_viewed ON learning_history(last_viewed_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, own write
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Learning History: Own data only
CREATE POLICY "Users can view own learning history"
  ON learning_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning history"
  ON learning_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning history"
  ON learning_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username text;
  final_username text;
  counter int := 1;
  user_display_name text;
BEGIN
  -- Get display name from user metadata (Google provides this)
  user_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Generate base username
  base_username := name_to_username(user_display_name);
  final_username := base_username;

  -- Ensure uniqueness by appending number if needed
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;

  -- Create profile
  INSERT INTO profiles (id, username, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    user_display_name,
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- AUTO-UPDATE TIMESTAMP
-- ============================================
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- ============================================
-- HELPER: RECORD CARD VIEW
-- ============================================
-- Called when a logged-in user views a card
CREATE OR REPLACE FUNCTION record_card_view(p_user_id uuid, p_card_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert or update learning history
  INSERT INTO learning_history (user_id, card_id, times_viewed, last_viewed_at)
  VALUES (p_user_id, p_card_id, 1, now())
  ON CONFLICT (user_id, card_id)
  DO UPDATE SET
    times_viewed = learning_history.times_viewed + 1,
    last_viewed_at = now();

  -- Update profile stats
  UPDATE profiles
  SET
    cards_viewed = (
      SELECT COUNT(DISTINCT card_id) FROM learning_history WHERE user_id = p_user_id
    ),
    last_active_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
