require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkExerciseData() {
  console.log('🏋️ Checking exercise data structure...\n')
  
  // Get a recent completed workout
  const { data: workout } = await supabase
    .from('workouts')
    .select('*')
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()
  
  if (!workout) {
    console.log('No workouts found')
    return
  }
  
  console.log('📊 Sample Workout:')
  console.log('  ID:', workout.id)
  console.log('  Name:', workout.workout_name)
  console.log('  Completed:', workout.completed_at)
  console.log('')
  
  // Get exercises for this workout
  const { data: exercises } = await supabase
    .from('workout_exercises')
    .select('*')
    .eq('workout_id', workout.id)
    .limit(5)
  
  if (exercises && exercises.length > 0) {
    console.log('🏋️ Exercises for this workout:', exercises.length, 'found')
    console.log('\nSample exercise data:')
    console.log(JSON.stringify(exercises[0], null, 2))
  } else {
    console.log('❌ No exercises found for this workout')
  }
}

checkExerciseData().catch(console.error)
