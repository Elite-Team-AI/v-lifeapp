const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkWorkoutCompletion() {
  const userId = '80c7444d-95ff-49f9-86a6-ad937bb92328'

  console.log('\n=== Checking Workout Completion Status ===\n')

  // 1. Check active plan
  const { data: plan, error: planError } = await supabase
    .from('user_workout_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (planError || !plan) {
    console.error('No active plan found:', planError)
    return
  }

  console.log('Active Plan:', {
    id: plan.id,
    name: plan.plan_name,
    status: plan.status
  })

  // 2. Check all plan workouts
  const { data: workouts, error: workoutsError } = await supabase
    .from('plan_workouts')
    .select('*')
    .eq('plan_id', plan.id)
    .order('week_number', { ascending: true })
    .order('day_of_week', { ascending: true })

  if (workoutsError) {
    console.error('Error fetching workouts:', workoutsError)
    return
  }

  console.log(`\nTotal Workouts in Plan: ${workouts.length}`)
  console.log('\nWorkout Status:')
  workouts.forEach((w, i) => {
    console.log(`  ${i + 1}. ${w.workout_name} (Week ${w.week_number}, Day ${w.day_of_week})`)
    console.log(`     - ID: ${w.id}`)
    console.log(`     - Completed: ${w.is_completed}`)
    console.log(`     - Completed Date: ${w.completed_date}`)
  })

  const completedCount = workouts.filter(w => w.is_completed).length
  console.log(`\n✅ Completed Workouts: ${completedCount}/${workouts.length}`)

  // 3. Check workout logs
  const { data: logs, error: logsError } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!logsError && logs) {
    console.log(`\nRecent Workout Logs: ${logs.length}`)
    logs.forEach((log, i) => {
      console.log(`  ${i + 1}. Workout Log ID: ${log.id}`)
      console.log(`     - Workout ID: ${log.workout_id}`)
      console.log(`     - Status: ${log.completion_status}`)
      console.log(`     - Started: ${log.started_at}`)
      console.log(`     - Completed: ${log.completed_at}`)
    })
  }

  // 4. Check if there's a mismatch
  const logsWithWorkoutId = logs?.filter(l => l.workout_id) || []
  const completedLogs = logs?.filter(l => l.completion_status === 'completed') || []

  console.log(`\n📊 Summary:`)
  console.log(`  - Plan workouts marked complete: ${completedCount}`)
  console.log(`  - Workout logs completed: ${completedLogs.length}`)
  console.log(`  - Logs with workout_id: ${logsWithWorkoutId.length}`)

  if (completedLogs.length > completedCount) {
    console.log(`\n⚠️  MISMATCH DETECTED:`)
    console.log(`  You have ${completedLogs.length} completed workout logs but only ${completedCount} plan workouts marked as complete.`)
    console.log(`  This means workout completion is not being properly tracked in the plan_workouts table.`)

    // Check which logs don't have a workout_id
    const logsWithoutWorkoutId = completedLogs.filter(l => !l.workout_id)
    if (logsWithoutWorkoutId.length > 0) {
      console.log(`\n  ${logsWithoutWorkoutId.length} completed logs are missing workout_id:`)
      logsWithoutWorkoutId.forEach(log => {
        console.log(`    - Log ID: ${log.id} (started: ${log.started_at})`)
      })
    }
  } else {
    console.log(`\n✅ Tracking is working correctly!`)
  }

  console.log('\n=== End of Report ===\n')
}

checkWorkoutCompletion().catch(console.error)
