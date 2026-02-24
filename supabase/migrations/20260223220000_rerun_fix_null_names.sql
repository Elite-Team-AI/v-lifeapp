-- Re-run the NULL name fix to catch any users created between migrations
-- This ensures all existing users have proper display names

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

-- Log how many profiles were updated
DO $$
DECLARE
  updated_count integer;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % profiles with NULL or empty names', updated_count;
END $$;
