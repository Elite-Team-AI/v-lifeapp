const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProfile() {
  // Get the most recent user (assuming it's you)
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)

  if (profileError) {
    console.error('Profile error:', profileError)
    return
  }

  const profile = profiles[0]
  console.log('\n=== USER PROFILE ===')
  console.log('User ID:', profile.id)
  console.log('Name:', profile.name)
  console.log('Training Style:', profile.training_style)
  console.log('Weekly Workout Goal:', profile.weekly_workout_goal)
  console.log('Training Days Per Week:', profile.training_days_per_week)
  console.log('Available Equipment:', profile.available_equipment)
  console.log('Experience Level:', profile.experience_level)

  // Get active workout plan
  const { data: plans, error: planError } = await supabase
    .from('user_workout_plans')
    .select('*')
    .eq('user_id', profile.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)

  if (planError) {
    console.error('Plan error:', planError)
    return
  }

  if (plans.length > 0) {
    const plan = plans[0]
    console.log('\n=== ACTIVE WORKOUT PLAN ===')
    console.log('Plan ID:', plan.id)
    console.log('Plan Name:', plan.plan_name)
    console.log('Days Per Week:', plan.days_per_week)
    console.log('Workouts Per Week:', plan.workouts_per_week)
    console.log('Plan Type:', plan.plan_type)
    console.log('Generation Prompt:', plan.generation_prompt?.substring(0, 200))

    // Get first workout's exercises
    const { data: workouts } = await supabase
      .from('plan_workouts')
      .select(`
        *,
        plan_exercises (
          *,
          exercise:exercise_library (
            id,
            name,
            training_modality
          )
        )
      `)
      .eq('plan_id', plan.id)
      .order('week_number', { ascending: true })
      .order('day_of_week', { ascending: true })
      .limit(1)

    if (workouts && workouts.length > 0) {
      console.log('\n=== FIRST WORKOUT ===')
      console.log('Workout Name:', workouts[0].workout_name)
      console.log('Exercises:')
      workouts[0].plan_exercises.forEach((pe, i) => {
        console.log(`  ${i+1}. ${pe.exercise.name} (${pe.exercise.training_modality})`)
      })
    }
  } else {
    console.log('\nNo active workout plan found')
  }
}

checkProfile().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
