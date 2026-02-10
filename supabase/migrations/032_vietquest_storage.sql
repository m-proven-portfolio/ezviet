-- Create storage bucket for VietQuest game assets
-- Backgrounds, NPC avatars, and audio files

-- Create the vietquest bucket for game assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vietquest',
  'vietquest',
  true,  -- Public bucket for easy access
  5242880,  -- 5MB limit per file
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'audio/mpeg', 'audio/wav']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all files in the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'vietquest');

-- Allow authenticated users to upload (for admin use)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vietquest'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vietquest'
  AND auth.role() = 'authenticated'
);
