-- =====================================================
-- PERSONALIZED WORKOUT SYSTEM FOR V-LIFE
-- =====================================================
-- This migration creates the complete AI-powered personalized workout system
-- including exercise library, plan generation, comprehensive logging,
-- and performance tracking for adaptive regeneration.
--
-- Tables created:
-- 1. exercise_library - 300+ exercises with modality-specific configurations
-- 2. user_workout_plans - 4-week mesocycle plans
-- 3. plan_workouts - Individual workout days within plans
-- 4. plan_exercises - Exercises assigned to each workout
-- 5. workout_logs - Comprehensive workout completion tracking
-- 6. exercise_logs - Detailed exercise logging (all types)
-- 7. performance_metrics - Aggregated performance analysis
-- 8. exercise_pr_history - Personal records tracking
-- =====================================================

-- =====================================================
-- DROP EXISTING TABLES (clean slate)
-- =====================================================
DROP TABLE IF EXISTS exercise_pr_history CASCADE;
DROP TABLE IF EXISTS performance_metrics CASCADE;
DROP TABLE IF EXISTS exercise_logs CASCADE;
DROP TABLE IF EXISTS workout_logs CASCADE;
DROP TABLE IF EXISTS plan_exercises CASCADE;
DROP TABLE IF EXISTS plan_workouts CASCADE;
DROP TABLE IF EXISTS user_workout_plans CASCADE;
DROP TABLE IF EXISTS exercise_library CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS calculate_estimated_1rm(NUMERIC, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_workout_log_aggregates() CASCADE;
DROP FUNCTION IF EXISTS check_and_record_prs() CASCADE;

-- =====================================================
-- 1. EXERCISE LIBRARY (Modality-Based Exercise Database)
-- =====================================================
CREATE TABLE public.exercise_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  training_modality TEXT CHECK (training_modality IN (
    'strength',      -- Heavy weights, low reps (3-6 reps, 85-95% 1RM)
    'hypertrophy',   -- Muscle growth, moderate weight (8-12 reps, 70-80% 1RM)
    'endurance',     -- Muscular endurance, light weight (15-20 reps, 50-65% 1RM)
    'power',         -- Explosive movements (3-5 reps, 75-90% 1RM)
    'HIIT',          -- High-intensity interval training
    'mobility',      -- Flexibility and range of motion
    'functional',    -- Functional movement patterns
    'mind_body',     -- Yoga, tai chi, meditation
    'mixed'          -- General/mixed modalities
  )) NOT NULL,

  category TEXT CHECK (category IN (
    'strength', 'cardio', 'flexibility', 'sports', 'plyometric'
  )) NOT NULL,

  exercise_type TEXT CHECK (exercise_type IN (
    'compound', 'isolation', 'cardio', 'flexibility',
    'bodyweight', 'plyometric', 'swimming', 'sports'
  )) NOT NULL,

  -- Muscle targeting
  primary_muscles TEXT[] NOT NULL,
  secondary_muscles TEXT[],
  target_muscles TEXT[],

  -- Equipment
  equipment TEXT[],

  -- Difficulty & Safety
  difficulty TEXT CHECK (difficulty IN (
    'beginner', 'intermediate', 'advanced', 'expert'
  )) NOT NULL,
  risk_level TEXT CHECK (risk_level IN (
    'low', 'moderate', 'high'
  )) DEFAULT 'moderate',

  -- Modality-Specific Prescription Ranges
  -- These are the recommended ranges for THIS modality
  recommended_sets_min INTEGER,
  recommended_sets_max INTEGER,
  recommended_reps_min INTEGER,
  recommended_reps_max INTEGER,
  recommended_rest_seconds_min INTEGER,
  recommended_rest_seconds_max INTEGER,
  intensity_percentage_min INTEGER, -- % of 1RM
  intensity_percentage_max INTEGER,
  tempo TEXT, -- e.g., "3-1-1-0" = 3sec eccentric, 1sec pause, 1sec concentric, 0sec top
  recommended_rpe_min NUMERIC(3,1), -- Rate of Perceived Exertion 1-10
  recommended_rpe_max NUMERIC(3,1),

  -- Instructions & Form
  instructions TEXT,
  form_cues TEXT[],
  common_mistakes TEXT[],

  -- Media
  video_url TEXT,
  image_url TEXT,

  -- Progressions & Variations
  variations TEXT[],
  alternative_exercises UUID[], -- Array of other exercise IDs
  progression_exercises UUID[], -- Harder versions
  regression_exercises UUID[], -- Easier versions

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_unilateral BOOLEAN DEFAULT false, -- One side at a time
  requires_spotter BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique exercise per modality
  UNIQUE(name, training_modality)
);

