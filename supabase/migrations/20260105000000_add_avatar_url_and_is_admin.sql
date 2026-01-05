-- Add avatar_url column to profiles table for user profile photos
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add is_admin column to profiles table for admin access control
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user profile photo stored in Supabase Storage';
COMMENT ON COLUMN public.profiles.is_admin IS 'Whether user has admin privileges';

-- RPC function to increment challenge participants count
CREATE OR REPLACE FUNCTION increment_challenge_participants(challenge_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE challenges 
  SET participants_count = COALESCE(participants_count, 0) + 1 
  WHERE id = challenge_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to decrement challenge participants count
CREATE OR REPLACE FUNCTION decrement_challenge_participants(challenge_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE challenges 
  SET participants_count = GREATEST(0, COALESCE(participants_count, 0) - 1) 
  WHERE id = challenge_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- RLS policy for avatars - users can upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS policy for avatars - public read access
CREATE POLICY "Public avatar read access" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'avatars');

-- RLS policy for avatars - users can update their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS policy for avatars - users can delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

