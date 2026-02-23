import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
const envVars: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function checkAllTables() {
  const userId = '80c7444d-95ff-49f9-86a6-ad937bb92328'

  console.log('Checking all workout-related tables for user:', userId)
  console.log('')

  // Check user_workout_plans
  console.log('=== user_workout_plans ===')
  const { data: userPlans, count: userPlansCount } = await supabase
    .from('user_workout_plans')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
  console.log('Count:', userPlansCount)
  console.log('Data:', userPlans)
  console.log('')

  // Check workout_plans (if it exists)
  console.log('=== workout_plans ===')
  const { data: plans, count: plansCount, error: plansError } = await supabase
    .from('workout_plans')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
  if (plansError) {
    console.log('Error or table does not exist:', plansError.message)
  } else {
    console.log('Count:', plansCount)
    console.log('Data:', plans)
  }
  console.log('')

  // Check workouts (old table)
  console.log('=== workouts (old table) ===')
  const { data: workouts, count: workoutsCount } = await supabase
    .from('workouts')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .limit(5)
  console.log('Count:', workoutsCount)
  console.log('Data (first 5):', workouts)
  console.log('')

  // Check plan_workouts
  console.log('=== plan_workouts ===')
  const { data: planWorkouts, count: planWorkoutsCount, error: planWorkoutsError } = await supabase
    .from('plan_workouts')
    .select('*', { count: 'exact' })
    .limit(5)
  if (planWorkoutsError) {
    console.log('Error or table does not exist:', planWorkoutsError.message)
  } else {
    console.log('Total count in table:', planWorkoutsCount)
    console.log('Data (first 5):', planWorkouts)
  }
}

checkAllTables()
