-- Fix infinite recursion in profiles RLS policies
-- The is_super_admin() function creates recursion when it queries profiles table

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

-- Recreate a simple SELECT policy that doesn't cause recursion
-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Ensure INSERT policy is simple and correct
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Ensure UPDATE policy is simple and correct
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Service role still has full access (for admin operations)
-- This policy already exists but let's ensure it's there
CREATE POLICY IF NOT EXISTS "Service role full access"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
