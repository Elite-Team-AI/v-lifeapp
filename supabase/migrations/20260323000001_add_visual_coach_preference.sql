-- Add visual coach preference to profiles table
-- This allows users to enable/disable the Visual AI Coach feature

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS visual_coach_enabled BOOLEAN DEFAULT false;

-- Add comment to document the column
COMMENT ON COLUMN profiles.visual_coach_enabled IS 'Whether the user has enabled the Visual AI Coach feature';

-- Set default to false for existing users (they can enable it in onboarding or settings)
UPDATE profiles
SET visual_coach_enabled = false
WHERE visual_coach_enabled IS NULL;
