const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const userId = '80c7444d-95ff-49f9-86a6-ad937bb92328'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function archiveOldPlans() {
  console.log('Archiving old active plans for user:', userId)
  
  const { data, error } = await supabase
    .from('user_workout_plans')
    .update({ status: 'archived' })
    .eq('user_id', userId)
    .eq('status', 'active')
    .select()
  
  if (error) {
    console.error('Error archiving plans:', error)
  } else {
    console.log('Archived plans:', data)
  }
}

archiveOldPlans()
