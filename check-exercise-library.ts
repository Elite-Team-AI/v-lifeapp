import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local manually
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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkExerciseLibrary() {
  console.log('Checking exercise_library table...')

  const { data, error, count } = await supabase
    .from('exercise_library')
    .select('id, name, training_modality', { count: 'exact' })
    .eq('is_active', true)
    .limit(10)

  if (error) {
    console.error('Error querying exercise_library:', error)
    return
  }

  console.log(`Total active exercises: ${count}`)
  console.log('Sample exercises:')
  console.log(data)
}

checkExerciseLibrary()
