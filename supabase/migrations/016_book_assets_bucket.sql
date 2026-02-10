-- Create storage bucket for book assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-assets',
  'book-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for book assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-assets');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload book assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'book-assets');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Users can delete book assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'book-assets');
