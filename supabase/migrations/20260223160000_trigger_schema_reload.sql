-- Trigger PostgREST schema cache reload
-- This migration forces Supabase to reload its PostgREST schema cache
-- by making a minimal schema change

-- Add a harmless comment to trigger schema reload
COMMENT ON TABLE public.exercise_logs IS
  'Exercise-level tracking for workouts. Updated 2026-02-23 to force schema cache reload.';

-- Send NOTIFY signal to PostgREST
NOTIFY pgrst, 'reload schema';
