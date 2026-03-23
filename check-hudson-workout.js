const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkHudsonWorkout() {
  const userId = '80c7444d-95ff-49f9-86a6-ad937bb92328' // Hudson's actual user ID

  // Get the latest active plan
  const { data: plan } = await supabase
    .from('user_workout_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('id', '794146fd-0380-44a0-8d45-aea950f7cc25')
    .single()

  console.log('\n=== HUDSON\'S WORKOUT PLAN ===')
  console.log('Plan Name:', plan.plan_name)
  console.log('Days Per Week:', plan.days_per_week)
  console.log('Workouts Per Week:', plan.workouts_per_week)

  // Get today's workout
  const { data: workouts } = await supabase
    .from('plan_workouts')
    .select(`
      *,
      plan_exercises (
        *,
        exercise:exercise_library (
          id,
          name,
          training_modality,
          equipment
        )
      )
    `)
    .eq('plan_id', plan.id)
    .eq('week_number', 1)
    .eq('day_of_week', 1)
    .limit(1)
    .single()

  console.log('\n=== TODAY\'S WORKOUT (Week 1, Day 1) ===')
  console.log('Workout Name:', workouts.workout_name)
  console.log('Exercises:', workouts.plan_exercises.length)

  workouts.plan_exercises.forEach((pe, i) => {
    console.log(`\n${i + 1}. ${pe.exercise.name}`)
    console.log(`   Modality: ${pe.exercise.training_modality}`)
    console.log(`   Equipment: ${pe.exercise.equipment?.join(', ') || 'None'}`)
    console.log(`   Sets: ${pe.target_sets}, Reps: ${pe.target_reps_min}-${pe.target_reps_max}`)
  })
}

checkHudsonWorkout().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
