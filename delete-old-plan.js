require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function deleteOldPlan() {
  console.log('🗑️  Deleting old workout plan...\n')

  // Get the old plan ID from the screenshot
  const oldPlanId = '7eb9439e-983f-4d1b-a852-571ac52be231'

  // First, get all workout IDs for this plan
  const { data: workouts, error: fetchError } = await supabase
    .from('plan_workouts')
    .select('id')
    .eq('plan_id', oldPlanId)

  if (fetchError) {
    console.log('⚠️  Error fetching workouts:', fetchError.message)
  }

  // Delete plan_exercises for each workout
  if (workouts && workouts.length > 0) {
    const workoutIds = workouts.map(w => w.id)
    const { error: exercisesError } = await supabase
      .from('plan_exercises')
      .delete()
      .in('workout_id', workoutIds)

    if (exercisesError) {
      console.log('⚠️  Error deleting plan_exercises:', exercisesError.message)
    } else {
      console.log('✅ Deleted plan_exercises')
    }
  }

  // Delete all plan_workouts for this plan
  const { error: workoutsError } = await supabase
    .from('plan_workouts')
    .delete()
    .eq('plan_id', oldPlanId)

  if (workoutsError) {
    console.log('⚠️  Error deleting plan_workouts:', workoutsError.message)
  } else {
    console.log('✅ Deleted plan_workouts')
  }

  // Delete the plan itself
  const { error: planError } = await supabase
    .from('user_workout_plans')
    .delete()
    .eq('id', oldPlanId)

  if (planError) {
    console.log('❌ Error deleting plan:', planError.message)
    return
  }

  console.log('✅ Old workout plan deleted successfully!\n')
  console.log('📋 Next steps:')
  console.log('   1. Refresh your Fitness page')
  console.log('   2. Click "Generate New Plan"')
  console.log('   3. The new plan will have 7-9 exercises per workout!')
}

deleteOldPlan().catch(console.error)
