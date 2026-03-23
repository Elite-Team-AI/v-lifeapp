require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkExerciseTimestamps() {
  console.log('🕐 Checking when exercises were created...\n')

  // Get the earliest and latest created_at timestamps
  const { data: exercises, error } = await supabase
    .from('exercise_library')
    .select('created_at, name')
    .order('created_at', { ascending: true })
    .limit(5)

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  console.log('📅 First 5 exercises created:')
  exercises.forEach(ex => {
    const date = new Date(ex.created_at)
    console.log(`   ${date.toLocaleString()} - ${ex.name}`)
  })

  // Get latest
  const { data: latest, error: latestError } = await supabase
    .from('exercise_library')
    .select('created_at, name')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!latestError && latest) {
    const date = new Date(latest.created_at)
    console.log(`\n📅 Last exercise created:`)
    console.log(`   ${date.toLocaleString()} - ${latest.name}`)
  }

  // Check when the old plan was created
  const oldPlanId = '5b983b4e-647e-4806-a8f5-795f118dbf31'
  const { data: plan, error: planError } = await supabase
    .from('user_workout_plans')
    .select('created_at, plan_name')
    .eq('id', oldPlanId)
    .single()

  if (!planError && plan) {
    const date = new Date(plan.created_at)
    console.log(`\n📅 Your "Get Jacked Program" was created:`)
    console.log(`   ${date.toLocaleString()}`)
  }
}

checkExerciseTimestamps().catch(console.error)
