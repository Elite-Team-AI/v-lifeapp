import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local manually
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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkWorkoutPlans() {
  console.log('Checking user_workout_plans table...')
  console.log('Target user_id: 80c7444d-95ff-49f9-86a6-ad937bb92328')
  console.log('')

  // Check all plans in the table
  const { data: allPlans, error: allError, count: totalCount } = await supabase
    .from('user_workout_plans')
    .select('id, user_id, plan_name, status, created_at', { count: 'exact' })
    .limit(10)

  if (allError) {
    console.error('Error querying all plans:', allError)
  } else {
    console.log(`Total plans in table: ${totalCount}`)
    console.log('Sample plans:', allPlans)
    console.log('')
  }

  // Check plans for the specific user
  const { data: userPlans, error: userError, count: userCount } = await supabase
    .from('user_workout_plans')
    .select('*', { count: 'exact' })
    .eq('user_id', '80c7444d-95ff-49f9-86a6-ad937bb92328')

  if (userError) {
    console.error('Error querying user plans:', userError)
  } else {
    console.log(`Plans for user 80c7444d-95ff-49f9-86a6-ad937bb92328: ${userCount}`)
    console.log('User plans:', userPlans)
  }
}

checkWorkoutPlans()
