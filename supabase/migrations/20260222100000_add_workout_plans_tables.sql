-- =====================================================
-- ADD WORKOUT PLANS SYSTEM
-- =====================================================
-- This migration adds the workout_plans table and updates
-- the existing workouts and workout_exercises tables
-- to support the AI-powered personalized workout generation
-- =====================================================

-- Create workout_plans table
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Plan details
  plan_name TEXT NOT NULL,
  plan_type TEXT CHECK (plan_type IN (
    'push_pull_legs',
    'upper_lower',
    'full_body',
    'bro_split',
    'custom'
  )) NOT NULL,

  -- Duration
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Configuration
  days_per_week INTEGER CHECK (days_per_week BETWEEN 3 AND 7) NOT NULL,
  split_pattern TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for workout_plans
CREATE INDEX IF NOT EXISTS idx_workout_plans_user ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_active ON workout_plans(user_id, is_active) WHERE is_active = true;

-- Enable RLS for workout_plans
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_plans
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'workout_plans' AND policyname = 'Users can view their own workout plans'
  ) THEN
    CREATE POLICY "Users can view their own workout plans"
      ON workout_plans FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'workout_plans' AND policyname = 'Users can create their own workout plans'
  ) THEN
    CREATE POLICY "Users can create their own workout plans"
      ON workout_plans FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'workout_plans' AND policyname = 'Users can update their own workout plans'
  ) THEN
    CREATE POLICY "Users can update their own workout plans"
      ON workout_plans FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'workout_plans' AND policyname = 'Users can delete their own workout plans'
  ) THEN
    CREATE POLICY "Users can delete their own workout plans"
      ON workout_plans FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add missing columns to workouts table
DO $$ BEGIN
  -- Add workout_plan_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workouts' AND column_name = 'workout_plan_id'
  ) THEN
    ALTER TABLE workouts ADD COLUMN workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_workouts_plan ON workouts(workout_plan_id);
  END IF;

  -- Add workout_date if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workouts' AND column_name = 'workout_date'
  ) THEN
    ALTER TABLE workouts ADD COLUMN workout_date TIMESTAMP WITH TIME ZONE;
    CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(user_id, workout_date DESC);
  END IF;

  -- Add workout_name if it doesn't exist (rename from name)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workouts' AND column_name = 'workout_name'
  ) THEN
    -- If name column exists, rename it, otherwise add workout_name
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'workouts' AND column_name = 'name'
    ) THEN
      ALTER TABLE workouts RENAME COLUMN name TO workout_name;
    ELSE
      ALTER TABLE workouts ADD COLUMN workout_name TEXT;
    END IF;
  END IF;

  -- Add focus_areas if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workouts' AND column_name = 'focus_areas'
  ) THEN
    ALTER TABLE workouts ADD COLUMN focus_areas TEXT[];
  END IF;

  -- Add estimated_duration_minutes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workouts' AND column_name = 'estimated_duration_minutes'
  ) THEN
    ALTER TABLE workouts ADD COLUMN estimated_duration_minutes INTEGER;
  END IF;

  -- Add status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workouts' AND column_name = 'status'
  ) THEN
    ALTER TABLE workouts ADD COLUMN status TEXT DEFAULT 'planned'
      CHECK (status IN ('planned', 'in_progress', 'completed', 'skipped'));
  END IF;
END $$;

-- Ensure workout_exercises has the required columns
DO $$ BEGIN
  -- Add workout_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'workout_id'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_id);
  END IF;

  -- Add exercise_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'exercise_id'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN exercise_id UUID;
  END IF;

  -- Add exercise_order if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'exercise_order'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN exercise_order INTEGER;
  END IF;

  -- Add planned_sets if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'planned_sets'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN planned_sets INTEGER;
  END IF;

  -- Add planned_reps_min if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'planned_reps_min'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN planned_reps_min INTEGER;
  END IF;

  -- Add planned_reps_max if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'planned_reps_max'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN planned_reps_max INTEGER;
  END IF;

  -- Add rest_seconds if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'rest_seconds'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN rest_seconds INTEGER;
  END IF;

  -- Add tempo if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'tempo'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN tempo TEXT;
  END IF;

  -- Add rpe if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'rpe'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN rpe INTEGER CHECK (rpe BETWEEN 1 AND 10);
  END IF;

  -- Add notes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'notes'
  ) THEN
    ALTER TABLE workout_exercises ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Add comments
COMMENT ON TABLE workout_plans IS 'AI-generated personalized workout plans (4-week mesocycles)';
COMMENT ON COLUMN workouts.workout_plan_id IS 'References the workout_plans table if this workout is part of a plan';
COMMENT ON COLUMN workouts.workout_date IS 'Scheduled date for this workout';
COMMENT ON COLUMN workouts.focus_areas IS 'Muscle groups targeted in this workout';
COMMENT ON COLUMN workouts.status IS 'Current status: planned, in_progress, completed, or skipped';
