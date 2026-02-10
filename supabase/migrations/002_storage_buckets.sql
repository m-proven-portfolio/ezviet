-- Create storage buckets for EZViet
-- Note: This needs to be run with service role privileges

-- Create cards-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cards-images',
  'cards-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create cards-audio bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cards-audio',
  'cards-audio',
  true,
  10485760, -- 10MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Allow public read access
CREATE POLICY "Public read access for cards-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'cards-images');

CREATE POLICY "Public read access for cards-audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'cards-audio');

-- Storage policies: Allow authenticated uploads (or use service role)
CREATE POLICY "Allow uploads to cards-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cards-images');

CREATE POLICY "Allow uploads to cards-audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cards-audio');
