-- =====================================================
-- FIX DAYS_PER_WEEK CONSTRAINT (ALLOW 2-DAY PLANS)
-- =====================================================
-- The constraint currently requires 3-7 days per week.
-- This migration updates it to allow 2-7 days to support
-- maintenance programs, recovery phases, or busy schedules.
-- =====================================================

-- Drop the existing constraint
ALTER TABLE user_workout_plans
  DROP CONSTRAINT IF EXISTS user_workout_plans_days_per_week_check;

-- Add the new constraint allowing 2-7 days
ALTER TABLE user_workout_plans
  ADD CONSTRAINT user_workout_plans_days_per_week_check
  CHECK (days_per_week BETWEEN 2 AND 7);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT user_workout_plans_days_per_week_check
  ON user_workout_plans IS
  'Allows 2-7 training days per week. 2 days supports maintenance, recovery, or busy schedules.';
