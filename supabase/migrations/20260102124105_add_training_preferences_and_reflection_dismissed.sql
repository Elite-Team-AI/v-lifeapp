-- Add weekly reflection dismissed tracking to profiles
-- This allows users to dismiss the weekly reflection prompt and not be asked again until next week

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_reflection_dismissed_at TIMESTAMPTZ;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_weekly_reflection_dismissed 
ON profiles(weekly_reflection_dismissed_at) 
WHERE weekly_reflection_dismissed_at IS NOT NULL;

-- Add training preferences to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_style TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS available_time_minutes INTEGER DEFAULT 45;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_days_per_week INTEGER DEFAULT 4;

