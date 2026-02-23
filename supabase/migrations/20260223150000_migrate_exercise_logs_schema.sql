-- Migrate exercise_logs table from old schema to new personalized workout system schema
-- This migration adds all missing columns required by the workout logging system
-- Migration created: 2026-02-23 15:00:00

-- ============================================================================
-- STEP 1: Add missing columns to exercise_logs table
-- ============================================================================

-- Add workout_log_id (replaces old workout_id)
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE;

-- Add plan_exercise_id reference
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS plan_exercise_id UUID REFERENCES plan_exercises(id) ON DELETE SET NULL;

-- Add exercise_type (required field)
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS exercise_type TEXT CHECK (exercise_type IN (
    'strength',           -- Weight training
    'cardio',            -- Running, cycling, etc.
    'flexibility',       -- Stretching, yoga
    'bodyweight',        -- Calisthenics
    'plyometric',        -- Jump training
    'swimming',          -- Swimming specific
    'sports'             -- General sports activity
  ));

-- ===== STRENGTH TRAINING DATA =====
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS sets_planned INTEGER;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS sets_completed INTEGER;

-- These are the critical missing columns causing the 500 error
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS reps_per_set INTEGER[]; -- [12, 10, 10, 8] - actual reps per set

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS weight_per_set NUMERIC(6,2)[]; -- [135, 135, 145, 145] - weight used per set

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS rpe_per_set INTEGER[]; -- [7, 8, 9, 9] - Rate of Perceived Exertion 1-10

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS rest_seconds_actual INTEGER[];

-- Tempo tracking (optional)
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS tempo TEXT; -- "3-1-1-0" = 3sec eccentric, 1sec pause, 1sec concentric, 0sec top

-- ===== CARDIO DATA =====
-- Note: duration_seconds and distance already exist in old schema, so we skip those

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS distance_miles NUMERIC(6,2);

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS distance_meters NUMERIC(8,2);

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS pace_per_mile_seconds INTEGER; -- For running

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS pace_per_100m_seconds INTEGER; -- For swimming

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS avg_heart_rate INTEGER;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS max_heart_rate INTEGER;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS elevation_gain_feet INTEGER;

-- Intervals (for HIIT cardio)
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS intervals_completed INTEGER;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS work_interval_seconds INTEGER;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS rest_interval_seconds INTEGER;

-- ===== SWIMMING SPECIFIC =====
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS swim_stroke TEXT CHECK (swim_stroke IN (
    'freestyle', 'backstroke', 'breaststroke', 'butterfly', 'mixed'
  ));

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS laps_completed INTEGER;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS pool_length_meters INTEGER;

-- ===== FLEXIBILITY/YOGA =====
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS holds_per_position INTEGER[];

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS hold_duration_seconds INTEGER[];

-- ===== UNIVERSAL METRICS =====
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS perceived_exertion INTEGER CHECK (perceived_exertion BETWEEN 1 AND 10);

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS form_quality INTEGER CHECK (form_quality BETWEEN 1 AND 5);

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100) DEFAULT 100;

-- Modifications & Notes
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS modifications_made TEXT[];

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS difficulty_adjustment TEXT CHECK (difficulty_adjustment IN (
    'too_easy', 'just_right', 'too_hard', 'way_too_hard'
  ));

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS pain_or_discomfort BOOLEAN DEFAULT false;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS pain_location TEXT;

-- Media
-- Note: 'notes' column already exists in old schema

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Metadata
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS skipped BOOLEAN DEFAULT false;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS skip_reason TEXT;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS substituted_exercise_id UUID REFERENCES exercise_library(id);

-- Timestamps
-- Note: We'll rename logged_at to created_at for consistency
ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================================================
-- STEP 2: Migrate data from old columns to new columns
-- ============================================================================

-- Note: All columns already exist in the database, so no data migration needed
-- The old schema columns (logged_at, workout_id, reps, weight) were already removed
-- in previous migrations

-- ============================================================================
-- STEP 3: Create indexes for performance
-- ============================================================================

-- Drop old indexes if they exist (they reference old columns)
DROP INDEX IF EXISTS idx_exercise_logs_user;
DROP INDEX IF EXISTS idx_exercise_logs_workout_old;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout ON exercise_logs(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise ON exercise_logs(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_type ON exercise_logs(exercise_type);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_created ON exercise_logs(created_at DESC);

-- ============================================================================
-- STEP 4: Update RLS policies
-- ============================================================================

-- RLS policies already exist and are correctly configured
-- Skipping policy recreation to avoid conflicts

-- ============================================================================
-- STEP 5: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE public.exercise_logs IS
  'Detailed exercise-level tracking within workout sessions. Supports multiple exercise types (strength, cardio, flexibility, swimming, etc.) with type-specific data fields.';

COMMENT ON COLUMN public.exercise_logs.reps_per_set IS
  'Array of reps completed per set for strength exercises. Example: [12, 10, 10, 8]';

COMMENT ON COLUMN public.exercise_logs.weight_per_set IS
  'Array of weights used per set in pounds. Example: [135, 135, 145, 145]';

COMMENT ON COLUMN public.exercise_logs.rpe_per_set IS
  'Array of Rate of Perceived Exertion (1-10) per set. Example: [7, 8, 9, 9]';

COMMENT ON COLUMN public.exercise_logs.exercise_type IS
  'Type of exercise: strength, cardio, flexibility, bodyweight, plyometric, swimming, or sports';

-- ============================================================================
-- STEP 6: Verification
-- ============================================================================

DO $$
BEGIN
  -- Verify critical columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercise_logs'
    AND column_name = 'reps_per_set'
  ) THEN
    RAISE EXCEPTION 'Migration failed: reps_per_set column not added';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercise_logs'
    AND column_name = 'weight_per_set'
  ) THEN
    RAISE EXCEPTION 'Migration failed: weight_per_set column not added';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercise_logs'
    AND column_name = 'rpe_per_set'
  ) THEN
    RAISE EXCEPTION 'Migration failed: rpe_per_set column not added';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercise_logs'
    AND column_name = 'exercise_type'
  ) THEN
    RAISE EXCEPTION 'Migration failed: exercise_type column not added';
  END IF;

  RAISE NOTICE 'Migration completed successfully: All missing columns added to exercise_logs';
END $$;
