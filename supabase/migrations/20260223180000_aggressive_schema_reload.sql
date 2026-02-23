-- Force PostgREST to detect schema changes by temporarily adding/dropping a view
-- This is more aggressive than function changes and should trigger immediate cache invalidation

-- Step 1: Create a temporary view that references exercise_logs
CREATE OR REPLACE VIEW public.exercise_logs_cache_buster AS
SELECT
  id,
  workout_log_id,
  exercise_id,
  exercise_type,
  reps_per_set,
  weight_per_set,
  rpe_per_set,
  sets_completed,
  created_at
FROM public.exercise_logs;

-- Step 2: Grant access to the view
GRANT SELECT ON public.exercise_logs_cache_buster TO authenticated, anon;

-- Step 3: Add a comment to trigger change detection
COMMENT ON VIEW public.exercise_logs_cache_buster IS
  'Temporary view to force PostgREST schema cache reload - 2026-02-23 18:00:00';

-- Step 4: Immediately drop the view to force schema change detection
DROP VIEW IF EXISTS public.exercise_logs_cache_buster CASCADE;

-- Step 5: Send NOTIFY with reload schema signal
NOTIFY pgrst, 'reload schema';

-- Step 6: Also update table comment with new timestamp to ensure change detection
COMMENT ON TABLE public.exercise_logs IS
  'Exercise-level tracking for workouts. FORCED RELOAD 2026-02-23 18:00:00. Contains reps_per_set, weight_per_set, rpe_per_set, and all exercise type columns.';

-- Step 7: Recreate RLS policies to force schema awareness
-- (DROP and CREATE in same transaction forces PostgREST reload)
DROP POLICY IF EXISTS "Users can view their own exercise logs" ON public.exercise_logs;
CREATE POLICY "Users can view their own exercise logs"
ON public.exercise_logs
FOR SELECT
TO authenticated
USING (
  workout_log_id IN (
    SELECT id FROM workout_logs WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert their own exercise logs" ON public.exercise_logs;
CREATE POLICY "Users can insert their own exercise logs"
ON public.exercise_logs
FOR INSERT
TO authenticated
WITH CHECK (
  workout_log_id IN (
    SELECT id FROM workout_logs WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own exercise logs" ON public.exercise_logs;
CREATE POLICY "Users can update their own exercise logs"
ON public.exercise_logs
FOR UPDATE
TO authenticated
USING (
  workout_log_id IN (
    SELECT id FROM workout_logs WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own exercise logs" ON public.exercise_logs;
CREATE POLICY "Users can delete their own exercise logs"
ON public.exercise_logs
FOR DELETE
TO authenticated
USING (
  workout_log_id IN (
    SELECT id FROM workout_logs WHERE user_id = auth.uid()
  )
);

-- Ensure service role has full access
DROP POLICY IF EXISTS "Service role has full access to exercise logs" ON public.exercise_logs;
CREATE POLICY "Service role has full access to exercise logs"
ON public.exercise_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
