-- Force PostgREST schema cache reload by dropping and recreating a helper function
-- This triggers PostgREST to invalidate and reload its entire schema cache

-- Drop the helper function if it exists
DROP FUNCTION IF EXISTS public.force_schema_reload() CASCADE;

-- Create a simple helper function with current timestamp
CREATE OR REPLACE FUNCTION public.force_schema_reload()
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE SQL
STABLE
AS $$
  SELECT NOW();
$$;

COMMENT ON FUNCTION public.force_schema_reload() IS
  'Helper function to force PostgREST schema cache reload. Last updated: 2026-02-23 17:00:00 UTC';

-- Also update a table comment to ensure schema change is detected
COMMENT ON TABLE public.exercise_logs IS
  'Exercise-level tracking for workouts. Schema cache forced reload at 2026-02-23 17:00:00 UTC';
