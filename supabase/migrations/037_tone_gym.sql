-- Tone Gym: Vietnamese tone discrimination training
-- Helps users learn to distinguish the 6 Vietnamese tones through listening exercises

-- =============================================================================
-- Tone Exercises Table
-- =============================================================================
-- Stores minimal pair sets where the same base syllable has different meanings
-- depending on the tone (e.g., ma/má/mà/mả/mã/mạ)

CREATE TABLE IF NOT EXISTS tone_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Base syllable without tone marks (e.g., "ma", "ba", "la")
  base_word TEXT NOT NULL,

  -- Array of tone variants with their meanings and audio
  -- Format: [{tone, word, meaning_en, meaning_vi?, audio_path?}, ...]
  -- Example: [{"tone": "sắc", "word": "má", "meaning_en": "cheek/mother", "audio_path": "tone-gym/ma-sac.mp3"}]
  tone_variants JSONB NOT NULL,

  -- Difficulty level: 1=easy pairs, 2=medium, 3=hard (includes hỏi/ngã distinction)
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),

  -- Whether this exercise is available for use
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for filtering by difficulty
CREATE INDEX idx_tone_exercises_difficulty ON tone_exercises(difficulty) WHERE is_active = true;

-- =============================================================================
-- User Progress Table
-- =============================================================================
-- Tracks per-user progress, accuracy per tone, and confusion patterns

CREATE TABLE IF NOT EXISTS tone_gym_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Overall statistics
  total_exercises INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,

  -- Per-tone accuracy tracking
  -- Format: {"sắc": {"correct": 50, "total": 60}, "huyền": {"correct": 45, "total": 50}, ...}
  tone_accuracy JSONB NOT NULL DEFAULT '{}',

  -- Per-pair confusion matrix for adaptive difficulty
  -- Format: {"sắc_huyền": {"correct": 30, "total": 35}, "hỏi_ngã": {"correct": 5, "total": 20}, ...}
  pair_accuracy JSONB NOT NULL DEFAULT '{}',

  -- Current difficulty level (auto-adjusted based on performance)
  current_difficulty INTEGER NOT NULL DEFAULT 1 CHECK (current_difficulty BETWEEN 1 AND 3),

  -- Timestamps
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One progress record per user
  UNIQUE(user_id)
);

-- Index for leaderboard/ranking queries
CREATE INDEX idx_tone_gym_progress_streak ON tone_gym_progress(best_streak DESC);
CREATE INDEX idx_tone_gym_progress_accuracy ON tone_gym_progress(
  (correct_answers::float / NULLIF(total_exercises, 0)) DESC
) WHERE total_exercises > 0;

-- =============================================================================
-- Update Triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION update_tone_gym_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tone_exercises_updated_at
  BEFORE UPDATE ON tone_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_tone_gym_updated_at();

CREATE TRIGGER tone_gym_progress_updated_at
  BEFORE UPDATE ON tone_gym_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_tone_gym_updated_at();

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE tone_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE tone_gym_progress ENABLE ROW LEVEL SECURITY;

-- Exercises are readable by everyone (public content)
CREATE POLICY "tone_exercises_read_all" ON tone_exercises
  FOR SELECT USING (true);

-- Only admins can modify exercises
CREATE POLICY "tone_exercises_admin_all" ON tone_exercises
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Users can read/write their own progress
CREATE POLICY "tone_gym_progress_own" ON tone_gym_progress
  FOR ALL USING (user_id = auth.uid());

-- =============================================================================
-- Seed Data: Core Minimal Pairs
-- =============================================================================
-- These are syllables where ALL 6 tones create real Vietnamese words

