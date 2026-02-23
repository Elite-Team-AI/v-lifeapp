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

async function checkAllProfiles() {
  const { data, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .limit(10)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log(`Total profiles in database: ${count}`)
    if (data && data.length > 0) {
      console.log('\nSample profiles:')
      data.forEach(profile => {
        console.log(`- ID: ${profile.id}, Name: ${profile.name || 'NO NAME'}`)
      })
    } else {
      console.log('No profiles found in database')
    }
  }
}

checkAllProfiles()
