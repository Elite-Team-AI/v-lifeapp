require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkExercises() {
  console.log('🔍 Checking exercise library and user profile...\n')

  // First, get the most recent workout plan to find the user ID
  const { data: recentPlan, error: planError } = await supabase
    .from('user_workout_plans')
    .select('id, user_id, plan_name, ai_model_version, generation_parameters, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (planError || !recentPlan) {
    console.log('❌ Error fetching recent plan:', planError?.message || 'No plans found')
    return
  }

  const userId = recentPlan.user_id

  // Get user profile to check training style
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError) {
    console.log('❌ Error fetching profile:', profileError.message)
    return
  }

  console.log('👤 User Profile:')
  console.log('   Training Style:', profile.training_style)
  console.log('   Experience Level:', profile.experience_level)
  console.log('   Available Equipment:', profile.available_equipment || profile.custom_equipment)
  console.log('   Training Days/Week:', profile.training_days_per_week || profile.weekly_workout_goal)
  console.log('')

  // Map training style (same as the API does)
  let trainingStyle = profile.training_style
  if (trainingStyle === 'aesthetics') {
    trainingStyle = 'hypertrophy'
  } else if (trainingStyle === 'crossfit') {
    trainingStyle = 'mixed'
  }

  console.log('🎯 Mapped Training Style:', trainingStyle)
  console.log('')

  // Check total exercises in library
  const { data: allExercises, error: allError } = await supabase
    .from('exercise_library')
    .select('id, name, training_modality', { count: 'exact' })
    .eq('is_active', true)

  if (allError) {
    console.log('❌ Error fetching exercises:', allError.message)
    return
  }

  console.log('📚 Exercise Library:')
  console.log('   Total active exercises:', allExercises?.length || 0)
  console.log('')

  // Check exercises by training modality
  const modalityGroups = {}
  allExercises?.forEach(ex => {
    const modality = ex.training_modality || 'unknown'
    if (!modalityGroups[modality]) {
      modalityGroups[modality] = []
    }
    modalityGroups[modality].push(ex)
  })

  console.log('📊 Exercises by Training Modality:')
  for (const [modality, exercises] of Object.entries(modalityGroups)) {
    console.log(`   ${modality}: ${exercises.length} exercises`)
  }
  console.log('')

  // Check exercises for user's training style
  const { data: matchingExercises, error: matchError } = await supabase
    .from('exercise_library')
    .select('id, name, category, equipment, difficulty, primary_muscles, training_modality')
    .eq('is_active', true)
    .eq('training_modality', trainingStyle)

  if (matchError) {
    console.log('❌ Error fetching matching exercises:', matchError.message)
    return
  }

  console.log(`🎯 Exercises matching "${trainingStyle}" modality: ${matchingExercises?.length || 0}`)

  if (matchingExercises && matchingExercises.length > 0) {
    console.log('   ✅ GOOD - Exercises are available!')
    console.log('\n   Sample exercises:')
    matchingExercises.slice(0, 5).forEach(ex => {
      console.log(`   - ${ex.name} (${ex.category}, ${ex.difficulty})`)
    })
  } else {
    console.log('   ❌ PROBLEM - No exercises match this training style!')
    console.log('   This explains why the plan has 0 exercises.')
  }
  console.log('')

  console.log('📋 Most Recent Plan:')
  console.log('   Plan ID:', recentPlan.id)
  console.log('   Name:', recentPlan.plan_name)
  console.log('   Created:', new Date(recentPlan.created_at).toLocaleString())
  console.log('   Generation Params:', JSON.stringify(recentPlan.generation_parameters, null, 2))
}

checkExercises().catch(console.error)