INSERT INTO tone_exercises (base_word, tone_variants, difficulty) VALUES
(
  'ma',
  '[
    {"tone": "ngang", "word": "ma", "meaning_en": "ghost"},
    {"tone": "sắc", "word": "má", "meaning_en": "cheek, mother (Southern)"},
    {"tone": "huyền", "word": "mà", "meaning_en": "but, that"},
    {"tone": "hỏi", "word": "mả", "meaning_en": "tomb, grave"},
    {"tone": "ngã", "word": "mã", "meaning_en": "horse, code"},
    {"tone": "nặng", "word": "mạ", "meaning_en": "rice seedling"}
  ]'::jsonb,
  1
),
(
  'ba',
  '[
    {"tone": "ngang", "word": "ba", "meaning_en": "three, father (Southern)"},
    {"tone": "sắc", "word": "bá", "meaning_en": "count (nobility), aunt"},
    {"tone": "huyền", "word": "bà", "meaning_en": "grandmother, lady"},
    {"tone": "hỏi", "word": "bả", "meaning_en": "poison, bait"},
    {"tone": "ngã", "word": "bã", "meaning_en": "residue, pulp"},
    {"tone": "nặng", "word": "bạ", "meaning_en": "random, haphazard"}
  ]'::jsonb,
  1
),
(
  'la',
  '[
    {"tone": "ngang", "word": "la", "meaning_en": "to shout, scold"},
    {"tone": "sắc", "word": "lá", "meaning_en": "leaf"},
    {"tone": "huyền", "word": "là", "meaning_en": "to be, is"},
    {"tone": "hỏi", "word": "lả", "meaning_en": "wilting, drooping"},
    {"tone": "ngã", "word": "lã", "meaning_en": "bland, tasteless"},
    {"tone": "nặng", "word": "lạ", "meaning_en": "strange, unfamiliar"}
  ]'::jsonb,
  1
),
(
  'ca',
  '[
    {"tone": "ngang", "word": "ca", "meaning_en": "to sing, song"},
    {"tone": "sắc", "word": "cá", "meaning_en": "fish"},
    {"tone": "huyền", "word": "cà", "meaning_en": "eggplant (cà tím)"},
    {"tone": "hỏi", "word": "cả", "meaning_en": "all, entire"},
    {"tone": "ngã", "word": "cã", "meaning_en": "(rare)"},
    {"tone": "nặng", "word": "cạ", "meaning_en": "to scrape, rub"}
  ]'::jsonb,
  1
),
(
  'ta',
  '[
    {"tone": "ngang", "word": "ta", "meaning_en": "we, I (informal)"},
    {"tone": "sắc", "word": "tá", "meaning_en": "dozen"},
    {"tone": "huyền", "word": "tà", "meaning_en": "evil, skirt flap"},
    {"tone": "hỏi", "word": "tả", "meaning_en": "to describe, left side"},
    {"tone": "ngã", "word": "tã", "meaning_en": "diaper"},
    {"tone": "nặng", "word": "tạ", "meaning_en": "100kg, to thank"}
  ]'::jsonb,
  1
),
(
  'da',
  '[
    {"tone": "ngang", "word": "da", "meaning_en": "skin, leather"},
    {"tone": "sắc", "word": "dá", "meaning_en": "(dialectal)"},
    {"tone": "huyền", "word": "dà", "meaning_en": "(exclamation)"},
    {"tone": "hỏi", "word": "dả", "meaning_en": "(rare)"},
    {"tone": "ngã", "word": "dã", "meaning_en": "wild (dã man = savage)"},
    {"tone": "nặng", "word": "dạ", "meaning_en": "yes (polite), stomach"}
  ]'::jsonb,
  2
),
(
  'cha',
  '[
    {"tone": "ngang", "word": "cha", "meaning_en": "father"},
    {"tone": "sắc", "word": "chá", "meaning_en": "(dialectal)"},
    {"tone": "huyền", "word": "chà", "meaning_en": "to scrub, wow!"},
    {"tone": "hỏi", "word": "chả", "meaning_en": "meat roll, not at all"},
    {"tone": "ngã", "word": "chã", "meaning_en": "(rare)"},
    {"tone": "nặng", "word": "chạ", "meaning_en": "mixed, promiscuous"}
  ]'::jsonb,
  2
),
(
  'co',
  '[
    {"tone": "ngang", "word": "co", "meaning_en": "to shrink, contract"},
    {"tone": "sắc", "word": "có", "meaning_en": "to have, there is"},
    {"tone": "huyền", "word": "cò", "meaning_en": "stork, heron"},
    {"tone": "hỏi", "word": "cỏ", "meaning_en": "grass"},
    {"tone": "ngã", "word": "cõ", "meaning_en": "(rare)"},
    {"tone": "nặng", "word": "cọ", "meaning_en": "to rub, palm tree"}
  ]'::jsonb,
  1
),
(
  'cho',
  '[
    {"tone": "ngang", "word": "cho", "meaning_en": "to give, for"},
    {"tone": "sắc", "word": "chó", "meaning_en": "dog"},
    {"tone": "huyền", "word": "chò", "meaning_en": "a type of tree"},
    {"tone": "hỏi", "word": "chỏ", "meaning_en": "elbow (variant)"},
    {"tone": "ngã", "word": "chõ", "meaning_en": "steamer pot"},
    {"tone": "nặng", "word": "chọ", "meaning_en": "(dialectal)"}
  ]'::jsonb,
  2
),
(
  'mo',
  '[
    {"tone": "ngang", "word": "mo", "meaning_en": "banana flower sheath"},
    {"tone": "sắc", "word": "mó", "meaning_en": "to touch, feel"},
    {"tone": "huyền", "word": "mò", "meaning_en": "to grope, search blindly"},
    {"tone": "hỏi", "word": "mỏ", "meaning_en": "beak, mine"},
    {"tone": "ngã", "word": "mõ", "meaning_en": "wooden bell"},
    {"tone": "nặng", "word": "mọ", "meaning_en": "(rare)"}
  ]'::jsonb,
  2
);

-- Add comment for documentation
COMMENT ON TABLE tone_exercises IS 'Vietnamese tone minimal pairs for discrimination training';
COMMENT ON TABLE tone_gym_progress IS 'User progress and accuracy tracking for Tone Gym';
