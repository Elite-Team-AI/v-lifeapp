require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function updateTrainingStyle() {
  console.log('🔧 Updating user training style...\n')

  // Get the most recent workout plan to find the user ID
  const { data: recentPlan, error: planError } = await supabase
    .from('user_workout_plans')
    .select('user_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (planError || !recentPlan) {
    console.log('❌ Error fetching user:', planError?.message || 'No plans found')
    return
  }

  const userId = recentPlan.user_id
  console.log('👤 User ID:', userId)

  // Update training_style to 'hypertrophy' (muscle building)
  const { data, error } = await supabase
    .from('profiles')
    .update({ training_style: 'hypertrophy' })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.log('❌ Error updating profile:', error.message)
    return
  }

  console.log('✅ Training style updated to: hypertrophy (muscle building)')
  console.log('\n📋 Updated profile:')
  console.log('   Training Style:', data.training_style)
  console.log('   Experience Level:', data.experience_level)
  console.log('\n✅ Now regenerate your workout plan to get exercises!')
}

updateTrainingStyle().catch(console.error)
