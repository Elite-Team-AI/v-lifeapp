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

async function testEquipmentMatching() {
  const userId = '80c7444d-95ff-49f9-86a6-ad937bb92328'

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('custom_equipment, available_equipment')
    .eq('id', userId)
    .single()

  console.log('\n=== TESTING CASE-INSENSITIVE EQUIPMENT MATCHING ===')

  // Parse equipment (same logic as route.ts)
  let availableEquipment = profile.available_equipment || []
  if (availableEquipment.length === 0 && profile.custom_equipment) {
    availableEquipment = profile.custom_equipment.split(',').map(e => e.trim())
  }

  console.log('\n1. User Equipment (Raw):')
  console.log(availableEquipment.slice(0, 5)) // Show first 5

  // Normalize to lowercase (THE FIX)
  const normalizedUserEquipment = availableEquipment.map(e => e.toLowerCase())
  console.log('\n2. User Equipment (Normalized to lowercase):')
  console.log(normalizedUserEquipment.slice(0, 5))

  // Get hypertrophy exercises
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('id, name, equipment, category')
    .eq('is_active', true)
    .eq('training_modality', 'hypertrophy')

  console.log(`\n3. Total Hypertrophy Exercises: ${exercises.length}`)

  // Apply case-insensitive filtering (same as route.ts)
  const filteredExercises = exercises.filter(ex => {
    if (!ex.equipment || ex.equipment.length === 0) return true // Bodyweight
    return ex.equipment.some(eq =>
      normalizedUserEquipment.includes(eq.toLowerCase())
    )
  })

  console.log(`4. Filtered Exercises (after case-insensitive matching): ${filteredExercises.length}`)

  console.log('\n5. Sample of Matched Exercises:')
  filteredExercises.slice(0, 10).forEach(ex => {
    const equipmentStr = ex.equipment && ex.equipment.length > 0
      ? ex.equipment.join(', ')
      : 'bodyweight'
    console.log(`   ✅ ${ex.name} (${equipmentStr})`)
  })

  console.log('\n=== EXPECTED RESULT ===')
  console.log(`✅ ${filteredExercises.length} exercises should be available for AI to generate your workout`)
  console.log('✅ These should include compound lifts like:')
  console.log('   - Bench Press (dumbbells/barbell)')
  console.log('   - Squats (dumbbells/barbell)')
  console.log('   - Rows (dumbbells/cable)')
  console.log('   - Shoulder Press (dumbbells/barbell)')
  console.log('   - Deadlifts (dumbbells/barbell)')

  console.log('\n=== NEXT STEP ===')
  console.log('🔄 Regenerate your workout plan in the app')
  console.log('✅ You should now see proper weighted exercises for advanced aesthetics training')
}

testEquipmentMatching().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
