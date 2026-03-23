require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkTableStructure() {
  console.log('🔍 Checking exercise_library table...\n')

  // Try to fetch one row to verify table exists
  const { data, error } = await supabase
    .from('exercise_library')
    .select('*')
    .limit(1)

  if (error) {
    console.log('❌ Error accessing exercise_library table:', error.message)
    console.log('\n🔧 Possible causes:')
    console.log('   1. Table does not exist')
    console.log('   2. RLS policies are blocking access')
    console.log('   3. Service role key is incorrect\n')
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  Table exists but is EMPTY (0 rows)')
    console.log('\n📝 You need to populate the exercise library.')
    console.log('   Option 1: Apply migration file')
    console.log('   Option 2: Run seed script')
    console.log('   Option 3: Manually insert exercises\n')
  } else {
    console.log('✅ Table exists and has data!')
    console.log('   Sample row:', JSON.stringify(data[0], null, 2))
  }

  // Count total rows
  const { count, error: countError } = await supabase
    .from('exercise_library')
    .select('*', { count: 'exact', head: true })

  if (!countError) {
    console.log(`\n📊 Total rows in exercise_library: ${count || 0}`)
  }
}

checkTableStructure().catch(console.error)
