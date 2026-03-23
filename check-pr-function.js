require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkPRFunction() {
  console.log('🔍 Checking for check_and_record_prs() function...\n')

  // Execute raw SQL to check pg_proc
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = 'check_and_record_prs'
    `
  }).catch(async () => {
    // If exec_sql doesn't exist, try a simpler approach
    const result = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'check_and_record_prs')
    return result
  })

  if (error) {
    console.log('❌ Cannot query pg_proc:', error.message)
    console.log('\n💡 Let me try applying the migration directly...')
    return { functionExists: false }
  }

  if (data && data.length > 0) {
    console.log('✅ Function check_and_record_prs() EXISTS')
    console.log('\nBut the trigger may not be attached. Let me create it...')
    return { functionExists: true }
  } else {
    console.log('❌ Function check_and_record_prs() DOES NOT EXIST')
    console.log('\n💡 Need to apply the full PR migration')
    return { functionExists: false }
  }
}

checkPRFunction().then(result => {
  if (!result.functionExists) {
    console.log('\n📝 Action needed: Apply PR migration manually')
  }
}).catch(console.error)
