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

async function checkMinimalProfile() {
  const userId = '80c7d44d-95ff-49f9-86a6-ad937bb92328'

  console.log('Checking for profile with ID:', userId)
  console.log('Including profiles with NULL name...\n')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)

  if (error) {
    console.error('Error:', error)
  } else if (data && data.length > 0) {
    console.log('✅ Profile found!')
    console.log('Profile data:', data[0])
    console.log('\nKey fields:')
    console.log('- Name:', data[0].name || 'NULL')
    console.log('- Onboarding completed:', data[0].onboarding_completed)
    console.log('- Credits:', data[0].credits)
  } else {
    console.log('❌ No profile found')
  }
}

checkMinimalProfile()
