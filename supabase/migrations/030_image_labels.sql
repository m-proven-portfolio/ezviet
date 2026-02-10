-- Interactive Image Labeling Feature
-- Standalone label sets with public URLs at /label/[slug]
-- Supports Explore mode (click to learn) and Quiz mode (type answer)

-- ============================================
-- LABEL_SETS TABLE
-- ============================================
-- The container for a labeled image (like a flashcard category)

CREATE TABLE label_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(255) UNIQUE NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  instructions text,
  image_url text NOT NULL,
  difficulty varchar(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_published boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_label_sets_slug ON label_sets(slug);
CREATE INDEX idx_label_sets_category ON label_sets(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_label_sets_published ON label_sets(is_published) WHERE is_published = true;
CREATE INDEX idx_label_sets_created_by ON label_sets(created_by) WHERE created_by IS NOT NULL;

-- ============================================
-- LABELS TABLE
-- ============================================
-- Individual vocabulary markers on an image

CREATE TABLE labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label_set_id uuid NOT NULL REFERENCES label_sets(id) ON DELETE CASCADE,
  x numeric(5,2) NOT NULL CHECK (x >= 0 AND x <= 100),
  y numeric(5,2) NOT NULL CHECK (y >= 0 AND y <= 100),
  vietnamese varchar(255) NOT NULL,
  english varchar(255) NOT NULL,
  pronunciation varchar(255),
  audio_url text,
  hints text[],
  card_id uuid REFERENCES cards(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_labels_label_set_id ON labels(label_set_id);
CREATE INDEX idx_labels_card_id ON labels(card_id) WHERE card_id IS NOT NULL;
CREATE INDEX idx_labels_sort_order ON labels(label_set_id, sort_order);

-- ============================================
-- LABEL_SET_PROGRESS TABLE
-- ============================================
-- Tracks user progress per label set (similar to learning_history)

CREATE TABLE label_set_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label_set_id uuid NOT NULL REFERENCES label_sets(id) ON DELETE CASCADE,
  labels_explored integer DEFAULT 0,
  labels_correct integer DEFAULT 0,
  labels_attempted integer DEFAULT 0,
  best_score integer DEFAULT 0,
  best_time_seconds integer,
  attempts integer DEFAULT 0,
  first_attempted_at timestamptz,
  last_attempted_at timestamptz,
  completed_at timestamptz,

  UNIQUE(user_id, label_set_id)
);

-- Indexes
CREATE INDEX idx_label_progress_user ON label_set_progress(user_id);
CREATE INDEX idx_label_progress_set ON label_set_progress(label_set_id);
CREATE INDEX idx_label_progress_completed ON label_set_progress(completed_at) WHERE completed_at IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE label_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_set_progress ENABLE ROW LEVEL SECURITY;

-- LABEL_SETS POLICIES

-- Anyone can view published label sets
CREATE POLICY "Anyone can view published label sets"
  ON label_sets
  FOR SELECT
  USING (is_published = true);

-- Admins can manage all label sets
CREATE POLICY "Admins can manage all label sets"
  ON label_sets
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Creators can manage their own label sets
CREATE POLICY "Creators can manage own label sets"
  ON label_sets
  FOR ALL
  USING (created_by = auth.uid());

-- LABELS POLICIES

-- Anyone can view labels of published sets
CREATE POLICY "Anyone can view labels of published sets"
  ON labels
  FOR SELECT
  USING (
    label_set_id IN (SELECT id FROM label_sets WHERE is_published = true)
  );

-- Admins can manage all labels
CREATE POLICY "Admins can manage all labels"
  ON labels
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Creators can manage labels in their own sets
CREATE POLICY "Creators can manage labels in own sets"
  ON labels
  FOR ALL
  USING (
    label_set_id IN (SELECT id FROM label_sets WHERE created_by = auth.uid())
  );

-- PROGRESS POLICIES

-- Users can manage their own progress
CREATE POLICY "Users can manage own progress"
  ON label_set_progress
  FOR ALL
  USING (user_id = auth.uid());

-- Admins can view all progress (for analytics)
CREATE POLICY "Admins can view all progress"
  ON label_set_progress
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Increment view count (called from API)
CREATE OR REPLACE FUNCTION increment_label_set_view(p_slug text)
RETURNS void AS $$
BEGIN
  UPDATE label_sets
  SET view_count = view_count + 1
  WHERE slug = p_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record quiz attempt and return stats
CREATE OR REPLACE FUNCTION record_label_quiz_attempt(
  p_user_id uuid,
  p_label_set_id uuid,
  p_correct integer,
  p_total integer,
  p_time_seconds integer
)
RETURNS jsonb AS $$
DECLARE
  v_score integer;
  v_best_score integer;
  v_best_time integer;
  v_is_new_best boolean;
  v_attempts integer;
BEGIN
  -- Calculate score as percentage
  v_score := ROUND((p_correct::numeric / NULLIF(p_total, 0)) * 100);

  -- Insert or update progress
  INSERT INTO label_set_progress (
    user_id,
    label_set_id,
    labels_correct,
    labels_attempted,
    best_score,
    best_time_seconds,
    attempts,
    first_attempted_at,
    last_attempted_at,
    completed_at
  )
  VALUES (
    p_user_id,
    p_label_set_id,
    p_correct,
    p_total,
    v_score,
    p_time_seconds,
    1,
    now(),
    now(),
    CASE WHEN v_score >= 80 THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id, label_set_id)
  DO UPDATE SET
    labels_correct = label_set_progress.labels_correct + p_correct,
    labels_attempted = label_set_progress.labels_attempted + p_total,
    best_score = GREATEST(label_set_progress.best_score, v_score),
    best_time_seconds = CASE
      WHEN label_set_progress.best_time_seconds IS NULL THEN p_time_seconds
      WHEN v_score > label_set_progress.best_score THEN p_time_seconds
      WHEN v_score = label_set_progress.best_score THEN LEAST(label_set_progress.best_time_seconds, p_time_seconds)
      ELSE label_set_progress.best_time_seconds
    END,
    attempts = label_set_progress.attempts + 1,
    last_attempted_at = now(),
    completed_at = CASE
      WHEN v_score >= 80 THEN COALESCE(label_set_progress.completed_at, now())
      ELSE label_set_progress.completed_at
    END
  RETURNING best_score, best_time_seconds, attempts INTO v_best_score, v_best_time, v_attempts;

  -- Determine if this is a new best score
  v_is_new_best := (v_score >= v_best_score);

  RETURN jsonb_build_object(
    'score', v_score,
    'best_score', v_best_score,
    'best_time', v_best_time,
    'is_new_best', v_is_new_best,
    'attempts', v_attempts
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update exploration progress
CREATE OR REPLACE FUNCTION update_label_exploration(
  p_user_id uuid,
  p_label_set_id uuid,
  p_labels_explored integer
)
RETURNS void AS $$
BEGIN
  INSERT INTO label_set_progress (
    user_id,
    label_set_id,
    labels_explored,
    first_attempted_at
  )
  VALUES (
    p_user_id,
    p_label_set_id,
    p_labels_explored,
    now()
  )
  ON CONFLICT (user_id, label_set_id)
  DO UPDATE SET
    labels_explored = GREATEST(label_set_progress.labels_explored, p_labels_explored);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER FOR updated_at
-- ============================================
-- Reuse existing trigger function if available, otherwise create

CREATE OR REPLACE FUNCTION update_label_sets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER label_sets_updated_at_trigger
  BEFORE UPDATE ON label_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_label_sets_updated_at();
