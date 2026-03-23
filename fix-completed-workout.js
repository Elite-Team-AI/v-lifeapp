const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixCompletedWorkouts() {
  const userId = '80c7444d-95ff-49f9-86a6-ad937bb92328'
  const completedWorkoutId = '3bede388-1cdf-42cc-bc17-74a5e9132360' // Push Focus

  console.log('\n=== Fixing Completed Workout ===\n')

  // Update the plan_workouts table to mark this workout as completed
  const { data, error } = await supabase
    .from('plan_workouts')
    .update({
      is_completed: true,
      completion_percentage: 100
    })
    .eq('id', completedWorkoutId)
    .eq('user_id', userId)
    .select()

  if (error) {
    console.error('Error updating workout:', error)
    return
  }

  console.log('✅ Successfully marked workout as completed:')
  console.log(data)

  console.log('\n=== Verification ===\n')

  // Verify the fix
  const { data: verifyData } = await supabase
    .from('plan_workouts')
    .select('workout_name, is_completed, completed_date')
    .eq('id', completedWorkoutId)
    .single()

  console.log('Workout Status:', verifyData)

  // Check total completed count
  const { data: allWorkouts } = await supabase
    .from('plan_workouts')
    .select('id, workout_name, is_completed')
    .eq('user_id', userId)

  const completedCount = allWorkouts.filter(w => w.is_completed).length
  console.log(`\nTotal Completed: ${completedCount}/${allWorkouts.length}`)

  console.log('\n✅ Fix applied! Please refresh the fitness page to see updated progress.\n')
}

fixCompletedWorkouts().catch(console.error)
