-- Add calorie_goal column to profiles table
-- NULL means use calculated value based on goal_weight and primary_goal
-- Non-NULL means user override

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS calorie_goal INTEGER DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.calorie_goal IS
  'User-defined daily calorie goal override. NULL = use calculated value based on goal_weight and primary_goal';

-- Add reasonable constraints (800-10000 kcal range)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_calorie_goal_check'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_calorie_goal_check
    CHECK (calorie_goal IS NULL OR (calorie_goal >= 800 AND calorie_goal <= 10000));
  END IF;
END $$;
