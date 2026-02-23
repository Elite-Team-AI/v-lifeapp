-- Add user_role column to profiles table
-- Supports three-tier access: user, chosen (free access), super_admin (free + admin page)

-- Add user_role column with default 'user'
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_role text NOT NULL DEFAULT 'user';

-- Add constraint to ensure only valid roles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_role_check
CHECK (user_role IN ('user', 'chosen', 'super_admin'));

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON public.profiles(user_role);

-- Update existing profiles with is_admin flag to be super_admin
UPDATE public.profiles
SET user_role = 'super_admin'
WHERE is_admin = true;

-- Automatically assign super_admin role to specific users by email
UPDATE public.profiles
SET user_role = 'super_admin'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('hudson@eliteteam.ai', 'hwikoff4@gmail.com')
);

-- Add comment explaining the roles
COMMENT ON COLUMN public.profiles.user_role IS
'User access tier: user (paid), chosen (free access), super_admin (free access + admin page)';

-- Create a security definer function to check if current user is super_admin
-- This bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_role = 'super_admin'
  );
$$;

-- Add RLS policy to allow super_admins to view all profiles
-- This is needed for the admin dashboard to show all users
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Either viewing own profile, or user is a super_admin
  id = auth.uid() OR public.is_super_admin()
);
