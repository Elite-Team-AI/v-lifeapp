# User Role Migration - Manual Application Required

## Current Status

The migration file `20260222215118_add_user_roles.sql` is marked as "applied" in the migration history, but the actual SQL was never executed on the database. This happened due to migration history sync issues.

## Verification

Running the verification script confirms the `user_role` column does NOT exist:
```
❌ Error querying profiles: column profiles.user_role does not exist
```

## Solution: Manually Run SQL

### Option 1: Supabase Dashboard SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
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
```

5. Click **Run** or press Cmd/Ctrl + Enter
6. Verify success - you should see messages indicating:
   - Column was added
   - Constraint was created
   - Index was created
   - Updates completed (super_admin assigned to the specified emails)
   - RLS policy was created

### Option 2: Verification After Running SQL

After running the SQL in the dashboard, verify it worked by running:

```bash
cd "/Users/hudsonbiz/Documents/Cursor projects/V-life"
NEXT_PUBLIC_SUPABASE_URL="https://xiezvibwxvsulfiooknp.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZXp2aWJ3eHZzdWxmaW9va25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzU5MjcsImV4cCI6MjA3NzQ1MTkyN30.DIEEkCqaznYNJbIxstDWgdzFxIelCp5fxjI6Ka885pA" \
node verify-migration.js
```

You should see:
```
✅ user_role column exists!
✅ Found 2 super_admin(s)
✨ Migration verification complete!
```

## What This Migration Does

1. **Adds `user_role` column** to the `profiles` table with three possible values:
   - `user` - Standard paid access (default for all users)
   - `chosen` - Free access to all features
   - `super_admin` - Free access + admin dashboard access

2. **Adds database constraint** to ensure only valid role values

3. **Creates index** on `user_role` for faster queries

4. **Automatically assigns super_admin** to:
   - Any users with `is_admin = true`
   - Users with emails: `hudson@eliteteam.ai` and `hwikoff4@gmail.com`

5. **Adds RLS policy** that allows super_admins to view all profiles
   - This is crucial for the admin dashboard to show all users
   - Regular users can only see their own profile
   - Super admins can see everyone (needed for user statistics)

## Next Steps After Migration

Once the SQL is successfully run:

1. ✅ Test logging in with super_admin emails
2. ✅ Verify the admin link appears in the dashboard header (purple shield icon)
3. ✅ Verify the admin page is accessible at `/admin`
4. ✅ Verify non-super_admin users cannot access `/admin` (should redirect to dashboard)
