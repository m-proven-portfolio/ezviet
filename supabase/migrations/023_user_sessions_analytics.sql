-- User Sessions & Analytics
-- Tracks user sessions for engagement metrics and cohort analysis

-- ============================================
-- USER SESSIONS TABLE
-- ============================================
-- Tracks individual user sessions for analytics
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Session timing
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),

  -- Session metrics
  cards_viewed integer DEFAULT 0,
  pages_visited integer DEFAULT 0,

  -- Context
  user_agent text,
  device_type text CHECK (device_type IN ('mobile', 'tablet', 'desktop')),

  created_at timestamptz DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started ON user_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_started ON user_sessions(user_id, started_at DESC);

-- ============================================
-- ADD LOGIN COUNT TO PROFILES
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_sessions integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_seen_at timestamptz;

-- Backfill first_seen_at with created_at for existing users
UPDATE profiles SET first_seen_at = created_at WHERE first_seen_at IS NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin can view all sessions (for analytics)
CREATE POLICY "Admins can view all sessions"
  ON user_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- SESSION MANAGEMENT FUNCTIONS
-- ============================================

-- Start a new session (called on page load if no active session)
CREATE OR REPLACE FUNCTION start_user_session(
  p_user_id uuid,
  p_user_agent text DEFAULT NULL,
  p_device_type text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  new_session_id uuid;
BEGIN
  -- End any stale sessions (no activity in last 30 min)
  UPDATE user_sessions
  SET ended_at = last_activity_at
  WHERE user_id = p_user_id
    AND ended_at IS NULL
    AND last_activity_at < now() - interval '30 minutes';

  -- Create new session
  INSERT INTO user_sessions (user_id, user_agent, device_type)
  VALUES (p_user_id, p_user_agent, p_device_type)
  RETURNING id INTO new_session_id;

  -- Update profile session count
  UPDATE profiles
  SET
    total_sessions = total_sessions + 1,
    last_active_at = now()
  WHERE id = p_user_id;

  RETURN new_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update session activity (heartbeat)
CREATE OR REPLACE FUNCTION update_session_activity(
  p_session_id uuid,
  p_cards_viewed integer DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE user_sessions
  SET
    last_activity_at = now(),
    pages_visited = pages_visited + 1,
    cards_viewed = COALESCE(p_cards_viewed, cards_viewed)
  WHERE id = p_session_id
    AND ended_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- End session explicitly
CREATE OR REPLACE FUNCTION end_user_session(p_session_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE user_sessions
  SET ended_at = now()
  WHERE id = p_session_id
    AND ended_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ANALYTICS HELPER FUNCTIONS
-- ============================================

-- Get user retention cohorts
-- Returns users grouped by signup week and their retention
CREATE OR REPLACE FUNCTION get_retention_cohorts(
  p_weeks_back integer DEFAULT 12
)
RETURNS TABLE (
  cohort_week date,
  total_users bigint,
  retained_week_1 bigint,
  retained_week_2 bigint,
  retained_week_3 bigint,
  retained_week_4 bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH cohorts AS (
    SELECT
      date_trunc('week', created_at)::date as signup_week,
      id as user_id
    FROM profiles
    WHERE created_at >= now() - (p_weeks_back || ' weeks')::interval
  ),
  activity AS (
    SELECT DISTINCT
      user_id,
      date_trunc('week', last_activity_at)::date as active_week
    FROM profiles
    WHERE last_active_at IS NOT NULL

    UNION

    SELECT DISTINCT
      user_id,
      date_trunc('week', last_viewed_at)::date as active_week
    FROM learning_history
  )
  SELECT
    c.signup_week as cohort_week,
    COUNT(DISTINCT c.user_id) as total_users,
    COUNT(DISTINCT CASE WHEN a.active_week = c.signup_week + interval '1 week' THEN c.user_id END) as retained_week_1,
    COUNT(DISTINCT CASE WHEN a.active_week = c.signup_week + interval '2 weeks' THEN c.user_id END) as retained_week_2,
    COUNT(DISTINCT CASE WHEN a.active_week = c.signup_week + interval '3 weeks' THEN c.user_id END) as retained_week_3,
    COUNT(DISTINCT CASE WHEN a.active_week = c.signup_week + interval '4 weeks' THEN c.user_id END) as retained_week_4
  FROM cohorts c
  LEFT JOIN activity a ON c.user_id = a.user_id
  GROUP BY c.signup_week
  ORDER BY c.signup_week DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get daily active users for a date range
CREATE OR REPLACE FUNCTION get_daily_active_users(
  p_days_back integer DEFAULT 30
)
RETURNS TABLE (
  activity_date date,
  active_users bigint,
  new_users bigint,
  returning_users bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_activity AS (
    SELECT DISTINCT
      user_id,
      date_trunc('day', last_viewed_at)::date as activity_day
    FROM learning_history
    WHERE last_viewed_at >= now() - (p_days_back || ' days')::interval
  ),
  signups AS (
    SELECT
      id as user_id,
      date_trunc('day', created_at)::date as signup_day
    FROM profiles
  )
  SELECT
    d.activity_day as activity_date,
    COUNT(DISTINCT d.user_id) as active_users,
    COUNT(DISTINCT CASE WHEN s.signup_day = d.activity_day THEN d.user_id END) as new_users,
    COUNT(DISTINCT CASE WHEN s.signup_day < d.activity_day THEN d.user_id END) as returning_users
  FROM daily_activity d
  LEFT JOIN signups s ON d.user_id = s.user_id
  GROUP BY d.activity_day
  ORDER BY d.activity_day DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user engagement summary
CREATE OR REPLACE FUNCTION get_user_engagement_summary()
RETURNS TABLE (
  total_users bigint,
  active_today bigint,
  active_7_days bigint,
  active_30_days bigint,
  avg_cards_viewed numeric,
  avg_sessions_per_user numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE last_active_at >= now() - interval '1 day') as active_today,
    COUNT(*) FILTER (WHERE last_active_at >= now() - interval '7 days') as active_7_days,
    COUNT(*) FILTER (WHERE last_active_at >= now() - interval '30 days') as active_30_days,
    ROUND(AVG(cards_viewed)::numeric, 1) as avg_cards_viewed,
    ROUND(AVG(total_sessions)::numeric, 1) as avg_sessions_per_user
  FROM profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
