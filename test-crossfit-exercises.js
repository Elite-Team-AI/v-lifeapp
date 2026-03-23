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

async function testCrossFitExercises() {
  const userId = '80c7444d-95ff-49f9-86a6-ad937bb92328'

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('custom_equipment, available_equipment, training_style')
    .eq('id', userId)
    .single()

  console.log('\n=== TESTING CROSSFIT TRAINING STYLE ===')
  console.log(`User's Training Style: ${profile.training_style}`)

  // Map crossfit to mixed (same as route.ts now does)
  const trainingStyle = profile.training_style === 'crossfit' ? 'mixed' : profile.training_style
  console.log(`Mapped to Training Modality: ${trainingStyle}`)

  // Parse equipment (same logic as route.ts)
  let availableEquipment = profile.available_equipment || []
  if (availableEquipment.length === 0 && profile.custom_equipment) {
    availableEquipment = profile.custom_equipment.split(',').map(e => e.trim())
  }

  console.log(`\nUser Equipment Count: ${availableEquipment.length} pieces`)

  // Normalize to lowercase
  const normalizedUserEquipment = availableEquipment.map(e => e.toLowerCase())

  // Get mixed exercises
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('id, name, equipment, category')
    .eq('is_active', true)
    .eq('training_modality', trainingStyle)

  console.log(`\n✅ Total ${trainingStyle.toUpperCase()} Exercises: ${exercises.length}`)

  // Apply case-insensitive filtering
  const filteredExercises = exercises.filter(ex => {
    if (!ex.equipment || ex.equipment.length === 0) return true
    return ex.equipment.some(eq =>
      normalizedUserEquipment.includes(eq.toLowerCase())
    )
  })

  console.log(`✅ Filtered Exercises (matching your equipment): ${filteredExercises.length}`)

  console.log('\n=== SAMPLE EXERCISES FOR CROSSFIT ===')
  filteredExercises.slice(0, 15).forEach(ex => {
    const equipmentStr = ex.equipment && ex.equipment.length > 0
      ? ex.equipment.join(', ')
      : 'bodyweight'
    console.log(`   ✅ ${ex.name} (${equipmentStr})`)
  })

  console.log('\n=== EXPECTED RESULT ===')
  console.log(`✅ ${filteredExercises.length} exercises should be available for CrossFit workout generation`)
  console.log('✅ Mixed modality includes varied functional fitness exercises')
  console.log('   - Strength movements (squats, presses, deadlifts)')
  console.log('   - Olympic lifts (cleans, snatches)')
  console.log('   - Metabolic conditioning (burpees, box jumps)')
  console.log('   - Core and gymnastics movements')

  console.log('\n=== NEXT STEP ===')
  console.log('🔄 Regenerate your workout plan in the app')
  console.log('✅ You should now see CrossFit-style workouts with varied exercises')
}

testCrossFitExercises().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
