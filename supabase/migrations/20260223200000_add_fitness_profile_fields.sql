-- =====================================================
-- ADD MISSING FITNESS PROFILE FIELDS
-- =====================================================
-- This migration adds fields that the workout generation code expects
-- but are currently missing from the profiles table.
-- Migration created: 2026-02-23 20:00:00

-- Add experience level (beginner, intermediate, advanced)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS experience_level TEXT
CHECK (experience_level IN ('beginner', 'intermediate', 'advanced'))
DEFAULT 'beginner';

-- Add available equipment as array (supplements custom_equipment text field)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS available_equipment TEXT[]
DEFAULT '{}';

-- Add workout location
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS workout_location TEXT;

-- Add preferred workout time
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_workout_time TEXT;

-- Add weekly workout goal (days per week)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS weekly_workout_goal INTEGER
CHECK (weekly_workout_goal >= 1 AND weekly_workout_goal <= 7)
DEFAULT 3;

-- Add mobility assessment scores (1-10 scale)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS shoulder_mobility INTEGER
CHECK (shoulder_mobility >= 1 AND shoulder_mobility <= 10);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hip_mobility INTEGER
CHECK (hip_mobility >= 1 AND hip_mobility <= 10);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ankle_mobility INTEGER
CHECK (ankle_mobility >= 1 AND ankle_mobility <= 10);

-- Add fitness assessment data
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS push_ups INTEGER
CHECK (push_ups >= 0);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pull_ups INTEGER
CHECK (pull_ups >= 0);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS squat_depth TEXT
CHECK (squat_depth IN ('parallel', 'below_parallel', 'partial'));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plank_time INTEGER
CHECK (plank_time >= 0);

-- Add fitness_goal as alias for primary_goal to match code expectations
-- This avoids breaking existing primary_goal references
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS fitness_goal TEXT;

-- Create a trigger to keep fitness_goal in sync with primary_goal
CREATE OR REPLACE FUNCTION sync_fitness_goal()
RETURNS TRIGGER AS $$
BEGIN
  -- When primary_goal is updated, update fitness_goal
  IF NEW.primary_goal IS DISTINCT FROM OLD.primary_goal THEN
    NEW.fitness_goal := NEW.primary_goal;
  END IF;

  -- When fitness_goal is updated, update primary_goal
  IF NEW.fitness_goal IS DISTINCT FROM OLD.fitness_goal THEN
    NEW.primary_goal := NEW.fitness_goal;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists (for re-running migration)
DROP TRIGGER IF EXISTS sync_fitness_goal_trigger ON public.profiles;

-- Create trigger on profiles table
CREATE TRIGGER sync_fitness_goal_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION sync_fitness_goal();

-- Initialize fitness_goal with current primary_goal values
UPDATE public.profiles
SET fitness_goal = primary_goal
WHERE fitness_goal IS NULL AND primary_goal IS NOT NULL;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN public.profiles.experience_level IS
  'User fitness experience level: beginner, intermediate, or advanced. Used by workout generation AI.';

COMMENT ON COLUMN public.profiles.available_equipment IS
  'Array of available equipment. Supplements custom_equipment field. Used to filter exercises in workout generation.';

COMMENT ON COLUMN public.profiles.workout_location IS
  'Where user works out (e.g., home, gym, hotel). Used to contextualize workout recommendations.';

COMMENT ON COLUMN public.profiles.preferred_workout_time IS
  'Preferred workout time window (e.g., morning, afternoon, evening). Used for scheduling and energy level considerations.';

COMMENT ON COLUMN public.profiles.weekly_workout_goal IS
  'Number of workout days per week (1-7). Used to structure weekly workout split.';

COMMENT ON COLUMN public.profiles.shoulder_mobility IS
  'Shoulder mobility assessment score (1-10). Used to adjust exercise selection and progression.';

COMMENT ON COLUMN public.profiles.hip_mobility IS
  'Hip mobility assessment score (1-10). Used to adjust exercise selection and progression.';

COMMENT ON COLUMN public.profiles.ankle_mobility IS
  'Ankle mobility assessment score (1-10). Used to adjust exercise selection and progression.';

COMMENT ON COLUMN public.profiles.push_ups IS
  'Number of consecutive push-ups completed in assessment. Used to gauge upper body pressing strength.';

COMMENT ON COLUMN public.profiles.pull_ups IS
  'Number of consecutive pull-ups completed in assessment. Used to gauge upper body pulling strength.';

COMMENT ON COLUMN public.profiles.squat_depth IS
  'Squat depth assessment: parallel, below_parallel, or partial. Used to adjust lower body exercise progression.';

COMMENT ON COLUMN public.profiles.plank_time IS
  'Plank hold time in seconds. Used to gauge core stability and endurance.';

COMMENT ON COLUMN public.profiles.fitness_goal IS
  'User fitness goal. Synced with primary_goal via trigger. Used by workout generation code.';

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if all new columns exist
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'experience_level'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Migration failed: experience_level column not created';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'available_equipment'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Migration failed: available_equipment column not created';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'fitness_goal'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Migration failed: fitness_goal column not created';
  END IF;

  RAISE NOTICE 'Migration completed successfully: All fitness profile fields added';
END $$;
