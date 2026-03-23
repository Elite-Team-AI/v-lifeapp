require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function applyPRTrigger() {
  console.log('🔧 Applying PR trigger to database...\n')

  // Read the SQL file
  const sql = fs.readFileSync('apply-pr-trigger.sql', 'utf8')

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec', { sql_query: sql })

    if (error) {
      console.log('❌ Error applying trigger:', error.message)
      console.log('\n💡 You may need to apply this SQL manually via Supabase SQL Editor:')
      console.log('   1. Open Supabase Dashboard > SQL Editor')
      console.log('   2. Paste the contents of apply-pr-trigger.sql')
      console.log('   3. Run the query')
      return
    }

    console.log('✅ PR trigger applied successfully!')
    console.log('\nNow let me verify it was created...')

    // Verify trigger exists
    const { data: triggers } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'trigger_check_prs')
      .eq('event_object_table', 'exercise_logs')

    console.log('\n🔍 Trigger verification:', triggers && triggers.length > 0 ? '✅ EXISTS' : '❌ STILL MISSING')

  } catch (err) {
    console.log('❌ Unexpected error:', err.message)
    console.log('\n💡 Manual application required. See instructions above.')
  }
}

applyPRTrigger().catch(console.error)
