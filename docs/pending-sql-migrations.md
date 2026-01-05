# Pending SQL Migrations

**Project:** vLife
**Last Updated:** 2026-01-02

---

## 1. Fix Posts Category Constraint (ALREADY DEPLOYED)

This migration was already deployed via `npx supabase db push`.

**File:** `supabase/migrations/20260102160000_fix_posts_category_constraint.sql`

```sql
-- Fix posts category CHECK constraint to include 'motivation'
-- This was causing posts to silently fail when users selected "Motivation" category

-- Drop the existing constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check;

-- Add the updated constraint with 'motivation' included
ALTER TABLE posts ADD CONSTRAINT posts_category_check
  CHECK (category IN ('achievement', 'workout', 'nutrition', 'motivation', 'general'));
```

**Status:** ✅ Deployed

---

## 2. Avatar Upload Setup (REQUIRED for profile photos)

The avatar upload feature requires:
1. The `avatar_url` column in the `profiles` table
2. A `avatars` storage bucket in Supabase
3. RLS policies to allow users to upload their own avatars

**Quick Fix:** Run the SQL script at `scripts/setup-avatar-storage.sql` in your Supabase SQL Editor.

**Manual Setup (if script fails):**

### Step 1: Add column (run in SQL Editor)
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

### Step 2: Create storage bucket (via Dashboard)
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `avatars`
4. Check "Public bucket"
5. Click "Create bucket"

### Step 3: Add RLS policies (run in SQL Editor)
```sql
-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can read avatars
CREATE POLICY "Public avatar read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Users can update their own avatar  
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

**Status:** ⏳ Required for avatar uploads to work

---

## How to Run Migrations

### Option 1: Via Supabase CLI (Recommended)
```bash
# Make sure you're in the project directory
cd c:\cursor-projects\v-life

# Check which project is linked
npx supabase projects list

# Push migrations to remote database
npx supabase db push
```

### Option 2: Via Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select the vLife project
3. Go to SQL Editor
4. Paste and run the SQL

---

## Migration History

| Date | Migration | Description | Status |
|------|-----------|-------------|--------|
| 2026-01-02 | `20260102160000_fix_posts_category_constraint.sql` | Added 'motivation' to posts category constraint | ✅ Deployed |

---

## Notes

- The community posts bug was caused by querying a non-existent `avatar_url` column, not by missing SQL
- The fix was applied in application code (`lib/actions/community.ts`) by removing the column from queries
- No additional SQL is required for the app to function correctly
