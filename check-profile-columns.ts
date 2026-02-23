import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
const envVars: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function checkColumns() {
  // Query an empty result set to see the column structure
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(0)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Profiles table columns (from query):')
    console.log(data)
  }

  // Also try a raw SQL query to get column info
  const { data: columns, error: colError } = await supabase.rpc('get_column_info', {
    table_name: 'profiles'
  })

  if (colError) {
    console.log('\nNote: Could not get column info via RPC (this is expected if the function doesn\'t exist)')
  } else {
    console.log('\nColumn info:', columns)
  }
}

checkColumns()
