require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkTrigger() {
  console.log('🔍 Checking if PR trigger exists...\n')
  
  // Check if exercise_pr_history table exists
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'exercise_pr_history')
  
  if (tablesError) {
    console.log('❌ Error checking tables:', tablesError.message)
  } else {
    console.log('📋 exercise_pr_history table:', tables?.length > 0 ? '✅ EXISTS' : '❌ MISSING')
  }
  
  // Check if exercise_logs table exists
  const { data: logsTable } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'exercise_logs')
  
  console.log('📋 exercise_logs table:', logsTable?.length > 0 ? '✅ EXISTS' : '❌ MISSING')
  
  // Check workout_logs table
  const { data: workoutTable } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'workout_logs')
  
  console.log('📋 workout_logs table:', workoutTable?.length > 0 ? '✅ EXISTS' : '❌ MISSING')
}

checkTrigger().catch(console.error)
