-- LRC Contributions System: Crowdsourced lyrics timing corrections
-- Migration: 019_lrc_contributions.sql

-- ============================================================================
-- TABLE: lrc_contributors
-- Tracks user statistics and trust scores for the LRC contribution system
-- ============================================================================
CREATE TABLE lrc_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Points & Leveling
  total_points INTEGER DEFAULT 0 NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,

  -- Trust System (0.00 to 1.00)
  -- New users start at 0, trust increases as submissions match consensus
  trust_score DECIMAL(3,2) DEFAULT 0.00 NOT NULL CHECK (trust_score >= 0 AND trust_score <= 1),

  -- Statistics
  songs_synced INTEGER DEFAULT 0 NOT NULL,
  lines_synced INTEGER DEFAULT 0 NOT NULL,
  accuracy_rate DECIMAL(5,2) DEFAULT 0.00 NOT NULL, -- percentage (0-100)
  best_streak INTEGER DEFAULT 0 NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Each user can only have one contributor record
  UNIQUE(user_id)
);

-- Index for leaderboard queries (sorted by points descending)
CREATE INDEX idx_lrc_contributors_points ON lrc_contributors(total_points DESC);
CREATE INDEX idx_lrc_contributors_user ON lrc_contributors(user_id);

-- ============================================================================
-- TABLE: lrc_submissions
-- Individual sync session submissions from users
-- ============================================================================
CREATE TABLE lrc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES card_songs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Timing data: array of {line_index, timestamp, text} objects
  -- Example: [{"line_index": 0, "timestamp": 12.34, "text": "Xin chào"}]
  timing_data JSONB NOT NULL,

  -- Scoring
  accuracy_score DECIMAL(5,2), -- calculated vs existing LRC (0-100)
  points_earned INTEGER DEFAULT 0 NOT NULL,
  lines_count INTEGER DEFAULT 0 NOT NULL,
  best_streak INTEGER DEFAULT 0 NOT NULL,

  -- Review workflow
  status TEXT DEFAULT 'pending' NOT NULL
    CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT, -- optional admin feedback

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX idx_lrc_submissions_song ON lrc_submissions(song_id);
CREATE INDEX idx_lrc_submissions_user ON lrc_submissions(user_id);
CREATE INDEX idx_lrc_submissions_status ON lrc_submissions(status);
CREATE INDEX idx_lrc_submissions_pending ON lrc_submissions(song_id, status) WHERE status = 'pending';

-- ============================================================================
-- TABLE: lrc_achievements
-- Badges and achievements earned by contributors
-- ============================================================================
CREATE TABLE lrc_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Achievement identifier (e.g., 'first_sync', 'songs_10', 'perfect_score', 'week_1')
  achievement_type TEXT NOT NULL,

  -- Optional metadata for the achievement (e.g., song_id for first sync)
  metadata JSONB,

  earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Each user can only earn each achievement once
  UNIQUE(user_id, achievement_type)
);

CREATE INDEX idx_lrc_achievements_user ON lrc_achievements(user_id);
CREATE INDEX idx_lrc_achievements_type ON lrc_achievements(achievement_type);

-- ============================================================================
-- TRIGGER: Auto-update updated_at on lrc_contributors
-- ============================================================================
CREATE OR REPLACE FUNCTION update_lrc_contributors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lrc_contributors_updated_at
  BEFORE UPDATE ON lrc_contributors
  FOR EACH ROW
  EXECUTE FUNCTION update_lrc_contributors_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE lrc_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lrc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lrc_achievements ENABLE ROW LEVEL SECURITY;

-- lrc_contributors: Users can read all (for leaderboards), but only update their own
CREATE POLICY "Anyone can view contributor stats"
  ON lrc_contributors FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own contributor record"
  ON lrc_contributors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contributor record"
  ON lrc_contributors FOR UPDATE
  USING (auth.uid() = user_id);

-- lrc_submissions: Users can view their own, admins can view all
CREATE POLICY "Users can view their own submissions"
  ON lrc_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions"
  ON lrc_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can create submissions"
  ON lrc_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update submissions"
  ON lrc_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- lrc_achievements: Users can view their own and others' (for profiles)
CREATE POLICY "Anyone can view achievements"
  ON lrc_achievements FOR SELECT
  USING (true);

CREATE POLICY "System can insert achievements"
  ON lrc_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS for documentation
-- ============================================================================
COMMENT ON TABLE lrc_contributors IS 'Tracks user statistics and trust scores for LRC timing contributions';
COMMENT ON TABLE lrc_submissions IS 'Individual sync session submissions with timing data and review status';
COMMENT ON TABLE lrc_achievements IS 'Badges and achievements earned through LRC contributions';

COMMENT ON COLUMN lrc_contributors.trust_score IS 'Trust level 0-1, higher = auto-approve submissions';
COMMENT ON COLUMN lrc_submissions.timing_data IS 'JSONB array of {line_index, timestamp, text} objects';
COMMENT ON COLUMN lrc_submissions.status IS 'Workflow: pending -> approved/rejected/merged';
