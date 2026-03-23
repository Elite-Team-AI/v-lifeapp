const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAllPlans() {
  const userId = 'a8ab0b4a-6ca6-4999-9ffd-64fc421f9fe0'

  const { data: plans, error } = await supabase
    .from('user_workout_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`\n=== ALL WORKOUT PLANS (Last 5) ===`)
  console.log(`Total plans found: ${plans.length}\n`)

  plans.forEach((plan, i) => {
    console.log(`${i+1}. ${plan.plan_name}`)
    console.log(`   ID: ${plan.id}`)
    console.log(`   Status: ${plan.status}`)
    console.log(`   Days/Week: ${plan.days_per_week}`)
    console.log(`   Workouts/Week: ${plan.workouts_per_week}`)
    console.log(`   Start: ${plan.start_date}`)
    console.log(`   End: ${plan.end_date}`)
    console.log(`   Created: ${plan.created_at}`)
    console.log(`   AI Model: ${plan.ai_model_version || 'N/A'}`)
    console.log('')
  })

  if (plans.length > 0) {
    const latestPlan = plans[0]
    const { data: workouts } = await supabase
      .from('plan_workouts')
      .select(`
        *,
        plan_exercises (
          *,
          exercise:exercise_library (name, training_modality)
        )
      `)
      .eq('plan_id', latestPlan.id)
      .order('week_number', { ascending: true })
      .order('day_of_week', { ascending: true })
      .limit(2)

    console.log(`=== LATEST PLAN WORKOUTS ===`)
    workouts.forEach((w, i) => {
      console.log(`\n${i+1}. ${w.workout_name} (Week ${w.week_number}, Day ${w.day_of_week})`)
      console.log(`   Exercises:`)
      w.plan_exercises.forEach((pe, j) => {
        console.log(`     ${j+1}. ${pe.exercise.name} (${pe.exercise.training_modality})`)
      })
    })
  }
}

checkAllPlans().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
