-- Community LRC Editing System: Moderators, Voting, and Advanced Editing
-- Migration: 020_lrc_community_editing.sql
-- Extends the LRC contribution system with community editing features

-- ============================================================================
-- COLUMN: Add moderator flag to profiles
-- Moderators can review and approve LRC submissions (granted by admins)
-- ============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_moderator BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_moderator
  ON profiles(is_moderator) WHERE is_moderator = true;

COMMENT ON COLUMN profiles.is_moderator IS 'User can review and approve LRC submissions (granted by admins)';

-- ============================================================================
-- COLUMNS: Extend lrc_submissions with edit-specific fields
-- ============================================================================
ALTER TABLE lrc_submissions
  ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'sync'
    CHECK (submission_type IN ('sync', 'edit', 'full_replace'));

ALTER TABLE lrc_submissions
  ADD COLUMN IF NOT EXISTS lines_changed INTEGER DEFAULT 0;

ALTER TABLE lrc_submissions
  ADD COLUMN IF NOT EXISTS impact_score INTEGER DEFAULT 0;

ALTER TABLE lrc_submissions
  ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT false;

-- Index for finding edit submissions
CREATE INDEX IF NOT EXISTS idx_lrc_submissions_type
  ON lrc_submissions(submission_type);

COMMENT ON COLUMN lrc_submissions.submission_type IS 'sync = tap-based timing, edit = direct line editing, full_replace = complete LRC replacement';
COMMENT ON COLUMN lrc_submissions.lines_changed IS 'Number of lines modified in this submission';
COMMENT ON COLUMN lrc_submissions.impact_score IS 'Calculated priority score for review queue';
COMMENT ON COLUMN lrc_submissions.auto_approved IS 'True if auto-approved based on trust score and change size';

-- ============================================================================
-- TABLE: lrc_edits
-- Tracks individual line edits with diffs for granular review
-- ============================================================================
CREATE TABLE lrc_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES card_songs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES lrc_submissions(id) ON DELETE CASCADE,

  -- Edit classification
  edit_type TEXT NOT NULL CHECK (edit_type IN ('timing', 'text', 'add_line', 'remove_line')),

  -- What changed
  line_index INTEGER NOT NULL,
  original_timestamp DECIMAL(10,3), -- null for add_line
  new_timestamp DECIMAL(10,3),      -- null for remove_line
  original_text TEXT,               -- null for add_line
  new_text TEXT,                    -- null for remove_line

  -- Context for review (adjacent lines for reference)
  context_before JSONB, -- {timestamp, text} of previous line
  context_after JSONB,  -- {timestamp, text} of next line

  -- Metrics
  delta_magnitude DECIMAL(5,3), -- abs(new - original) for timing edits

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_lrc_edits_song ON lrc_edits(song_id);
CREATE INDEX idx_lrc_edits_user ON lrc_edits(user_id);
CREATE INDEX idx_lrc_edits_submission ON lrc_edits(submission_id);
CREATE INDEX idx_lrc_edits_line ON lrc_edits(song_id, line_index);

COMMENT ON TABLE lrc_edits IS 'Individual line-level edits with before/after values for granular review';
COMMENT ON COLUMN lrc_edits.delta_magnitude IS 'Absolute difference in seconds between original and new timestamp';

-- ============================================================================
-- TABLE: lrc_votes
-- Community feedback after karaoke sessions
-- ============================================================================
CREATE TABLE lrc_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES card_songs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Vote type
  vote_type TEXT NOT NULL CHECK (vote_type IN ('accurate', 'inaccurate', 'edit')),

  -- Optional: link to suggested edit if vote_type = 'edit'
  edit_submission_id UUID REFERENCES lrc_submissions(id) ON DELETE SET NULL,

  -- Context: what was the user's accuracy when they voted?
  accuracy_score_at_vote DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Vote date for daily uniqueness (stored as date for immutable indexing)
  vote_date DATE DEFAULT CURRENT_DATE NOT NULL,

  -- Each user can only vote once per song per day
  UNIQUE(user_id, song_id, vote_date)
);

CREATE INDEX idx_lrc_votes_song ON lrc_votes(song_id);
CREATE INDEX idx_lrc_votes_user ON lrc_votes(user_id);
CREATE INDEX idx_lrc_votes_type ON lrc_votes(song_id, vote_type);
CREATE INDEX idx_lrc_votes_recent ON lrc_votes(song_id, created_at DESC);

