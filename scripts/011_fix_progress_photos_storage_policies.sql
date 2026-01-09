-- Fix progress photos storage policies to use path-based authentication
-- The issue: Previous policies used owner column which may not be set correctly
-- Solution: Check that the storage path starts with the user's ID

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their progress photos" ON storage.objects;

-- Allow users to read only their own photos (check path starts with user_id)
CREATE POLICY "Users can view their progress photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'progress-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload progress photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'progress-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their progress photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'progress-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Also update bucket to ensure it exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'progress-photos',
  'progress-photos',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
