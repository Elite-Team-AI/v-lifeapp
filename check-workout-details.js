const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkWorkoutDetails() {
  const userId = 'a8ab0b4a-6ca6-4999-9ffd-64fc421f9fe0'

  // Get the latest active plan
  const { data: plan, error: planError } = await supabase
    .from('user_workout_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (planError || !plan) {
    console.log('No active plan found')
    return
  }

  console.log('\n=== ACTIVE WORKOUT PLAN ===')
  console.log('Plan Name:', plan.plan_name)
  console.log('Plan ID:', plan.id)
  console.log('Days Per Week:', plan.days_per_week)
  console.log('Workouts Per Week:', plan.workouts_per_week)
  console.log('Training Style:', plan.plan_type)
  console.log('Status:', plan.status)
  console.log('Created:', plan.created_at)

  // Get all workouts for this plan with exercises
  const { data: workouts, error: workoutsError } = await supabase
    .from('plan_workouts')
    .select(`
      *,
      plan_exercises (
        *,
        exercise:exercise_library (
          id,
          name,
          category,
          training_modality,
          equipment
        )
      )
    `)
    .eq('plan_id', plan.id)
    .order('week_number', { ascending: true })
    .order('day_of_week', { ascending: true })

  console.log('\n=== WORKOUTS IN PLAN ===')
  console.log('Total Workouts:', workouts?.length || 0)

  if (workouts && workouts.length > 0) {
    workouts.slice(0, 3).forEach((workout, i) => {
      console.log(`\n${i + 1}. ${workout.workout_name}`)
      console.log(`   Week: ${workout.week_number}, Day: ${workout.day_of_week}`)
      console.log(`   Type: ${workout.workout_type}`)
      console.log(`   Duration: ${workout.estimated_duration_minutes} min`)
      console.log(`   Exercises: ${workout.plan_exercises?.length || 0}`)

      if (workout.plan_exercises && workout.plan_exercises.length > 0) {
        workout.plan_exercises.slice(0, 5).forEach((pe, j) => {
          console.log(`     ${j + 1}. ${pe.exercise?.name || 'Unknown'}`)
          console.log(`        Sets: ${pe.target_sets}, Reps: ${pe.target_reps_min}-${pe.target_reps_max}`)
          console.log(`        Modality: ${pe.exercise?.training_modality || 'Unknown'}`)
          console.log(`        Equipment: ${pe.exercise?.equipment?.join(', ') || 'None'}`)
        })
      } else {
        console.log('     ⚠️ NO EXERCISES FOUND!')
      }
    })
  } else {
    console.log('⚠️ NO WORKOUTS FOUND IN PLAN!')
  }
}

checkWorkoutDetails().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
