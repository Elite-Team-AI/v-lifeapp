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

async function checkUserProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', '80c7444d-95ff-49f9-86a6-ad937bb92328')
    .single()

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('User profile:')
    console.log('- Name:', data.name || 'NOT SET')
    console.log('- Training style:', data.training_style || 'NOT SET')
    console.log('- Available equipment:', data.available_equipment || 'NOT SET')
    console.log('- Fitness goal:', data.fitness_goal || 'NOT SET')
    console.log('- Experience level:', data.experience_level || 'NOT SET')
  }
}

checkUserProfile()
