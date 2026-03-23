require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const userId = '80c7444d-95ff-49f9-86a6-ad937bb92328'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function reactivateLatestPlan() {
  console.log('Finding latest Personalized 4-Week Mesocycle plan...')
  
  // Get most recent plan
  const { data: plans, error: fetchError } = await supabase
    .from('user_workout_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('plan_name', 'Personalized 4-Week Mesocycle')
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (fetchError || !plans || plans.length === 0) {
    console.error('Error finding plan:', fetchError)
    return
  }
  
  const latestPlan = plans[0]
  console.log('Found plan:', latestPlan.id, 'created at', latestPlan.created_at)
  
  // Count workouts for this plan
  const { data: workouts, error: workoutsError } = await supabase
    .from('plan_workouts')
    .select('id, week_number')
    .eq('plan_id', latestPlan.id)
  
  if (workoutsError) {
    console.error('Error counting workouts:', workoutsError)
  } else {
    const weeks = new Set(workouts.map(w => w.week_number))
    console.log(`  Workouts: ${workouts.length} total across ${weeks.size} weeks`)
  }
  
  // Reactivate it
  const { data, error } = await supabase
    .from('user_workout_plans')
    .update({ status: 'active' })
    .eq('id', latestPlan.id)
    .select()
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('✅ Reactivated plan:', data[0].plan_name)
  }
}

reactivateLatestPlan()