COMMENT ON TABLE lrc_votes IS 'Community feedback on LRC timing accuracy after karaoke sessions';
COMMENT ON COLUMN lrc_votes.vote_type IS 'accurate = good timing, inaccurate = needs work, edit = user wants to fix it';

-- ============================================================================
-- TABLE: lrc_review_queue
-- Prioritized queue for moderator review
-- ============================================================================
CREATE TABLE lrc_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES lrc_submissions(id) ON DELETE CASCADE,

  -- Priority scoring (higher = review sooner)
  priority_score INTEGER DEFAULT 0 NOT NULL,

  -- Factors contributing to priority
  vote_count INTEGER DEFAULT 0 NOT NULL,
  negative_vote_ratio DECIMAL(3,2) DEFAULT 0 NOT NULL,
  submitter_trust_score DECIMAL(3,2) DEFAULT 0 NOT NULL,
  lines_changed INTEGER DEFAULT 0 NOT NULL,

  -- Assignment
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,

  -- Status in queue
  queue_status TEXT DEFAULT 'pending' NOT NULL
    CHECK (queue_status IN ('pending', 'assigned', 'in_review', 'escalated', 'completed')),

  -- Escalation tracking
  escalated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  escalation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- One queue item per submission
  UNIQUE(submission_id)
);

CREATE INDEX idx_review_queue_priority ON lrc_review_queue(priority_score DESC) WHERE queue_status = 'pending';
CREATE INDEX idx_review_queue_assigned ON lrc_review_queue(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_review_queue_status ON lrc_review_queue(queue_status);

COMMENT ON TABLE lrc_review_queue IS 'Prioritized review queue for moderators';
COMMENT ON COLUMN lrc_review_queue.priority_score IS 'Higher score = more urgent review needed';

-- ============================================================================
-- TABLE: lrc_version_history
-- Track all LRC changes for rollback capability
-- ============================================================================
CREATE TABLE lrc_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES card_songs(id) ON DELETE CASCADE,

  -- Full LRC content at this version
  lyrics_lrc TEXT NOT NULL,

  -- What caused this version
  change_type TEXT NOT NULL CHECK (change_type IN ('initial', 'merge', 'rollback', 'admin_edit')),
  submission_id UUID REFERENCES lrc_submissions(id) ON DELETE SET NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),

  -- Version number per song (for easy navigation)
  version_number INTEGER NOT NULL,

  -- Human-readable summary
  change_summary TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(song_id, version_number)
);

CREATE INDEX idx_version_history_song ON lrc_version_history(song_id, version_number DESC);

COMMENT ON TABLE lrc_version_history IS 'Version history for LRC content with rollback support';

-- ============================================================================
-- TRIGGER: Auto-update updated_at on lrc_review_queue
-- ============================================================================
CREATE OR REPLACE FUNCTION update_lrc_review_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lrc_review_queue_updated_at
  BEFORE UPDATE ON lrc_review_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_lrc_review_queue_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE lrc_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE lrc_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lrc_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE lrc_version_history ENABLE ROW LEVEL SECURITY;

-- lrc_edits: Anyone can view (for transparency), users create own
CREATE POLICY "Anyone can view edits"
  ON lrc_edits FOR SELECT
  USING (true);

CREATE POLICY "Users can create edits"
  ON lrc_edits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- lrc_votes: Anyone can view, users create own
CREATE POLICY "Anyone can view votes"
  ON lrc_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote"
  ON lrc_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- lrc_review_queue: Only admins and moderators can access
CREATE POLICY "Moderators can view review queue"
  ON lrc_review_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.is_moderator = true)
    )
  );

CREATE POLICY "Moderators can update review queue"
  ON lrc_review_queue FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.is_moderator = true)
    )
  );

CREATE POLICY "System can insert into review queue"
  ON lrc_review_queue FOR INSERT
  WITH CHECK (true); -- Inserts happen via service role

-- lrc_version_history: Anyone can view (transparency), system inserts
CREATE POLICY "Anyone can view version history"
  ON lrc_version_history FOR SELECT
  USING (true);

CREATE POLICY "System can insert version history"
  ON lrc_version_history FOR INSERT
  WITH CHECK (true); -- Inserts happen via service role

-- ============================================================================
-- UPDATE: Allow moderators to view and update submissions
-- ============================================================================
CREATE POLICY "Moderators can view all submissions"
  ON lrc_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_moderator = true
    )
  );

CREATE POLICY "Moderators can update submissions"
  ON lrc_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_moderator = true
    )
  );
