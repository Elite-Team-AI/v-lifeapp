require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function checkTables() {
  console.log('🔍 Checking tables with admin access...\n')
  
  const tables = ['workout_logs', 'exercise_logs', 'exercise_pr_history', 'plan_workouts']
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌', table + ':', error.message)
    } else {
      const count = data ? data.length : 0
      console.log('✅', table + ': EXISTS')
    }
  }
}

checkTables().catch(console.error)
