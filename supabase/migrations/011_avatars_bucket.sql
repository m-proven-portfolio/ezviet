-- Create avatars storage bucket for user profile photos

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit (avatars don't need to be large)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow public read access
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Storage policy: Allow uploads to avatars bucket
CREATE POLICY "Allow uploads to avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- Storage policy: Allow authenticated users to update their own avatars
CREATE POLICY "Allow updates to avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

-- Storage policy: Allow authenticated users to delete their own avatars
CREATE POLICY "Allow deletes from avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');
