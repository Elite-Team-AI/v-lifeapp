-- Add missing fields for RebornFitness-style workout plan regeneration
-- Migration created: 2026-02-23

-- ============================================================================
-- user_workout_plans: Add fields for plan rationale and progression tracking
-- ============================================================================

-- Add plan_rationale field to store AI-generated plan explanation
-- This is returned by OpenAI when generating plans and displayed to users
ALTER TABLE public.user_workout_plans
  ADD COLUMN IF NOT EXISTS plan_rationale JSONB;

COMMENT ON COLUMN public.user_workout_plans.plan_rationale IS
  'AI-generated plan explanation with structure: {
    whyThisPlan: string,
    primaryModalityExplanation: string,
    whatToExpect: { weeks: [...], tips: [...] },
    planStructure: { weeklyPattern: string, progression: string },
    personalizationFactors: [...],
    successTips: [...]
  }';

-- Add current_week field for progression-based week tracking
-- This tracks which week the user is currently on (1-4) based on workout completion,
-- distinct from mesocycle_week which indicates position within the 4-week cycle
ALTER TABLE public.user_workout_plans
  ADD COLUMN IF NOT EXISTS current_week INTEGER DEFAULT 1
    CHECK (current_week >= 1 AND current_week <= 4);

COMMENT ON COLUMN public.user_workout_plans.current_week IS
  'Current week in the plan based on progression (1-4). User advances to next week when all workouts in current week are completed. Distinct from mesocycle_week.';

-- Add workouts_completed_count field for tracking total completions
ALTER TABLE public.user_workout_plans
  ADD COLUMN IF NOT EXISTS workouts_completed_count INTEGER DEFAULT 0
    CHECK (workouts_completed_count >= 0);

COMMENT ON COLUMN public.user_workout_plans.workouts_completed_count IS
  'Total number of workouts completed in this plan. Incremented when workouts are completed.';

-- ============================================================================
-- workout_logs: Add planned duration for performance analysis
-- ============================================================================

-- Add planned_duration_minutes field to enable duration compliance calculation
-- This is copied from plan_workouts.estimated_duration_minutes when starting a workout
-- and used in performance-analyzer.ts to calculate recovery score
ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS planned_duration_minutes INTEGER
    CHECK (planned_duration_minutes > 0);

COMMENT ON COLUMN public.workout_logs.planned_duration_minutes IS
  'Planned workout duration in minutes (copied from plan_workouts.estimated_duration_minutes). Used to calculate duration compliance rate in performance analysis.';

-- ============================================================================
-- Create trigger to auto-increment workouts_completed_count
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_workouts_completed_count()
RETURNS TRIGGER AS $$
BEGIN
  -- When a workout is marked as completed, increment the plan's workout count
  IF NEW.completion_status = 'completed' AND
     (OLD.completion_status IS NULL OR OLD.completion_status != 'completed') THEN

    -- Increment the count for the plan
    UPDATE user_workout_plans
    SET workouts_completed_count = workouts_completed_count + 1
    WHERE id = NEW.plan_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on workout_logs
DROP TRIGGER IF EXISTS trigger_increment_workouts_completed ON workout_logs;
CREATE TRIGGER trigger_increment_workouts_completed
  AFTER UPDATE ON workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION increment_workouts_completed_count();

COMMENT ON FUNCTION increment_workouts_completed_count() IS
  'Automatically increments user_workout_plans.workouts_completed_count when a workout is completed';

-- ============================================================================
-- Create function to advance to next week when all workouts completed
-- ============================================================================

CREATE OR REPLACE FUNCTION check_and_advance_week()
RETURNS TRIGGER AS $$
DECLARE
  total_workouts_in_week INTEGER;
  completed_workouts_in_week INTEGER;
  current_plan_week INTEGER;
BEGIN
  -- Only proceed if workout was just completed
  IF NEW.completion_status = 'completed' AND
     (OLD.completion_status IS NULL OR OLD.completion_status != 'completed') THEN

    -- Get current week from plan
    SELECT current_week INTO current_plan_week
    FROM user_workout_plans
    WHERE id = NEW.plan_id;

    -- Count total workouts planned for current week
    SELECT COUNT(*) INTO total_workouts_in_week
    FROM plan_workouts
    WHERE plan_id = NEW.plan_id
      AND week_number = current_plan_week;

    -- Count completed workouts in current week
    SELECT COUNT(*) INTO completed_workouts_in_week
    FROM plan_workouts pw
    WHERE pw.plan_id = NEW.plan_id
      AND pw.week_number = current_plan_week
      AND pw.is_completed = true;

    -- If all workouts in current week are completed, advance to next week
    IF completed_workouts_in_week >= total_workouts_in_week AND current_plan_week < 4 THEN
      UPDATE user_workout_plans
      SET current_week = current_week + 1
      WHERE id = NEW.plan_id;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on workout_logs
DROP TRIGGER IF EXISTS trigger_check_and_advance_week ON workout_logs;
CREATE TRIGGER trigger_check_and_advance_week
  AFTER UPDATE ON workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION check_and_advance_week();

COMMENT ON FUNCTION check_and_advance_week() IS
  'Automatically advances user_workout_plans.current_week when all workouts in current week are completed (progression-based advancement)';

-- ============================================================================
-- Migration verification
-- ============================================================================

-- Verify columns were added
DO $$
BEGIN
  -- Check user_workout_plans columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_workout_plans'
    AND column_name = 'plan_rationale'
  ) THEN
    RAISE EXCEPTION 'Migration failed: plan_rationale column not added';
  END IF;

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
    AND column_name = 'workouts_completed_count'
  ) THEN
    RAISE EXCEPTION 'Migration failed: workouts_completed_count column not added';
  END IF;

  -- Check workout_logs column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_logs'
    AND column_name = 'planned_duration_minutes'
  ) THEN
    RAISE EXCEPTION 'Migration failed: planned_duration_minutes column not added';
  END IF;

  RAISE NOTICE 'Migration completed successfully: All missing fields added';
END $$;
