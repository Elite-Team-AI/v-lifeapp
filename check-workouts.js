require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkWorkouts() {
  console.log('🔍 Checking Workout Data...\n')
  
  const { data: workouts, error } = await supabase
    .from('workout_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.log('❌ Error:', error.message)
  } else {
    console.log('💪 Workout Logs:', workouts?.length || 0, 'found\n')
    if (workouts && workouts.length > 0) {
      workouts.forEach((w, idx) => {
        console.log('  Workout', idx + 1, ':')
        console.log('    ID:', w.id)
        console.log('    Status:', w.status)
        console.log('    Completed:', w.completed_at)
        console.log('')
      })
    }
  }
}

checkWorkouts().catch(console.error)
