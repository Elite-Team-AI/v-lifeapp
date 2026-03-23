-- Force Supabase PostgREST schema cache reload
-- This fixes the "difficulty_level column not found" error

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Force a schema cache refresh by making a minor change and reverting it
ALTER TABLE user_workout_plans ADD COLUMN IF NOT EXISTS temp_reload_column TEXT;
ALTER TABLE user_workout_plans DROP COLUMN IF EXISTS temp_reload_column;

-- Verify table structure (this query forces schema introspection)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_workout_plans'
ORDER BY ordinal_position;

-- Comment to document the fix
COMMENT ON TABLE user_workout_plans IS 'Workout plans for users - schema cache reloaded 2026-03-23';
