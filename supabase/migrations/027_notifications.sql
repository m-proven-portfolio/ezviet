-- Notifications table for EZViet Core contributor feedback
-- Stores in-app notifications for edit status, achievements, tier unlocks

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'edit_approved',
    'edit_rejected',
    'edit_merged',
    'tier_unlocked',
    'achievement_earned',
    'song_needs_help',
    'mention'
  )),
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fetching user's unread notifications efficiently
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- Index for fetching all user notifications
CREATE INDEX idx_notifications_user_all ON notifications(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only service role can insert notifications (via API routes)
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Push subscription table for web push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, endpoint)
);

-- Index for looking up subscriptions by user
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own push subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Comment for documentation
COMMENT ON TABLE notifications IS 'In-app notifications for EZViet Core contributors. Tracks edit approvals, rejections, tier unlocks, and achievements.';
COMMENT ON TABLE push_subscriptions IS 'Web push notification subscriptions for browser notifications.';
COMMENT ON COLUMN notifications.type IS 'Notification type: edit_approved, edit_rejected, edit_merged, tier_unlocked, achievement_earned, song_needs_help, mention';
COMMENT ON COLUMN notifications.metadata IS 'Additional context: song_id, submission_id, achievement_type, new_tier, etc.';
