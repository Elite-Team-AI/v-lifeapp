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

async function createProfile() {
  const userId = '80c7d44d-95ff-49f9-86a6-ad937bb92328'

  const profileData = {
    id: userId,
    name: 'Test User',
    age: 30,
    gender: 'male',
    height_feet: 5,
    height_inches: 10,
    weight: 180,
    goal_weight: 170,
    primary_goal: 'build-muscle',
    activity_level: 3, // 1-5 scale (3 = moderately active)
    gym_access: 'home',
    custom_equipment: 'dumbbells, barbell, bench',
    training_style: 'strength',
    available_time_minutes: 60,
    training_days_per_week: 4,
    onboarding_completed: true,
  }

  console.log('Creating profile for user:', userId)
  console.log('Profile data:', profileData)

  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()

  if (error) {
    console.error('Error creating profile:', error)
  } else {
    console.log('✅ Profile created successfully!')
    console.log('Profile:', data)
  }
}

createProfile()
