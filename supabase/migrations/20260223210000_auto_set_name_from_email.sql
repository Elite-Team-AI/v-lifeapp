-- Update the handle_new_user trigger to automatically set name from email
-- This ensures all new users have a meaningful display name from the start
-- Prevents "Anonymous" from appearing in community posts

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with name extracted from email
  INSERT INTO public.profiles (
    id,
    name,
    referral_code,
    credits,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    -- Extract name from email: "john.doe@example.com" -> "John Doe"
    COALESCE(
      INITCAP(
        REGEXP_REPLACE(
          SPLIT_PART(NEW.email, '@', 1),  -- Get part before @
          '[._-]+', ' ', 'g'               -- Replace underscores, dots, dashes with spaces
        )
      ),
      'User ' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 6)  -- Fallback if no email
    ),
    'VLIFE-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
    0,
    false,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the function behavior
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile for new auth.users with name extracted from email. Users can update their name during onboarding if desired.';
