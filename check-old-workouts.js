require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function checkOldWorkouts() {
  console.log('🔍 Checking for old workout system...\n')
  
  // Try old 'workouts' table (singular)
  const { data: oldWorkouts, error } = await supabase
    .from('workouts')
    .select('*')
    .limit(5)
  
  if (error) {
    console.log('❌ Old "workouts" table:', error.message)
  } else {
    console.log('✅ Old "workouts" table: EXISTS with', oldWorkouts.length, 'records')
    if (oldWorkouts.length > 0) {
      console.log('\nFirst workout:')
      console.log(JSON.stringify(oldWorkouts[0], null, 2))
    }
  }
}

checkOldWorkouts().catch(console.error)
