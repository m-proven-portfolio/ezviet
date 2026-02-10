-- Voice Recording System
-- Stores user voice recordings for progress tracking and future community rating

-- Create voice_recordings table
CREATE TABLE IF NOT EXISTS voice_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What they were recording
  context TEXT NOT NULL,           -- 'market', 'flashcard', 'tone_gym', 'practice'
  phrase_text TEXT NOT NULL,       -- The Vietnamese text they were saying
  phrase_id TEXT,                  -- Optional reference (phrase ID, card slug, etc.)

  -- The recording
  storage_path TEXT NOT NULL,      -- Path in Supabase Storage
  duration_ms INTEGER,             -- Duration in milliseconds

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Future: community ratings (nullable for now)
  rating_count INTEGER DEFAULT 0,
  rating_sum INTEGER DEFAULT 0     -- Sum of all ratings (avg = sum/count)
);

-- Index for fetching user's recordings over time
CREATE INDEX IF NOT EXISTS idx_voice_recordings_user_date
  ON voice_recordings(user_id, created_at DESC);

-- Index for community rating queue (recordings with fewer than 3 ratings)
CREATE INDEX IF NOT EXISTS idx_voice_recordings_needs_rating
  ON voice_recordings(rating_count) WHERE rating_count < 3;

-- Index for looking up recordings by phrase
CREATE INDEX IF NOT EXISTS idx_voice_recordings_phrase
  ON voice_recordings(phrase_id) WHERE phrase_id IS NOT NULL;

-- RLS policies
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;

-- Users can read their own recordings
CREATE POLICY "Users can read own recordings"
  ON voice_recordings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own recordings
CREATE POLICY "Users can insert own recordings"
  ON voice_recordings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own recordings
CREATE POLICY "Users can delete own recordings"
  ON voice_recordings FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can read all recordings (for community rating queue)
CREATE POLICY "Admins can read all recordings"
  ON voice_recordings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Create voice-recordings storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-recordings',
  'voice-recordings',
  true,
  5242880, -- 5MB limit per recording
  ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Public read access (for playback)
CREATE POLICY "Public read access for voice-recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-recordings');

-- Storage policy: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload to own folder in voice-recordings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: Users can delete their own recordings
CREATE POLICY "Users can delete own voice recordings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
