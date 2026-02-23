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

async function checkUserPlans() {
  // The actual logged-in user ID
  const userId = '80c7444d-95ff-49f9-86a6-ad937bb92328'

  console.log('Checking workout plans for user:', userId)
  console.log('')

  // Check user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError) {
    console.error('Profile error:', profileError)
  } else {
    console.log('✅ Profile found:')
    console.log('  - Name:', profile.name)
    console.log('  - Email: (check auth.users)')
    console.log('')
  }

  // Check workout plans
  const { data: plans, error: plansError, count } = await supabase
    .from('user_workout_plans')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (plansError) {
    console.error('Plans error:', plansError)
  } else {
    console.log(`Total plans for this user: ${count}`)
    if (plans && plans.length > 0) {
      console.log('\n📋 Workout plans:')
      plans.forEach((plan, idx) => {
        console.log(`\n${idx + 1}. ${plan.plan_name}`)
        console.log(`   - ID: ${plan.id}`)
        console.log(`   - Status: ${plan.status}`)
        console.log(`   - Created: ${plan.created_at}`)
        console.log(`   - Weeks: ${plan.duration_weeks || 'N/A'}`)
      })
    } else {
      console.log('❌ No workout plans found')
    }
  }
}

checkUserPlans()
