-- Add week progression tracking to user_workout_plans table
-- This enables the sequential week-by-week workout system with progressive overload
-- Migration created: 2026-03-21

-- ============================================================================
-- STEP 1: Add week tracking columns to user_workout_plans
-- ============================================================================

-- Track which week the user is currently on (1-4)
ALTER TABLE public.user_workout_plans
  ADD COLUMN IF NOT EXISTS current_week INTEGER DEFAULT 1 CHECK (current_week BETWEEN 1 AND 4);

-- Track when each week was completed
ALTER TABLE public.user_workout_plans
  ADD COLUMN IF NOT EXISTS week_1_completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.user_workout_plans
  ADD COLUMN IF NOT EXISTS week_2_completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.user_workout_plans
  ADD COLUMN IF NOT EXISTS week_3_completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.user_workout_plans
  ADD COLUMN IF NOT EXISTS week_4_completed_at TIMESTAMP WITH TIME ZONE;

-- Store progression data (logged weights, RPE, performance metrics)
-- Used for calculating progressive overload for next week
-- Structure: {
--   "week_1": {
--     "workout_id": {
--       "exercise_id": {
--         "best_weight": 225,
--         "avg_reps": 10,
--         "avg_rpe": 8,
--         "completion_rate": 100
--       }
--     }
--   }
-- }
ALTER TABLE public.user_workout_plans
  ADD COLUMN IF NOT EXISTS progression_data JSONB DEFAULT '{}'::jsonb;

-- Track if all weeks have been generated (for sequential generation)
ALTER TABLE public.user_workout_plans
  ADD COLUMN IF NOT EXISTS weeks_generated INTEGER DEFAULT 1 CHECK (weeks_generated BETWEEN 0 AND 4);

-- ============================================================================
-- STEP 2: Add columns to plan_workouts for better tracking
-- ============================================================================

