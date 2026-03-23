require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function analyzeOldWorkouts() {
  console.log('🔍 Analyzing old workout data...\n')
  
  // Get completed workouts
  const { data: workouts, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('completed', true)
    .order('completed_at', { ascending: false })
  
  if (error) {
    console.log('❌ Error:', error.message)
    return
  }
  
  console.log('📊 Completed Workouts:', workouts.length)
  console.log('\n' + '='.repeat(60) + '\n')
  
  workouts.forEach((w, i) => {
    console.log('Workout', i + 1)
    console.log('  ID:', w.id)
    console.log('  Name:', w.workout_name)
    console.log('  Type:', w.workout_type)
    console.log('  Completed:', w.completed_at)
    console.log('  Duration:', w.duration_minutes, 'min')
    console.log('  Status:', w.status)
    console.log('')
  })
  
  // Check if there's any exercise data associated
  const { data: exercises } = await supabase
    .from('workout_exercises')
    .select('*')
    .limit(5)
  
  console.log('🏋️ workout_exercises table:', exercises ? 'EXISTS' : 'MISSING')
  if (exercises && exercises.length > 0) {
    console.log('  Sample:', exercises.length, 'exercises found')
  }
  
  // Check for exercise_sets
  const { data: sets } = await supabase
    .from('exercise_sets')
    .select('*')
    .limit(5)
  
  console.log('📝 exercise_sets table:', sets ? 'EXISTS' : 'MISSING')
  if (sets && sets.length > 0) {
    console.log('  Sample:', sets.length, 'sets found')
  }
}

analyzeOldWorkouts().catch(console.error)
