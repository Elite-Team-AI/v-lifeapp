require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function verifyColumn() {
  console.log('🔍 Checking if planned_duration_minutes column exists...\n')

  // Try to select the column
  const { data, error } = await supabase
    .from('workout_logs')
    .select('id, planned_duration_minutes')
    .limit(1)

  if (error) {
    if (error.message.includes('planned_duration_minutes')) {
      console.log('❌ Column NOT found in schema cache')
      console.log('   Error:', error.message)
      console.log('\n📋 Next steps:')
      console.log('   1. The migration file exists but hasn\'t been applied yet')
      console.log('   2. Run the SQL from apply-migration-auto.js in Supabase Dashboard')
      console.log('   3. Or wait for PostgREST to refresh its schema cache (can take up to 30s)')
      return false
    } else {
      console.log('❌ Unexpected error:', error.message)
      return false
    }
  }

  console.log('✅ Column EXISTS in the database!')
  console.log('   The planned_duration_minutes column is present in workout_logs table')
  console.log('\n🎯 Next steps:')
  console.log('   1. Try starting a workout again')
  console.log('   2. If it still fails, restart your Next.js dev server')
  console.log('   3. The schema cache may need time to refresh')
  return true
}

verifyColumn().catch(console.error)
