require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkCurrentLogs() {
  console.log('🔍 Checking current exercise_logs table...\n')

  // Check current exercise_logs (new system)
  const { data: newLogs, error: newError } = await supabase
    .from('exercise_logs')
    .select('*')
    .limit(5)

  if (newError) {
    console.log('❌ Error querying exercise_logs:', newError.message)
    return
  }

  console.log('📊 exercise_logs table (new system):', newLogs ? newLogs.length : 0, 'records')

  if (newLogs && newLogs.length > 0) {
    console.log('\n🔬 Sample record:')
    console.log(JSON.stringify(newLogs[0], null, 2))
  } else {
    console.log('   No records found - table is empty!')
  }

  // Check workout_logs
  const { data: workoutLogs } = await supabase
    .from('workout_logs')
    .select('*')
    .limit(5)

  console.log('\n📋 workout_logs table:', workoutLogs ? workoutLogs.length : 0, 'records')
}

checkCurrentLogs().catch(console.error)