-- Indexes for exercise_library
CREATE INDEX idx_exercise_library_modality ON exercise_library(training_modality);
CREATE INDEX idx_exercise_library_category ON exercise_library(category);
CREATE INDEX idx_exercise_library_difficulty ON exercise_library(difficulty);
CREATE INDEX idx_exercise_library_muscles ON exercise_library USING GIN(target_muscles);
CREATE INDEX idx_exercise_library_equipment ON exercise_library USING GIN(equipment);
CREATE INDEX idx_exercise_library_active ON exercise_library(is_active) WHERE is_active = true;
CREATE INDEX idx_exercise_library_name_search ON exercise_library USING GIN(to_tsvector('english', name));

-- RLS for exercise_library (public read access)
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active exercises"
  ON exercise_library FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage exercises"
  ON exercise_library FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- =====================================================
-- 2. USER WORKOUT PLANS (4-week mesocycles)
-- =====================================================
CREATE TABLE public.user_workout_plans (
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
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  weeks_duration INTEGER DEFAULT 4,

  -- Configuration
  days_per_week INTEGER CHECK (days_per_week BETWEEN 3 AND 7) NOT NULL,
  workout_duration_minutes INTEGER CHECK (workout_duration_minutes BETWEEN 20 AND 120),

  -- Split pattern (e.g., "3-1-2-1" for 3 on, 1 off, 2 on, 1 off)
  split_pattern TEXT,

  -- User preferences at time of generation
  preferred_exercises JSONB, -- Exercise IDs they enjoy
  avoided_exercises JSONB, -- Exercise IDs to avoid
  available_equipment TEXT[],
  workout_location TEXT,

  -- Performance baseline
  baseline_metrics JSONB, -- Starting strength/cardio levels

  -- Status
  status TEXT CHECK (status IN (
    'active',
    'completed',
    'paused',
    'archived'
  )) DEFAULT 'active',

  -- AI generation metadata
  ai_model_version TEXT,
  generation_prompt TEXT,
  generation_parameters JSONB,

  -- Mesocycle structure
  mesocycle_week INTEGER CHECK (mesocycle_week BETWEEN 1 AND 4), -- Which week in the cycle
  is_deload_week BOOLEAN DEFAULT false,

  -- Previous plan reference (for progression tracking)
  previous_plan_id UUID REFERENCES user_workout_plans(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_workout_plans
CREATE INDEX idx_user_workout_plans_user ON user_workout_plans(user_id);
CREATE INDEX idx_user_workout_plans_dates ON user_workout_plans(user_id, start_date DESC, end_date DESC);
CREATE INDEX idx_user_workout_plans_status ON user_workout_plans(user_id, status);
CREATE INDEX idx_user_workout_plans_active ON user_workout_plans(user_id, status) WHERE status = 'active';

-- RLS for user_workout_plans
ALTER TABLE user_workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout plans"
  ON user_workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout plans"
  ON user_workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout plans"
  ON user_workout_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout plans"
  ON user_workout_plans FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. PLAN WORKOUTS (Individual workout sessions)
-- =====================================================
CREATE TABLE public.plan_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES user_workout_plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Workout details
  workout_name TEXT NOT NULL, -- "Push Day A", "Leg Day", etc.
  workout_type TEXT CHECK (workout_type IN (
    'push',
    'pull',
    'legs',
    'upper',
    'lower',
    'full_body',
    'cardio',
    'mixed'
  )) NOT NULL,

  -- Scheduling
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  week_number INTEGER CHECK (week_number BETWEEN 1 AND 4) NOT NULL,
  scheduled_date DATE,

  -- Workout parameters
  estimated_duration_minutes INTEGER,
  target_volume_sets INTEGER, -- Total sets planned
  intensity_level TEXT CHECK (intensity_level IN ('light', 'moderate', 'heavy', 'very_heavy')),

  -- Focus areas
  muscle_groups TEXT[], -- ["chest", "shoulders", "triceps"]
  workout_goals TEXT[], -- ["strength", "hypertrophy", "endurance"]

  -- Status
  is_rest_day BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100),

  -- Notes
  workout_description TEXT,
  coach_notes TEXT, -- AI-generated tips for this workout

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for plan_workouts
CREATE INDEX idx_plan_workouts_plan ON plan_workouts(plan_id);
CREATE INDEX idx_plan_workouts_user ON plan_workouts(user_id);
CREATE INDEX idx_plan_workouts_schedule ON plan_workouts(user_id, scheduled_date);
CREATE INDEX idx_plan_workouts_week ON plan_workouts(plan_id, week_number);

-- RLS for plan_workouts
ALTER TABLE plan_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plan workouts"
  ON plan_workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plan workouts"
  ON plan_workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan workouts"
  ON plan_workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plan workouts"
  ON plan_workouts FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. PLAN EXERCISES (Exercises within workouts)
-- =====================================================
CREATE TABLE public.plan_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES plan_workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercise_library(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Exercise ordering
  exercise_order INTEGER NOT NULL, -- 1, 2, 3, etc.
  superset_group INTEGER, -- Group exercises into supersets (1, 2, etc.)

  -- Prescription for STRENGTH exercises
  target_sets INTEGER,
  target_reps_min INTEGER,
  target_reps_max INTEGER,
  target_weight_lbs NUMERIC(6,2),
  rest_seconds INTEGER,
  tempo TEXT, -- "3-1-1-0" format
  target_rpe INTEGER CHECK (target_rpe BETWEEN 1 AND 10), -- Rate of Perceived Exertion

  -- Prescription for CARDIO exercises
  target_duration_minutes INTEGER,
  target_distance_miles NUMERIC(6,2),
  target_pace_per_mile_seconds INTEGER,
  target_heart_rate_zone TEXT CHECK (target_heart_rate_zone IN ('zone1', 'zone2', 'zone3', 'zone4', 'zone5')),

  -- Prescription for SWIMMING
  target_laps INTEGER,
  target_swim_stroke TEXT CHECK (target_swim_stroke IN ('freestyle', 'backstroke', 'breaststroke', 'butterfly', 'mixed')),

  -- Prescription for FLEXIBILITY/YOGA
  target_hold_duration_seconds INTEGER,
  target_holds_per_position INTEGER,

  -- Progressive overload tracking
  previous_week_weight NUMERIC(6,2),
  previous_week_reps INTEGER,
  progression_type TEXT CHECK (progression_type IN (
    'weight',      -- Increase weight
    'reps',        -- Increase reps
    'sets',        -- Increase sets
    'tempo',       -- Slower tempo
    'rest',        -- Shorter rest
    'maintain'     -- Keep same (deload week)
  )),

  -- Alternative exercises
  alternative_exercise_ids UUID[], -- Backup options if primary not available

  -- Instructions
  exercise_notes TEXT, -- Specific cues for this workout
  form_focus TEXT, -- "Focus on full ROM", "Squeeze at top"

  -- Status
  is_optional BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for plan_exercises
CREATE INDEX idx_plan_exercises_workout ON plan_exercises(workout_id, exercise_order);
CREATE INDEX idx_plan_exercises_exercise ON plan_exercises(exercise_id);
CREATE INDEX idx_plan_exercises_user ON plan_exercises(user_id);

-- RLS for plan_exercises
ALTER TABLE plan_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plan exercises"
  ON plan_exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plan exercises"
  ON plan_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan exercises"
  ON plan_exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plan exercises"
  ON plan_exercises FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. WORKOUT LOGS (Comprehensive session tracking)
-- =====================================================
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES user_workout_plans(id) ON DELETE SET NULL,
  workout_id UUID REFERENCES plan_workouts(id) ON DELETE SET NULL,

  -- Completion details
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  actual_duration_minutes INTEGER,

  -- Performance tracking
  perceived_difficulty INTEGER CHECK (perceived_difficulty BETWEEN 1 AND 10),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  enjoyment_rating INTEGER CHECK (enjoyment_rating BETWEEN 1 AND 5),

  -- Completion metrics
  exercises_planned INTEGER,
  exercises_completed INTEGER,
  exercises_skipped INTEGER,
  exercises_modified INTEGER,

  -- Volume tracking (for strength workouts)
  total_volume_lbs NUMERIC(10,2), -- Total weight lifted (sets × reps × weight)
  total_reps INTEGER,
  total_sets INTEGER,

  -- Cardio tracking
  total_distance_miles NUMERIC(6,2),
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  calories_burned INTEGER,

  -- Status
  completion_status TEXT CHECK (completion_status IN (
    'completed',
    'partially_completed',
    'skipped',
    'in_progress'
  )) DEFAULT 'in_progress',

  -- User feedback
  notes TEXT,
  felt_good BOOLEAN,
  want_more_like_this BOOLEAN,

  -- Environmental factors
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  stress_today INTEGER CHECK (stress_today BETWEEN 1 AND 10),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for workout_logs
CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, workout_date DESC);
CREATE INDEX idx_workout_logs_plan ON workout_logs(plan_id);
CREATE INDEX idx_workout_logs_status ON workout_logs(user_id, completion_status);
CREATE INDEX idx_workout_logs_date_range ON workout_logs(user_id, workout_date DESC, completion_status);

-- RLS for workout_logs
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout logs"
  ON workout_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout logs"
  ON workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs"
  ON workout_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs"
  ON workout_logs FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. EXERCISE LOGS (Detailed exercise-level tracking)
-- =====================================================
CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercise_library(id) ON DELETE CASCADE NOT NULL,
  plan_exercise_id UUID REFERENCES plan_exercises(id) ON DELETE SET NULL,

  -- Exercise type
  exercise_type TEXT CHECK (exercise_type IN (
    'strength',           -- Weight training
    'cardio',            -- Running, cycling, etc.
    'flexibility',       -- Stretching, yoga
    'bodyweight',        -- Calisthenics
    'plyometric',        -- Jump training
    'swimming',          -- Swimming specific
    'sports'             -- General sports activity
  )) NOT NULL,

  -- ===== STRENGTH TRAINING DATA =====
  sets_planned INTEGER,
  sets_completed INTEGER,
  reps_per_set INTEGER[], -- [12, 10, 10, 8] - actual reps per set
  weight_per_set NUMERIC(6,2)[], -- [135, 135, 145, 145] - weight used per set
  rpe_per_set INTEGER[], -- [7, 8, 9, 9] - Rate of Perceived Exertion 1-10
  rest_seconds_actual INTEGER[],

  -- Tempo tracking (optional)
  tempo TEXT, -- "3-1-1-0" = 3sec eccentric, 1sec pause, 1sec concentric, 0sec top

  -- ===== CARDIO DATA =====
  duration_seconds INTEGER,
  distance_miles NUMERIC(6,2),
  distance_meters NUMERIC(8,2),
  pace_per_mile_seconds INTEGER, -- For running (seconds per mile)
  pace_per_100m_seconds INTEGER, -- For swimming (seconds per 100m)
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  elevation_gain_feet INTEGER,

  -- Intervals (for HIIT cardio)
  intervals_completed INTEGER,
  work_interval_seconds INTEGER,
  rest_interval_seconds INTEGER,

  -- ===== SWIMMING SPECIFIC =====
  swim_stroke TEXT CHECK (swim_stroke IN (
    'freestyle', 'backstroke', 'breaststroke', 'butterfly', 'mixed'
  )),
  laps_completed INTEGER,
  pool_length_meters INTEGER,

  -- ===== FLEXIBILITY/YOGA =====
  holds_per_position INTEGER[], -- How many holds per stretch
  hold_duration_seconds INTEGER[], -- Duration of each hold

  -- ===== UNIVERSAL METRICS =====
  perceived_exertion INTEGER CHECK (perceived_exertion BETWEEN 1 AND 10),
  form_quality INTEGER CHECK (form_quality BETWEEN 1 AND 5),
  completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100) DEFAULT 100,

  -- Modifications & Notes
  modifications_made TEXT[], -- ["Used resistance band", "Reduced weight"]
  difficulty_adjustment TEXT CHECK (difficulty_adjustment IN (
    'too_easy', 'just_right', 'too_hard', 'way_too_hard'
  )),
  pain_or_discomfort BOOLEAN DEFAULT false,
  pain_location TEXT, -- "lower back", "left shoulder"

  -- Media
  notes TEXT,
  video_url TEXT, -- Form check video

  -- Metadata
  skipped BOOLEAN DEFAULT false,
  skip_reason TEXT,
  substituted_exercise_id UUID REFERENCES exercise_library(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for exercise_logs
CREATE INDEX idx_exercise_logs_workout ON exercise_logs(workout_log_id);
CREATE INDEX idx_exercise_logs_exercise ON exercise_logs(exercise_id);
CREATE INDEX idx_exercise_logs_type ON exercise_logs(exercise_type);
CREATE INDEX idx_exercise_logs_created ON exercise_logs(created_at DESC);

-- RLS for exercise_logs
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exercise logs"
  ON exercise_logs FOR SELECT
  USING (
    auth.uid() = (
      SELECT user_id FROM workout_logs
      WHERE workout_logs.id = exercise_logs.workout_log_id
    )
  );

CREATE POLICY "Users can create their own exercise logs"
  ON exercise_logs FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM workout_logs
      WHERE workout_logs.id = exercise_logs.workout_log_id
    )
  );

