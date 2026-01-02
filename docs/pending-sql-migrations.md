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

## 2. Add Avatar URL Column to Profiles (OPTIONAL - FUTURE)

The `profiles` table is missing an `avatar_url` column. Currently, all users display the default vLife logo avatar. If user profile pictures are needed, run this migration:

```sql
-- Add avatar_url column to profiles table
-- This enables users to have custom profile pictures

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Optional: Add a comment explaining the column
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user profile picture stored in Supabase Storage';
```

**Status:** ⏳ Optional (not required for current functionality)

**After running this migration:**
1. Update `lib/actions/community.ts` to restore `avatar_url` in profile queries
2. Uncomment the `getUserAvatar` helper function
3. Update transforms to use `getUserAvatar(post.profiles?.avatar_url)` instead of `DEFAULT_AVATAR`

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
