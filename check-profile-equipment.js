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

async function checkProfile() {
  const userId = '80c7444d-95ff-49f9-86a6-ad937bb92328' // Hudson's user ID

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  console.log('\n=== HUDSON\'S PROFILE IN DATABASE ===')
  console.log('Primary Goal:', profile.primary_goal)
  console.log('Fitness Goal:', profile.fitness_goal)
  console.log('Training Style:', profile.training_style)
  console.log('Experience Level:', profile.experience_level)
  console.log('Gym Access:', profile.gym_access)
  console.log('Workout Location:', profile.workout_location)
  console.log('Weekly Workout Goal:', profile.weekly_workout_goal)
  console.log('Training Days Per Week:', profile.training_days_per_week)
  console.log('\n=== EQUIPMENT (THIS IS THE CRITICAL FIELD) ===')
  console.log('Available Equipment:', profile.available_equipment)
  console.log('Is Array?:', Array.isArray(profile.available_equipment))
  console.log('Length:', profile.available_equipment?.length || 0)
  console.log('Custom Equipment:', profile.custom_equipment)

  console.log('\n=== FITNESS ASSESSMENT ===')
  console.log('Push-ups:', profile.push_ups)
  console.log('Pull-ups:', profile.pull_ups)
  console.log('Plank Time:', profile.plank_time)
  console.log('Squat Depth:', profile.squat_depth)
}

checkProfile().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
