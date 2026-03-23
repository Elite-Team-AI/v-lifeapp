require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkMigrations() {
  console.log('🔍 Checking applied migrations...\n')

  const { data, error } = await supabase
    .from('schema_migrations')
    .select('*')
    .order('version', { ascending: false })
    .limit(10)

  if (error) {
    console.log('❌ Error:', error.message)
    console.log('   (schema_migrations table may not exist)')
    return
  }

  console.log('📋 Recent migrations:')
  if (data && data.length > 0) {
    data.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.version}`)
    })
  }

  // Check specifically for PR migration
  const { data: prMigration } = await supabase
    .from('schema_migrations')
    .select('*')
    .eq('version', '20260222000000')
    .single()

  console.log('\n🎯 PR Migration (20260222000000):', prMigration ? '✅ APPLIED' : '❌ NOT APPLIED')
}

checkMigrations().catch(console.error)
