require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkWorkoutLogsAndPRs() {
  console.log('🔍 Checking workout_logs and PRs...\n')

  // Get all workout_logs
  const { data: workoutLogs } = await supabase
    .from('workout_logs')
    .select('*')
    .order('created_at', { ascending: false })

  console.log('📊 Total workout_logs:', workoutLogs ? workoutLogs.length : 0)

  if (workoutLogs && workoutLogs.length > 0) {
    console.log('\nWorkout Logs:')
    workoutLogs.forEach((wl, i) => {
      console.log(`  ${i + 1}. ID: ${wl.id.substring(0, 8)}...`)
      console.log(`     Status: ${wl.completion_status}`)
      console.log(`     Started: ${wl.started_at}`)
      console.log(`     Completed: ${wl.completed_at || 'N/A'}`)
      console.log('')
    })
  }

  // Check for PRs
  const { data: prs } = await supabase
    .from('exercise_pr_history')
    .select('*')

  console.log('🏆 Total PRs:', prs ? prs.length : 0)

  if (prs && prs.length > 0) {
    console.log('\nPersonal Records:')
    prs.forEach((pr, i) => {
      console.log(`  ${i + 1}. PR Type: ${pr.pr_type}`)
      console.log(`     Weight: ${pr.weight_lbs} lbs`)
      console.log(`     Achieved: ${pr.achieved_at}`)
      console.log('')
    })
  } else {
    console.log('   No PRs found!')
    console.log('\n💡 This confirms the PR trigger is not firing.')
  }
}

checkWorkoutLogsAndPRs().catch(console.error)
