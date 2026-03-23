require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables!')
  console.log('URL:', supabaseUrl ? 'set' : 'missing')
  console.log('Key:', supabaseKey ? 'set' : 'missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugPRs() {
  console.log('🔍 Checking PR System...\n')
  
  // Get the current user's exercise logs
  const { data: logs, error: logsError } = await supabase
    .from('exercise_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (logsError) {
    console.log('❌ Error fetching exercise logs:', logsError.message)
  } else {
    console.log('📊 Recent Exercise Logs:', logs?.length || 0, 'found')
    logs?.forEach((log, i) => {
      console.log(`\n  Log ${i + 1}:`)
      console.log('    Exercise ID:', log.exercise_id)
      console.log('    Type:', log.exercise_type)
      console.log('    Weight per set:', log.weight_per_set)
      console.log('    Reps per set:', log.reps_per_set)
      console.log('    Created:', log.created_at)
    })
  }
  
  console.log('\n')
  
  // Get PRs
  const { data: prs, error: prsError } = await supabase
    .from('exercise_pr_history')
    .select('*')
    .order('achieved_at', { ascending: false })
    .limit(5)
  
  if (prsError) {
    console.log('❌ Error fetching PRs:', prsError.message)
  } else {
    console.log('🏆 Personal Records:', prs?.length || 0, 'found')
    prs?.forEach((pr, i) => {
      console.log(`\n  PR ${i + 1}:`)
      console.log('    Exercise ID:', pr.exercise_id)
      console.log('    Type:', pr.pr_type)
      console.log('    Weight:', pr.weight_lbs, 'lbs')
      console.log('    Reps:', pr.reps)
      console.log('    Achieved:', pr.achieved_at)
    })
  }
}

debugPRs().catch(console.error)
