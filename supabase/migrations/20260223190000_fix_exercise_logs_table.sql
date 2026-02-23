-- =====================================================
-- FIX EXERCISE_LOGS TABLE
-- =====================================================
-- This migration drops and recreates the exercise_logs table with the correct schema.
-- The issue: Columns may have been created with wrong types (JSONB instead of PostgreSQL arrays)
-- Solution from RebornFitness: Drop and recreate with correct PostgreSQL native array types
-- Migration created: 2026-02-23 19:00:00

-- Drop the table completely (CASCADE removes dependencies)
DROP TABLE IF EXISTS public.exercise_logs CASCADE;

-- Recreate with CORRECT schema using PostgreSQL native arrays
CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercise_library(id) ON DELETE CASCADE NOT NULL,
  plan_exercise_id UUID REFERENCES plan_exercises(id) ON DELETE SET NULL,

  -- Exercise classification
  exercise_type TEXT CHECK (exercise_type IN (
    'strength', 'cardio', 'flexibility', 'bodyweight',
    'plyometric', 'swimming', 'sports'
  )) NOT NULL,

  -- STRENGTH TRAINING DATA (using PostgreSQL arrays - NOT JSONB!)
  sets_planned INTEGER,
  sets_completed INTEGER,
  reps_per_set INTEGER[],              -- [12, 10, 10, 8]
  weight_per_set NUMERIC(6,2)[],       -- [135.00, 135.00, 145.00, 145.00]
  rpe_per_set INTEGER[],               -- [7, 8, 9, 9]
  rest_seconds_actual INTEGER[],       -- Rest time between sets
  tempo TEXT,                          -- Tempo notation (e.g., "3-1-1-0")

  -- CARDIO DATA
  duration_seconds INTEGER,
  distance_miles NUMERIC(6,2),
  distance_meters NUMERIC(8,2),
  pace_per_mile_seconds INTEGER,
  pace_per_100m_seconds INTEGER,
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  elevation_gain_feet INTEGER,

  -- Intervals (for HIIT cardio)
  intervals_completed INTEGER,
  work_interval_seconds INTEGER,
  rest_interval_seconds INTEGER,

  -- SWIMMING SPECIFIC
  swim_stroke TEXT CHECK (swim_stroke IN (
    'freestyle', 'backstroke', 'breaststroke', 'butterfly', 'mixed'
  )),
  laps_completed INTEGER,
  pool_length_meters INTEGER,

  -- FLEXIBILITY/YOGA
  holds_per_position INTEGER[],
  hold_duration_seconds INTEGER[],

  -- UNIVERSAL METRICS
  perceived_exertion INTEGER CHECK (perceived_exertion BETWEEN 1 AND 10),
  form_quality INTEGER CHECK (form_quality BETWEEN 1 AND 5),
  completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100) DEFAULT 100,

  -- Modifications & Notes
  modifications_made TEXT[],
  difficulty_adjustment TEXT CHECK (difficulty_adjustment IN (
    'easier', 'same', 'harder'
  )),
  pain_or_discomfort BOOLEAN DEFAULT false,
  pain_location TEXT,
  notes TEXT,
  video_url TEXT,

  -- Metadata
  skipped BOOLEAN DEFAULT false,
  skip_reason TEXT,
  substituted_exercise_id UUID REFERENCES exercise_library(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_exercise_logs_workout_log ON exercise_logs(workout_log_id);
CREATE INDEX idx_exercise_logs_exercise ON exercise_logs(exercise_id);
CREATE INDEX idx_exercise_logs_plan_exercise ON exercise_logs(plan_exercise_id);
CREATE INDEX idx_exercise_logs_type ON exercise_logs(exercise_type);
CREATE INDEX idx_exercise_logs_created_at ON exercise_logs(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own exercise logs
CREATE POLICY "Users can view their own exercise logs"
  ON public.exercise_logs FOR SELECT
  TO authenticated
  USING (
    workout_log_id IN (
      SELECT id FROM workout_logs WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own exercise logs
CREATE POLICY "Users can insert their own exercise logs"
  ON public.exercise_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    workout_log_id IN (
      SELECT id FROM workout_logs WHERE user_id = auth.uid()
    )
  );

-- Users can update their own exercise logs
CREATE POLICY "Users can update their own exercise logs"
  ON public.exercise_logs FOR UPDATE
  TO authenticated
  USING (
    workout_log_id IN (
      SELECT id FROM workout_logs WHERE user_id = auth.uid()
    )
  );

-- Users can delete their own exercise logs
CREATE POLICY "Users can delete their own exercise logs"
  ON public.exercise_logs FOR DELETE
  TO authenticated
  USING (
    workout_log_id IN (
      SELECT id FROM workout_logs WHERE user_id = auth.uid()
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to exercise logs"
  ON public.exercise_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.exercise_logs IS
  'Exercise-level tracking within workout sessions. Uses PostgreSQL native array types (INTEGER[], NUMERIC[]) for set-based data, NOT JSONB.';

COMMENT ON COLUMN public.exercise_logs.reps_per_set IS
  'Array of reps completed for each set (e.g., [12, 10, 10, 8]). PostgreSQL native INTEGER[] type.';

COMMENT ON COLUMN public.exercise_logs.weight_per_set IS
  'Array of weights used for each set in lbs (e.g., [135, 135, 145, 145]). PostgreSQL native NUMERIC(6,2)[] type.';

COMMENT ON COLUMN public.exercise_logs.rpe_per_set IS
  'Array of RPE (Rate of Perceived Exertion) values for each set, 1-10 scale (e.g., [7, 8, 9, 9]). PostgreSQL native INTEGER[] type.';

COMMENT ON COLUMN public.exercise_logs.exercise_type IS
  'Type of exercise: strength, cardio, flexibility, bodyweight, plyometric, swimming, or sports';

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  reps_type TEXT;
  weight_type TEXT;
  rpe_type TEXT;
BEGIN
  -- Check actual column types
  SELECT data_type INTO reps_type
  FROM information_schema.columns
  WHERE table_name = 'exercise_logs' AND column_name = 'reps_per_set';

  SELECT data_type INTO weight_type
  FROM information_schema.columns
  WHERE table_name = 'exercise_logs' AND column_name = 'weight_per_set';

  SELECT data_type INTO rpe_type
  FROM information_schema.columns
  WHERE table_name = 'exercise_logs' AND column_name = 'rpe_per_set';

  -- Verify types are ARRAY, not jsonb
  IF reps_type != 'ARRAY' THEN
    RAISE EXCEPTION 'reps_per_set has wrong type: % (expected ARRAY)', reps_type;
  END IF;

  IF weight_type != 'ARRAY' THEN
    RAISE EXCEPTION 'weight_per_set has wrong type: % (expected ARRAY)', weight_type;
  END IF;

  IF rpe_type != 'ARRAY' THEN
    RAISE EXCEPTION 'rpe_per_set has wrong type: % (expected ARRAY)', rpe_type;
  END IF;

  RAISE NOTICE 'Migration completed successfully: exercise_logs table recreated with correct PostgreSQL array types';
END $$;
