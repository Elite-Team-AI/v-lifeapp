require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function fixWorkoutLogsTable() {
  console.log('🔧 Fixing workout_logs table schema...\n')

  // First, let's check if the column already exists
  console.log('1️⃣ Checking current schema...')
  const { data: testData, error: testError } = await supabase
    .from('workout_logs')
    .select('id, planned_duration_minutes')
    .limit(1)

  if (!testError) {
    console.log('✅ Column already exists! No migration needed.')
    return
  }

  if (testError && !testError.message.includes('planned_duration_minutes')) {
    console.log('❌ Unexpected error:', testError.message)
    return
  }

  console.log('⚠️  Column not found, proceeding with migration...\n')

  // The issue is that we need to use SQL to alter the table
  // Since Supabase doesn't have a direct way to execute DDL via the client,
  // we need to use the SQL Editor in the Supabase dashboard

  console.log('📋 MANUAL MIGRATION REQUIRED:')
  console.log('   Please run the following SQL in your Supabase SQL Editor:')
  console.log('   (Dashboard → SQL Editor → New Query)\n')
  console.log('---SQL START---')
  console.log(`
-- Add planned_duration_minutes column to workout_logs
ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS planned_duration_minutes INTEGER
    CHECK (planned_duration_minutes > 0);

COMMENT ON COLUMN public.workout_logs.planned_duration_minutes IS
  'Planned workout duration in minutes (copied from plan_workouts.estimated_duration_minutes). Used to calculate duration compliance rate in performance analysis.';

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'workout_logs'
  AND column_name = 'planned_duration_minutes';
`)
  console.log('---SQL END---\n')

  console.log('After running this SQL, refresh the schema cache by running:')
  console.log('   SELECT pg_notify(\'pgrst\', \'reload schema\');\n')

  console.log('OR use the alternative automated fix below:\n')
}

fixWorkoutLogsTable().catch(console.error)
