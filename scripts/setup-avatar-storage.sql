-- Avatar Storage Setup Script
-- Run this in Supabase SQL Editor if avatar uploads are failing

-- Step 1: Add avatar_url column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user profile photo stored in Supabase Storage';

-- Step 2: Create the avatars storage bucket (this may need to be done via dashboard)
-- Note: INSERT INTO storage.buckets requires elevated privileges
-- If this fails, create the bucket manually in Supabase Dashboard -> Storage -> New Bucket
-- Name: avatars, Public: Yes

-- Step 3: Drop existing policies if they exist (to recreate them cleanly)
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Step 4: Create RLS policies for avatar uploads
-- Policy: Users can upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Anyone can read avatars (they're public)
CREATE POLICY "Public avatar read access" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'avatars');

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Verify the setup
SELECT 'avatar_url column exists' as check_result 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'avatar_url';

