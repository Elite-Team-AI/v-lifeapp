// Quick script to verify user_role migration
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyMigration() {
  console.log('🔍 Verifying user_role migration...\n')

  // Check column exists by querying profiles
  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_role')
    .limit(5)

  if (error) {
    console.error('❌ Error querying profiles:', error.message)
    if (error.message.includes('user_role')) {
      console.log('\n⚠️  The user_role column does not exist. Migration needs to be applied.')
    }
    return false
  }

  console.log('✅ user_role column exists!')
  console.log('\nSample data:', data)

  // Check for super_admins
  const { data: admins, error: adminError } = await supabase
    .from('profiles')
    .select('id, user_role')
    .eq('user_role', 'super_admin')

  if (adminError) {
    console.error('❌ Error querying super_admins:', adminError.message)
    return false
  }

  console.log(`\n✅ Found ${admins?.length || 0} super_admin(s)`)
  if (admins && admins.length > 0) {
    console.log('Super admins:', admins)
  }

  console.log('\n✨ Migration verification complete!')
  return true
}

verifyMigration().then(success => {
  process.exit(success ? 0 : 1)
})
