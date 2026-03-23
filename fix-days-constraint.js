const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim().replace(/^["'](.*)["']$/, '$1')
    process.env[key] = value
  }
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixConstraint() {
  console.log('\n=== FIXING DAYS_PER_WEEK CONSTRAINT ===\n')

  // First, check the current constraint
  console.log('1. Checking current constraint...')
  const { data: constraintCheck, error: checkError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT conname, pg_get_constraintdef(c.oid) as definition
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        JOIN pg_class cl ON cl.oid = c.conrelid
        WHERE cl.relname = 'user_workout_plans'
          AND conname = 'user_workout_plans_days_per_week_check'
      `
    })

  if (checkError) {
    console.log('   ℹ️  Could not check constraint (might not exist yet)')
  } else {
    console.log('   Current constraint:', JSON.stringify(constraintCheck, null, 2))
  }

  // Drop and recreate the constraint
  console.log('\n2. Dropping old constraint...')
  const { error: dropError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE user_workout_plans
      DROP CONSTRAINT IF EXISTS user_workout_plans_days_per_week_check;
    `
  })

  if (dropError) {
    console.log('   ❌ Error dropping constraint:', dropError.message)
    return
  }
  console.log('   ✅ Old constraint dropped')

  console.log('\n3. Creating new constraint (2-7 days)...')
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE user_workout_plans
      ADD CONSTRAINT user_workout_plans_days_per_week_check
      CHECK (days_per_week BETWEEN 2 AND 7);
    `
  })

  if (createError) {
    console.log('   ❌ Error creating constraint:', createError.message)
    return
  }
  console.log('   ✅ New constraint created (allows 2-7 days)')

  // Verify the fix
  console.log('\n4. Verifying new constraint...')
  const { data: verifyData, error: verifyError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT conname, pg_get_constraintdef(c.oid) as definition
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        JOIN pg_class cl ON cl.oid = c.conrelid
        WHERE cl.relname = 'user_workout_plans'
          AND conname = 'user_workout_plans_days_per_week_check'
      `
    })

  if (!verifyError && verifyData) {
    console.log('   ✅ Verified:', JSON.stringify(verifyData, null, 2))
  }

  console.log('\n=== CONSTRAINT FIX COMPLETE ===')
  console.log('✅ You can now generate workout plans with 2-7 days per week')
}

fixConstraint().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
