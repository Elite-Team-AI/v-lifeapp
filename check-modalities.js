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

async function checkModalities() {
  const { data: allExercises } = await supabase
    .from('exercise_library')
    .select('training_modality')
    .eq('is_active', true)

  const unique = [...new Set(allExercises.map(m => m.training_modality))]
  console.log('\n=== UNIQUE TRAINING MODALITIES IN EXERCISE_LIBRARY ===')
  console.log(unique)

  // Count exercises per modality
  console.log('\n=== EXERCISE COUNT PER MODALITY ===')
  for (const mod of unique) {
    const { data } = await supabase
      .from('exercise_library')
      .select('id')
      .eq('is_active', true)
      .eq('training_modality', mod)
    console.log(`${mod}: ${data.length} exercises`)
  }
}

checkModalities().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
