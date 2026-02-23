-- Fix users with NULL names by extracting from email or using User ID
-- This ensures Community posts and other features display meaningful usernames

-- Update profiles where name is NULL
-- Strategy: Use email username (part before @) as fallback name
UPDATE public.profiles
SET
  name = COALESCE(
    -- Try to get email username from auth.users
    (
      SELECT
        INITCAP(
          REGEXP_REPLACE(
            SPLIT_PART(email, '@', 1),  -- Get part before @
            '[._-]+', ' ', 'g'           -- Replace underscores, dots, dashes with spaces
          )
        )
      FROM auth.users
      WHERE auth.users.id = profiles.id
    ),
    -- Fallback to "User" + first 6 chars of ID if no email
    'User ' || SUBSTRING(id::TEXT FROM 1 FOR 6)
  ),
  updated_at = NOW()
WHERE
  name IS NULL
  OR name = ''
  OR TRIM(name) = '';

-- Add a comment explaining the column for future reference
COMMENT ON COLUMN public.profiles.name IS 'User display name. Set during onboarding or derived from email if missing. Never null after this migration.';
