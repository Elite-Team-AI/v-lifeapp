require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function applyMigration() {
  console.log('🔧 Applying Exercise Library Migration\n')

  // Read the migration file
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260222150000_populate_exercise_library.sql')

  if (!fs.existsSync(migrationPath)) {
    console.log('❌ Migration file not found at:', migrationPath)
    return
  }

  const sql = fs.readFileSync(migrationPath, 'utf8')
  console.log(`📄 Migration file loaded: ${sql.length} characters\n`)

  // Supabase's REST API doesn't support raw SQL execution directly
  // We need to use the PostgreSQL connection or Supabase Dashboard

  console.log('⚠️  This migration requires direct database access.\n')
  console.log('📋 Options to apply the migration:\n')

  console.log('Option 1: Supabase Dashboard (RECOMMENDED)')
  console.log('   1. Go to: https://supabase.com/dashboard/project/')
  console.log('      Then: SQL Editor')
  console.log('   2. Create a new query')
  console.log('   3. Copy and paste the SQL from:')
  console.log('      supabase/migrations/20260222150000_populate_exercise_library.sql')
  console.log('   4. Run the query\n')

  console.log('Option 2: Supabase CLI')
  console.log('   1. Install Supabase CLI: npm install -g supabase')
  console.log('   2. Link to your project: supabase link --project-ref YOUR_PROJECT_REF')
  console.log('   3. Apply migration: supabase db push\n')

  console.log('Option 3: Direct PostgreSQL Connection')
  console.log('   1. Get your database password from Supabase Dashboard')
  console.log('   2. Install pg: npm install pg')
  console.log('   3. Set SUPABASE_DB_PASSWORD in .env.local')
  console.log('   4. Run a custom script with pg client\n')

  // Check if we can use pg
  try {
    const { Client } = require('pg')

    console.log('🔧 Detected pg package. Attempting direct connection...\n')

    const dbPassword = process.env.SUPABASE_DB_PASSWORD

    if (!dbPassword) {
      console.log('❌ Missing SUPABASE_DB_PASSWORD')
      console.log('   Get it from: Supabase Dashboard → Settings → Database\n')
      console.log('💡 For now, use Option 1 (Dashboard) - it\'s the easiest!\n')
      return
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
    const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`

    console.log('📡 Connecting to database...')
    const client = new Client({ connectionString })
    await client.connect()

    console.log('✅ Connected! Applying migration...\n')

    try {
      await client.query(sql)
      console.log('✅ Migration applied successfully!\n')

      // Verify exercises were inserted
      const result = await client.query('SELECT COUNT(*) as count FROM exercise_library WHERE is_active = true')
      console.log(`📊 Active exercises in library: ${result.rows[0].count}\n`)

    } catch (err) {
      console.log('❌ Error applying migration:', err.message)
      console.log('\n💡 Try using Option 1 (Dashboard) instead.\n')
    } finally {
      await client.end()
    }

  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('💡 Recommendation: Use Option 1 (Supabase Dashboard)')
      console.log('   It\'s the quickest and most reliable method!\n')
    } else {
      console.log('❌ Unexpected error:', err.message)
    }
  }
}

applyMigration().catch(console.error)