CREATE POLICY "Users can update their own exercise logs"
  ON exercise_logs FOR UPDATE
  USING (
    auth.uid() = (
      SELECT user_id FROM workout_logs
      WHERE workout_logs.id = exercise_logs.workout_log_id
    )
  );

CREATE POLICY "Users can delete their own exercise logs"
  ON exercise_logs FOR DELETE
  USING (
    auth.uid() = (
      SELECT user_id FROM workout_logs
      WHERE workout_logs.id = exercise_logs.workout_log_id
    )
  );

-- =====================================================
-- 7. PERFORMANCE METRICS (Aggregated tracking)
-- =====================================================
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Time period
  metric_period TEXT CHECK (metric_period IN ('week', 'month', 'mesocycle')) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Adherence metrics
  workouts_planned INTEGER NOT NULL,
  workouts_completed INTEGER NOT NULL,
  adherence_rate NUMERIC(5,2), -- Percentage

  -- Volume metrics
  total_volume_lbs NUMERIC(12,2),
  avg_volume_per_workout NUMERIC(10,2),
  volume_increase_vs_previous NUMERIC(6,2), -- Percentage

  -- Strength metrics
  one_rep_max_estimates JSONB, -- {"bench_press": 225, "squat": 315}
  strength_increase_vs_previous NUMERIC(6,2),

  -- Cardio metrics
  total_distance_miles NUMERIC(8,2),
  avg_pace_seconds NUMERIC(6,2),
  cardio_improvement_vs_previous NUMERIC(6,2),

  -- Consistency metrics
  workouts_per_week NUMERIC(3,1),
  longest_streak_days INTEGER,

  -- Subjective metrics
  avg_energy_level NUMERIC(3,1),
  avg_enjoyment NUMERIC(3,1),
  avg_perceived_difficulty NUMERIC(3,1),

  -- Recovery metrics
  avg_sleep_quality NUMERIC(3,1),
  avg_stress_level NUMERIC(3,1),

  -- Recommendations for next period
  recommended_volume_adjustment NUMERIC(6,2), -- +10%, -5%, etc.
  recommended_intensity_adjustment TEXT,
  needs_deload BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance_metrics
