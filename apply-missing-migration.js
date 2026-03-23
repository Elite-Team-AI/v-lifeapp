require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function applyMigration() {
  console.log('🔧 Applying migration: 20260223120000_add_missing_workout_fields.sql\n')

  // Read the migration file
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260223120000_add_missing_workout_fields.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

  console.log('📄 Migration file loaded')
  console.log('📊 Executing SQL...\n')

  try {
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    })

    if (error) {
      // Try alternative method - direct execution
      console.log('⚠️  RPC method failed, trying direct execution...')

      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

      for (const statement of statements) {
        if (statement.includes('ALTER TABLE') || statement.includes('CREATE') || statement.includes('COMMENT')) {
          console.log(`Executing: ${statement.substring(0, 60)}...`)

          const { error: execError } = await supabase.rpc('exec_sql', {
            sql_query: statement
          })

          if (execError) {
            console.log(`  ⚠️  Warning: ${execError.message}`)
          }
        }
      }

      console.log('\n✅ Migration statements executed (check for warnings above)')
    } else {
      console.log('✅ Migration applied successfully!')
    }

    // Verify the column was added
    console.log('\n🔍 Verifying column exists...')
    const { data: columns, error: checkError } = await supabase
      .from('workout_logs')
      .select('planned_duration_minutes')
      .limit(1)

    if (checkError) {
      if (checkError.message.includes('planned_duration_minutes')) {
        console.log('❌ Column still not found in schema cache')
        console.log('   This might be a PostgREST cache issue.')
        console.log('   Restarting the Supabase service may be needed.')
      } else {
        console.log('⚠️  Verification check failed:', checkError.message)
      }
    } else {
      console.log('✅ Column verified successfully!')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

applyMigration().catch(console.error)
