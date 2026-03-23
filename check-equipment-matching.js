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

async function checkEquipmentMatching() {
  const userId = '80c7444d-95ff-49f9-86a6-ad937bb92328'

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('custom_equipment, available_equipment')
    .eq('id', userId)
    .single()

  console.log('\n=== USER EQUIPMENT ===')
  console.log('Custom Equipment String:', profile.custom_equipment)
  const userEquipment = profile.custom_equipment.split(',').map(e => e.trim())
  console.log('Parsed Array:', userEquipment)

  // Get hypertrophy exercises with equipment
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('id, name, equipment, category')
    .eq('is_active', true)
    .eq('training_modality', 'hypertrophy')

  console.log('\n=== HYPERTROPHY EXERCISES (First 20) ===')
  exercises.slice(0, 20).forEach(ex => {
    console.log(`\n${ex.name}`)
    console.log(`  Equipment in DB: ${JSON.stringify(ex.equipment)}`)
    console.log(`  Category: ${ex.category}`)

    // Check if any equipment matches
    if (!ex.equipment || ex.equipment.length === 0) {
      console.log(`  ✅ MATCH: Bodyweight (no equipment needed)`)
    } else {
      const matches = ex.equipment.some(eq => userEquipment.includes(eq))
      console.log(`  ${matches ? '✅ MATCH' : '❌ NO MATCH'}: User has equipment for this exercise`)
    }
  })

  // Get unique equipment values in exercise_library
  const allEquipment = new Set()
  exercises.forEach(ex => {
    if (ex.equipment && ex.equipment.length > 0) {
      ex.equipment.forEach(eq => allEquipment.add(eq))
    }
  })

  console.log('\n\n=== EQUIPMENT VALUES IN EXERCISE_LIBRARY ===')
  console.log(Array.from(allEquipment).sort())

  console.log('\n\n=== COMPARISON ===')
  console.log('User has (from custom_equipment):')
  userEquipment.forEach(eq => console.log(`  - "${eq}"`))
  console.log('\nDatabase expects (from exercise_library):')
  Array.from(allEquipment).sort().forEach(eq => console.log(`  - "${eq}"`))
}

checkEquipmentMatching().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