CREATE INDEX idx_performance_metrics_user_period ON performance_metrics(user_id, period_start DESC);
CREATE UNIQUE INDEX idx_performance_metrics_unique ON performance_metrics(user_id, metric_period, period_start);

-- RLS for performance_metrics
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own performance metrics"
  ON performance_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own performance metrics"
  ON performance_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own performance metrics"
  ON performance_metrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own performance metrics"
  ON performance_metrics FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 8. EXERCISE PR HISTORY (Personal Records)
-- =====================================================
CREATE TABLE public.exercise_pr_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercise_library(id) ON DELETE CASCADE NOT NULL,
  exercise_log_id UUID REFERENCES exercise_logs(id) ON DELETE SET NULL,

  -- PR Type
  pr_type TEXT CHECK (pr_type IN (
    'max_weight',        -- Heaviest weight for any rep count
    '1rm_estimated',     -- Estimated 1 rep max
    'max_reps',          -- Most reps at bodyweight or specific weight
    'max_distance',      -- Longest distance
    'fastest_time',      -- Fastest time for distance
    'longest_hold'       -- Longest static hold
  )) NOT NULL,

  -- PR Data
  weight_lbs NUMERIC(6,2),
  reps INTEGER,
  distance_miles NUMERIC(6,2),
  time_seconds INTEGER,

  -- Context
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,

  -- Previous PR (for comparison)
  previous_pr_value NUMERIC(10,2),
  improvement_percentage NUMERIC(6,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for exercise_pr_history
CREATE INDEX idx_exercise_pr_user_exercise ON exercise_pr_history(user_id, exercise_id, pr_type);
CREATE INDEX idx_exercise_pr_date ON exercise_pr_history(user_id, achieved_at DESC);

-- RLS for exercise_pr_history
ALTER TABLE exercise_pr_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own PR history"
  ON exercise_pr_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own PR history"
  ON exercise_pr_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PR history"
  ON exercise_pr_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PR history"
  ON exercise_pr_history FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate estimated 1RM using Epley formula
CREATE OR REPLACE FUNCTION calculate_estimated_1rm(weight NUMERIC, reps INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  IF reps = 1 THEN
    RETURN weight;
  ELSIF reps > 1 AND reps <= 10 THEN
    RETURN ROUND(weight * (1 + reps / 30.0), 2);
  ELSE
    RETURN NULL; -- Formula not accurate for >10 reps
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update workout_logs aggregates when exercise_logs are inserted
CREATE OR REPLACE FUNCTION update_workout_log_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workout_logs
  SET
    total_volume_lbs = (
      SELECT COALESCE(SUM(
        CASE
          WHEN e.exercise_type = 'strength' THEN
            (SELECT SUM(w * r)
             FROM unnest(e.weight_per_set) WITH ORDINALITY AS w(w, i)
             JOIN unnest(e.reps_per_set) WITH ORDINALITY AS r(r, i) ON w.i = r.i)
          ELSE 0
        END
      ), 0)
      FROM exercise_logs e
      WHERE e.workout_log_id = NEW.workout_log_id
    ),
    total_reps = (
      SELECT COALESCE(SUM(
        CASE
          WHEN e.exercise_type = 'strength' THEN
            (SELECT SUM(r) FROM unnest(e.reps_per_set) AS r)
          ELSE 0
        END
      ), 0)
      FROM exercise_logs e
      WHERE e.workout_log_id = NEW.workout_log_id
    ),
    total_sets = (
      SELECT COALESCE(SUM(e.sets_completed), 0)
      FROM exercise_logs e
      WHERE e.workout_log_id = NEW.workout_log_id
      AND e.exercise_type = 'strength'
    ),
    total_distance_miles = (
      SELECT COALESCE(SUM(e.distance_miles), 0)
      FROM exercise_logs e
      WHERE e.workout_log_id = NEW.workout_log_id
      AND e.exercise_type IN ('cardio', 'swimming')
    ),
    updated_at = NOW()
  WHERE id = NEW.workout_log_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update workout_logs when exercise_logs are inserted/updated
CREATE TRIGGER trigger_update_workout_log_aggregates
  AFTER INSERT OR UPDATE ON exercise_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_log_aggregates();

-- Function to automatically detect and record new PRs
CREATE OR REPLACE FUNCTION check_and_record_prs()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_max_weight NUMERIC;
  v_estimated_1rm NUMERIC;
  v_max_distance NUMERIC;
  v_fastest_time INTEGER;
  v_previous_pr NUMERIC;
BEGIN
  -- Get user_id from workout_log
  SELECT user_id INTO v_user_id
  FROM workout_logs
  WHERE id = NEW.workout_log_id;

  -- Check for strength PRs
  IF NEW.exercise_type = 'strength' AND NEW.weight_per_set IS NOT NULL AND array_length(NEW.weight_per_set, 1) > 0 THEN
    -- Max weight PR
    v_max_weight := (SELECT MAX(w) FROM unnest(NEW.weight_per_set) AS w);

    SELECT weight_lbs INTO v_previous_pr
    FROM exercise_pr_history
    WHERE user_id = v_user_id
      AND exercise_id = NEW.exercise_id
      AND pr_type = 'max_weight'
    ORDER BY weight_lbs DESC
    LIMIT 1;

    IF v_previous_pr IS NULL OR v_max_weight > v_previous_pr THEN
      INSERT INTO exercise_pr_history (
        user_id, exercise_id, exercise_log_id, pr_type,
        weight_lbs, reps, previous_pr_value,
        improvement_percentage
      ) VALUES (
        v_user_id, NEW.exercise_id, NEW.id, 'max_weight',
        v_max_weight,
        (SELECT reps_per_set[array_position(weight_per_set, v_max_weight)]),
        v_previous_pr,
        CASE WHEN v_previous_pr IS NOT NULL
          THEN ROUND(((v_max_weight - v_previous_pr) / v_previous_pr * 100), 2)
          ELSE NULL
        END
      );
    END IF;
  END IF;

  -- Check for cardio distance PRs
  IF NEW.exercise_type IN ('cardio', 'swimming') AND NEW.distance_miles IS NOT NULL THEN
    SELECT distance_miles INTO v_previous_pr
    FROM exercise_pr_history
    WHERE user_id = v_user_id
      AND exercise_id = NEW.exercise_id
      AND pr_type = 'max_distance'
    ORDER BY distance_miles DESC
    LIMIT 1;

    IF v_previous_pr IS NULL OR NEW.distance_miles > v_previous_pr THEN
      INSERT INTO exercise_pr_history (
        user_id, exercise_id, exercise_log_id, pr_type,
        distance_miles, time_seconds, previous_pr_value,
        improvement_percentage
      ) VALUES (
        v_user_id, NEW.exercise_id, NEW.id, 'max_distance',
        NEW.distance_miles, NEW.duration_seconds, v_previous_pr,
        CASE WHEN v_previous_pr IS NOT NULL
          THEN ROUND(((NEW.distance_miles - v_previous_pr) / v_previous_pr * 100), 2)
          ELSE NULL
        END
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically check for PRs
CREATE TRIGGER trigger_check_prs
  AFTER INSERT ON exercise_logs
  FOR EACH ROW
  EXECUTE FUNCTION check_and_record_prs();

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant usage on all tables to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE exercise_library IS 'Comprehensive exercise database with 300+ exercises configured for specific training modalities';
COMMENT ON TABLE user_workout_plans IS 'Stores 4-week mesocycle workout plans generated for users';
COMMENT ON TABLE plan_workouts IS 'Individual workout sessions within a mesocycle plan';
COMMENT ON TABLE plan_exercises IS 'Specific exercises prescribed for each workout with sets/reps/weight targets';
COMMENT ON TABLE workout_logs IS 'Comprehensive tracking of completed workout sessions with aggregate metrics';
COMMENT ON TABLE exercise_logs IS 'Detailed logging of individual exercises supporting all types (strength, cardio, swimming, etc.)';
COMMENT ON TABLE performance_metrics IS 'Aggregated performance analysis for weekly/monthly periods used for adaptive plan regeneration';
COMMENT ON TABLE exercise_pr_history IS 'Personal records tracking for strength, distance, and time-based achievements';

COMMENT ON FUNCTION calculate_estimated_1rm IS 'Calculates estimated 1-rep max using the Epley formula';
COMMENT ON FUNCTION update_workout_log_aggregates IS 'Automatically aggregates exercise data to workout_logs summary';
COMMENT ON FUNCTION check_and_record_prs IS 'Automatically detects and records new personal records when exercises are logged';
