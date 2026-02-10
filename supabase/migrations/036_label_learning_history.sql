-- Label Learning History
-- Tracks per-item quiz performance for spaced repetition and adaptive difficulty
--
-- Features:
-- 1. Per-label learning metrics (attempts, correct count, streaks)
-- 2. SM-2 spaced repetition fields (ease factor, interval, next review)
-- 3. Adaptive difficulty tracking (per-label matching mode override)
-- 4. RPC function to record individual quiz answers

-- ============================================
-- TABLE: label_learning_history
-- ============================================

CREATE TABLE label_learning_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  label_set_id UUID NOT NULL REFERENCES label_sets(id) ON DELETE CASCADE,

  -- Core learning metrics
  attempts INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,            -- Current consecutive correct
  best_streak INTEGER DEFAULT 0,

  -- Latest answer details
  last_match_type VARCHAR(30),         -- exact/diacritic_insensitive/fuzzy/none
  last_score INTEGER,                  -- 0-100
  last_time_ms INTEGER,                -- Time taken in milliseconds
  last_hints_used TEXT[],              -- ['audio', 'first_letters', 'no_tones']

  -- SM-2 Spaced Repetition fields
  ease_factor NUMERIC(4,2) DEFAULT 2.50,  -- SM-2 ease (1.3-2.5+)
  interval_days INTEGER DEFAULT 0,        -- Current interval in days
  next_review_at TIMESTAMPTZ,             -- When to review next
  repetition_count INTEGER DEFAULT 0,     -- Times successfully reviewed

  -- Adaptive difficulty
  current_matching_mode VARCHAR(30),      -- Override: exact/diacritic_insensitive/fuzzy

  -- Timestamps
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Each user can only have one history entry per label
  UNIQUE(user_id, label_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_llh_user ON label_learning_history(user_id);
CREATE INDEX idx_llh_label_set ON label_learning_history(label_set_id);
CREATE INDEX idx_llh_next_review ON label_learning_history(user_id, next_review_at)
  WHERE next_review_at IS NOT NULL;
CREATE INDEX idx_llh_due_reviews ON label_learning_history(user_id, label_set_id, next_review_at)
  WHERE next_review_at IS NOT NULL;

-- Comments
COMMENT ON TABLE label_learning_history IS
  'Tracks per-label learning progress for spaced repetition and adaptive difficulty';
COMMENT ON COLUMN label_learning_history.ease_factor IS
  'SM-2 ease factor: starts at 2.5, decreases with failures, increases with successes';
COMMENT ON COLUMN label_learning_history.interval_days IS
  'Current review interval in days (SM-2 algorithm)';
COMMENT ON COLUMN label_learning_history.next_review_at IS
  'When this label is due for review (null = not yet scheduled)';
COMMENT ON COLUMN label_learning_history.current_matching_mode IS
  'Adaptive difficulty override for this specific label';

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE label_learning_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own learning history"
  ON label_learning_history FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all learning history"
  ON label_learning_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================
-- RPC: record_label_answers
-- Records individual quiz answers with SM-2 calculation
-- ============================================

CREATE OR REPLACE FUNCTION record_label_answers(
  p_user_id UUID,
  p_label_set_id UUID,
  p_answers JSONB  -- Array of {labelId, isCorrect, matchType, score, timeSpent, hintsUsed}
)
RETURNS JSONB AS $$
DECLARE
  v_answer JSONB;
  v_label_id UUID;
  v_is_correct BOOLEAN;
  v_match_type TEXT;
  v_score INTEGER;
  v_time_ms INTEGER;
  v_hints TEXT[];
  v_quality INTEGER;  -- SM-2 quality rating 0-5
  v_count INTEGER := 0;
BEGIN
  FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    v_label_id := (v_answer->>'labelId')::UUID;
    v_is_correct := (v_answer->>'isCorrect')::BOOLEAN;
    v_match_type := v_answer->>'matchType';
    v_score := COALESCE((v_answer->>'score')::INTEGER, 0);
    v_time_ms := COALESCE((v_answer->>'timeSpent')::INTEGER, 0);
    v_hints := ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_answer->'hintsUsed', '[]'::JSONB)));

    -- Convert to SM-2 quality (0-5)
    -- 5 = perfect exact match, no hints
    -- 4 = exact match with hints or diacritic_insensitive
    -- 3 = fuzzy match
    -- 2 = incorrect but close (attempted)
    -- 1 = incorrect
    -- 0 = complete failure / skipped
    v_quality := CASE
      WHEN v_match_type = 'exact' AND array_length(v_hints, 1) IS NULL THEN 5
      WHEN v_match_type = 'exact' THEN 4
      WHEN v_match_type = 'diacritic_insensitive' THEN 4
      WHEN v_match_type = 'fuzzy' THEN 3
      WHEN NOT v_is_correct AND v_score > 0 THEN 2
      WHEN NOT v_is_correct THEN 1
      ELSE 0
    END;

    -- Upsert learning history with SM-2 calculation
    INSERT INTO label_learning_history (
      user_id, label_id, label_set_id,
      attempts, correct_count, streak, best_streak,
      last_match_type, last_score, last_time_ms, last_hints_used,
      ease_factor, interval_days, next_review_at, repetition_count,
      last_reviewed_at, first_seen_at
    )
    VALUES (
      p_user_id, v_label_id, p_label_set_id,
      1,
      CASE WHEN v_is_correct THEN 1 ELSE 0 END,
      CASE WHEN v_is_correct THEN 1 ELSE 0 END,
      CASE WHEN v_is_correct THEN 1 ELSE 0 END,
      v_match_type, v_score, v_time_ms, v_hints,
      2.50,  -- Initial ease factor
      CASE WHEN v_quality >= 3 THEN 1 ELSE 0 END,  -- 1 day if correct, 0 if wrong
      CASE WHEN v_quality >= 3 THEN now() + interval '1 day' ELSE now() END,
      CASE WHEN v_quality >= 3 THEN 1 ELSE 0 END,
      now(),
      now()
    )
    ON CONFLICT (user_id, label_id) DO UPDATE SET
      attempts = label_learning_history.attempts + 1,
      correct_count = label_learning_history.correct_count + CASE WHEN v_is_correct THEN 1 ELSE 0 END,
      streak = CASE WHEN v_is_correct THEN label_learning_history.streak + 1 ELSE 0 END,
      best_streak = GREATEST(
        label_learning_history.best_streak,
        CASE WHEN v_is_correct THEN label_learning_history.streak + 1 ELSE 0 END
      ),
      last_match_type = v_match_type,
      last_score = v_score,
      last_time_ms = v_time_ms,
      last_hints_used = v_hints,
      -- SM-2 algorithm for ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
      ease_factor = GREATEST(1.3, label_learning_history.ease_factor + (0.1 - (5 - v_quality) * (0.08 + (5 - v_quality) * 0.02))),
      -- SM-2 interval calculation
      interval_days = CASE
        WHEN v_quality < 3 THEN 1  -- Reset on failure
        WHEN label_learning_history.repetition_count = 0 THEN 1
        WHEN label_learning_history.repetition_count = 1 THEN 6
        ELSE ROUND(label_learning_history.interval_days * label_learning_history.ease_factor)::INTEGER
      END,
      -- Calculate next review date
      next_review_at = CASE
        WHEN v_quality < 3 THEN now()  -- Review immediately on failure
        WHEN label_learning_history.repetition_count = 0 THEN now() + interval '1 day'
        WHEN label_learning_history.repetition_count = 1 THEN now() + interval '6 days'
        ELSE now() + (ROUND(label_learning_history.interval_days * label_learning_history.ease_factor)::INTEGER || ' days')::interval
      END,
      repetition_count = CASE
        WHEN v_quality < 3 THEN 0  -- Reset on failure
        ELSE label_learning_history.repetition_count + 1
      END,
      last_reviewed_at = now(),
      updated_at = now();

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'answers_recorded', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_label_answers IS
  'Records individual quiz answers with SM-2 spaced repetition calculation';
