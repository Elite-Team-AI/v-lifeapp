require('dotenv').config({ path: '.env.local' })

// This script applies the missing migration by constructing a direct database URL
// Supabase provides a direct Postgres connection via the pooler

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing environment variables')
  console.error('   Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Extract the project ref from the Supabase URL
// Format: https://[project-ref].supabase.co
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')

console.log('🔧 V-Life Fitness - Database Migration Tool\n')
console.log(`📦 Project: ${projectRef}`)
console.log('🎯 Target: Add planned_duration_minutes column to workout_logs\n')

console.log('━'.repeat(60))
console.log('OPTION 1: Supabase Dashboard (Recommended)')
console.log('━'.repeat(60))
console.log('\n1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
console.log('\n2. Paste and run this SQL:\n')

console.log('```sql')
console.log(`-- Add missing column for workout duration tracking
ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS planned_duration_minutes INTEGER
    CHECK (planned_duration_minutes > 0);

COMMENT ON COLUMN public.workout_logs.planned_duration_minutes IS
  'Planned workout duration in minutes (copied from plan_workouts.estimated_duration_minutes).';

-- Force PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the column was added
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workout_logs'
  AND column_name = 'planned_duration_minutes';
`)
console.log('```\n')

console.log('3. You should see the column details in the results')
console.log('4. The workout creation should now work!\n')

console.log('━'.repeat(60))
console.log('OPTION 2: Using Supabase CLI')
console.log('━'.repeat(60))
console.log('\nIf you have supabase CLI linked to your project:\n')
console.log('```bash')
console.log('cd "' + __dirname + '"')
console.log('supabase db push --linked')
console.log('```\n')

console.log('━'.repeat(60))
console.log('TROUBLESHOOTING')
console.log('━'.repeat(60))
console.log('\nIf the error persists after running the SQL:')
console.log('1. Wait 30 seconds for the cache to refresh')
console.log('2. Try starting a workout again')
console.log('3. If still failing, restart your Next.js dev server\n')

console.log('📚 Migration file location:')
console.log('   supabase/migrations/20260223120000_add_missing_workout_fields.sql\n')
