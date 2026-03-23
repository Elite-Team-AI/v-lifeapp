require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkPRTrigger() {
  console.log('🔍 Checking for PR trigger in database...\n')

  // Query information_schema for triggers
  const { data: triggers } = await supabase
    .from('information_schema.triggers')
    .select('*')
    .eq('trigger_name', 'trigger_check_prs')
    .eq('event_object_table', 'exercise_logs')

  console.log('🔧 Trigger "trigger_check_prs":', triggers && triggers.length > 0 ? '✅ EXISTS' : '❌ MISSING')

  if (triggers && triggers.length > 0) {
    console.log('\nTrigger details:')
    console.log(JSON.stringify(triggers[0], null, 2))
  } else {
    console.log('\n⚠️  The PR trigger does not exist!')
    console.log('   This explains why PRs are not being created.')
    console.log('\n💡 Solution: Apply the PR trigger migration')
  }
}

checkPRTrigger().catch((err) => {
  console.error('Error checking trigger:', err.message)
  console.log('\n💡 Trigger likely does not exist or cannot be queried via information_schema')
})