-- Mark if this workout is locked (can't be accessed until previous week complete)
ALTER TABLE public.plan_workouts
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- Store the recommended weight for next time (calculated from previous performance)
ALTER TABLE public.plan_exercises
  ADD COLUMN IF NOT EXISTS recommended_weight_lbs NUMERIC(6,2);

-- Store last logged weight for this exercise
ALTER TABLE public.plan_exercises
  ADD COLUMN IF NOT EXISTS last_logged_weight_lbs NUMERIC(6,2);

-- Store last logged reps for this exercise
ALTER TABLE public.plan_exercises
  ADD COLUMN IF NOT EXISTS last_logged_reps INTEGER;

-- Store last logged RPE for this exercise
ALTER TABLE public.plan_exercises
  ADD COLUMN IF NOT EXISTS last_logged_rpe INTEGER;

-- Progression strategy for this exercise
ALTER TABLE public.plan_exercises
  ADD COLUMN IF NOT EXISTS progression_type TEXT DEFAULT 'weight' CHECK (progression_type IN ('weight', 'reps', 'sets', 'volume'));

-- ============================================================================
-- STEP 3: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_workout_plans_current_week ON user_workout_plans(user_id, current_week);
CREATE INDEX IF NOT EXISTS idx_plan_workouts_locked ON plan_workouts(user_id, is_locked);

-- ============================================================================
-- STEP 4: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.user_workout_plans.current_week IS
  'Current week number (1-4) the user is working on. Unlocks next week when all workouts in current week are complete.';

COMMENT ON COLUMN public.user_workout_plans.week_1_completed_at IS
  'Timestamp when user completed all workouts in Week 1';

COMMENT ON COLUMN public.user_workout_plans.progression_data IS
  'JSONB object storing logged performance data for calculating progressive overload. Updated after each workout completion.';

COMMENT ON COLUMN public.user_workout_plans.weeks_generated IS
  'Number of weeks that have been generated (1-4). Enables sequential week-by-week generation based on previous week performance.';

COMMENT ON COLUMN public.plan_workouts.is_locked IS
  'If true, this workout cannot be accessed until the previous week is completed. Enables week-by-week unlocking.';

COMMENT ON COLUMN public.plan_exercises.recommended_weight_lbs IS
  'AI-calculated recommended weight for next workout based on previous performance (progressive overload).';

COMMENT ON COLUMN public.plan_exercises.progression_type IS
  'How this exercise should progress: weight (add more weight), reps (add more reps), sets (add more sets), or volume (increase total volume).';

-- ============================================================================
-- STEP 5: Update existing plans to have current_week = 1
-- ============================================================================

UPDATE public.user_workout_plans
SET current_week = 1,
    weeks_generated = 4 -- Existing plans have all 4 weeks already generated
WHERE current_week IS NULL;

-- Unlock Week 1 workouts for all existing plans
UPDATE public.plan_workouts
SET is_locked = false
WHERE week_number = 1;

-- Lock Weeks 2-4 for all existing plans
UPDATE public.plan_workouts
SET is_locked = true
WHERE week_number IN (2, 3, 4);

-- ============================================================================
-- STEP 6: Create helper function to advance to next week
-- ============================================================================

CREATE OR REPLACE FUNCTION advance_to_next_week(plan_id_param UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_week INTEGER
) AS $$
DECLARE
  v_current_week INTEGER;
  v_user_id UUID;
  v_week_workouts_count INTEGER;
  v_week_completed_count INTEGER;
BEGIN
  -- Get current week and user_id
  SELECT current_week, user_id INTO v_current_week, v_user_id
  FROM user_workout_plans
  WHERE id = plan_id_param;

  IF v_current_week IS NULL THEN
    RETURN QUERY SELECT false, 'Plan not found', 0;
    RETURN;
  END IF;

  IF v_current_week >= 4 THEN
    RETURN QUERY SELECT false, 'Already on final week', v_current_week;
    RETURN;
  END IF;

  -- Count total workouts in current week
  SELECT COUNT(*) INTO v_week_workouts_count
  FROM plan_workouts
  WHERE plan_id = plan_id_param
    AND week_number = v_current_week;

  -- Count completed workouts in current week
  SELECT COUNT(*) INTO v_week_completed_count
  FROM plan_workouts pw
  INNER JOIN workout_logs wl ON wl.plan_workout_id = pw.id
  WHERE pw.plan_id = plan_id_param
    AND pw.week_number = v_current_week
    AND wl.status = 'completed';

  -- Check if all workouts in current week are completed
  IF v_week_completed_count < v_week_workouts_count THEN
    RETURN QUERY SELECT false,
      format('Complete all %s workouts in Week %s before advancing (completed: %s)',
        v_week_workouts_count, v_current_week, v_week_completed_count),
      v_current_week;
    RETURN;
  END IF;

  -- Mark current week as completed
  IF v_current_week = 1 THEN
    UPDATE user_workout_plans SET week_1_completed_at = NOW() WHERE id = plan_id_param;
  ELSIF v_current_week = 2 THEN
    UPDATE user_workout_plans SET week_2_completed_at = NOW() WHERE id = plan_id_param;
  ELSIF v_current_week = 3 THEN
    UPDATE user_workout_plans SET week_3_completed_at = NOW() WHERE id = plan_id_param;
  ELSIF v_current_week = 4 THEN
    UPDATE user_workout_plans SET week_4_completed_at = NOW() WHERE id = plan_id_param;
  END IF;

  -- Advance to next week
  UPDATE user_workout_plans
  SET current_week = v_current_week + 1
  WHERE id = plan_id_param;

  -- Unlock next week's workouts
  UPDATE plan_workouts
  SET is_locked = false
  WHERE plan_id = plan_id_param
    AND week_number = v_current_week + 1;

  RETURN QUERY SELECT true,
    format('Advanced to Week %s', v_current_week + 1),
    v_current_week + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION advance_to_next_week(UUID) TO authenticated;

COMMENT ON FUNCTION advance_to_next_week IS
  'Advances user to next week of their workout plan if all workouts in current week are completed. Unlocks next week workouts.';

-- ============================================================================
-- STEP 7: Verification
-- ============================================================================

DO $$
BEGIN
  -- Verify critical columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_workout_plans'
    AND column_name = 'current_week'
  ) THEN
    RAISE EXCEPTION 'Migration failed: current_week column not added';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_workout_plans'
    AND column_name = 'progression_data'
  ) THEN
    RAISE EXCEPTION 'Migration failed: progression_data column not added';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_workouts'
    AND column_name = 'is_locked'
  ) THEN
    RAISE EXCEPTION 'Migration failed: is_locked column not added';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_exercises'
    AND column_name = 'recommended_weight_lbs'
  ) THEN
    RAISE EXCEPTION 'Migration failed: recommended_weight_lbs column not added';
  END IF;

  RAISE NOTICE 'Migration completed successfully: Week progression tracking enabled';
END $$;
