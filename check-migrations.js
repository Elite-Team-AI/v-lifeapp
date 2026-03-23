require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkMigrations() {
  console.log('🔍 Checking applied migrations...\n')

  // Check schema_migrations table
  const { data: migrations, error } = await supabase
    .from('schema_migrations')
    .select('version')
    .order('version', { ascending: false })

  if (error) {
    console.log('❌ Error fetching migrations:', error.message)
    console.log('   The schema_migrations table might not exist.')
    console.log('   This means migrations may not have been applied properly.\n')
    return
  }

  console.log(`📋 Total migrations applied: ${migrations?.length || 0}\n`)

  const exerciseMigration = '20260222150000'
  const hasExerciseMigration = migrations?.some(m => m.version === exerciseMigration)

  if (hasExerciseMigration) {
    console.log('✅ Exercise library migration (20260222150000) HAS been applied')
    console.log('   But exercise_library is still empty - there may be an issue with the migration\n')
  } else {
    console.log('❌ Exercise library migration (20260222150000) has NOT been applied')
    console.log('   This is why the exercise library is empty!\n')
    console.log('📝 To fix this, apply the migration:')
    console.log('   1. Run: supabase db push')
    console.log('   OR')
    console.log('   2. Manually run the SQL from: supabase/migrations/20260222150000_populate_exercise_library.sql\n')
  }

  // Show recent migrations
  console.log('📜 Recent migrations applied:')
  migrations?.slice(0, 10).forEach(m => {
    console.log(`   - ${m.version}`)
  })
}

checkMigrations().catch(console.error)
