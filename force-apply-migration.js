require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

async function main() {
  // We need to use direct PostgreSQL connection
  // Let's check if the pg package is available
  try {
    const { Client } = require('pg')

    // Extract project ref from URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

    // Construct direct database URL
    // Format: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
    console.log('🔧 Direct Database Migration Tool\n')
    console.log('⚠️  This requires the database password (SUPABASE_DB_PASSWORD)\n')

    const dbPassword = process.env.SUPABASE_DB_PASSWORD

    if (!dbPassword) {
      console.log('❌ Missing SUPABASE_DB_PASSWORD environment variable\n')
      console.log('To get your database password:')
      console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database')
      console.log('2. Look for "Database password" or reset it')
      console.log('3. Add it to .env.local as SUPABASE_DB_PASSWORD=your_password')
      console.log('\nOR use the Supabase Dashboard method (recommended):\n')
      console.log('Run: node apply-migration-auto.js\n')
      process.exit(1)
    }

    const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`

    console.log('📦 Connecting to database...\n')

    const client = new Client({ connectionString })
    await client.connect()

    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260223120000_add_missing_workout_fields.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('📝 Applying migration: 20260223120000_add_missing_workout_fields.sql\n')

    // Split into statements and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.includes('ALTER TABLE') || statement.includes('CREATE') || statement.includes('DROP') || statement.includes('COMMENT')) {
        try {
          await client.query(statement)
          console.log('✅', statement.substring(0, 60) + '...')
        } catch (err) {
          if (err.message.includes('already exists') || err.message.includes('does not exist')) {
            console.log('⚠️  Skipped (already applied):', statement.substring(0, 60) + '...')
          } else {
            console.error('❌ Error:', err.message)
          }
        }
      }
    }

    // Force schema reload
    console.log('\n🔄 Forcing PostgREST schema reload...')
    await client.query("NOTIFY pgrst, 'reload schema'")

    await client.end()

    console.log('\n✅ Migration applied successfully!')
    console.log('   Try starting a workout now.\n')

  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('❌ pg package not installed\n')
      console.log('Install it with: npm install pg\n')
      console.log('OR use the Supabase Dashboard method (recommended):\n')
      console.log('Run: node apply-migration-auto.js\n')
    } else {
      console.error('❌ Error:', err.message)
    }
  }
}

main()
