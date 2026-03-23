require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkAllExerciseData() {
  console.log('🔍 Checking ALL workout_exercises data...\n')

  // Get all workout_exercises
  const { data: allExercises, error } = await supabase
    .from('workout_exercises')
    .select('*')

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  console.log('📊 Total workout_exercises records:', allExercises ? allExercises.length : 0)

  if (!allExercises || allExercises.length === 0) {
    console.log('\n❌ No exercise data exists in workout_exercises table')
    console.log('   Migration from old system is NOT possible - no data to migrate')
    return
  }

  // Group by workout_id
  const workoutGroups = {}
  allExercises.forEach(ex => {
    if (!workoutGroups[ex.workout_id]) {
      workoutGroups[ex.workout_id] = []
    }
    workoutGroups[ex.workout_id].push(ex)
  })

  console.log('\n📋 Workouts with exercise data:', Object.keys(workoutGroups).length)
  console.log('\n' + '='.repeat(60))

  // Show sample data structure
  console.log('\n🔬 Sample exercise record structure:')
  console.log(JSON.stringify(allExercises[0], null, 2))

  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Exercise count per workout:')
  Object.entries(workoutGroups).forEach(([workoutId, exercises], i) => {
    if (i < 10) {  // Show first 10
      console.log(`  Workout ${workoutId.substring(0, 8)}...: ${exercises.length} exercises`)
    }
  })

  if (Object.keys(workoutGroups).length > 10) {
    console.log(`  ... and ${Object.keys(workoutGroups).length - 10} more workouts`)
  }
}

checkAllExerciseData().catch(console.error)
