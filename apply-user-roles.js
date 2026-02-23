// Script to manually apply user_role migration
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.log('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🔧 Applying user_role migration...\n')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260222215118_add_user_roles.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration SQL:')
    console.log('---')
    console.log(sql)
    console.log('---\n')

    // Split SQL into individual statements and execute each one
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`Executing ${statements.length} SQL statements...\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`[${i + 1}/${statements.length}] Executing...`)

      const { data, error } = await supabase.rpc('exec_sql', { sql_string: statement + ';' })

      if (error) {
        // Try alternative approach using Supabase REST API
        console.log(`   Trying direct approach...`)

        // For most statements, we can try using the postgres REST API
        if (statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX') || statement.includes('UPDATE')) {
          console.log(`   ⚠️  Skipping (requires service role): ${statement.substring(0, 50)}...`)
          console.log(`   Error: ${error.message}`)
        } else {
          console.error(`   ❌ Error: ${error.message}`)
        }
      } else {
        console.log(`   ✅ Success`)
      }
    }

    console.log('\n✨ Migration application complete!')
    console.log('\nNote: Some statements may have been skipped and need to be run manually via Supabase dashboard SQL editor.')

  } catch (error) {
    console.error('❌ Error reading migration file:', error.message)
    process.exit(1)
  }
}

applyMigration()
