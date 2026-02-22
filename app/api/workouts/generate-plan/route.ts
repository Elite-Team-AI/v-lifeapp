import { NextRequest, NextResponse } from "next/server"
import { createClient, getAuthUser } from "@/lib/supabase/server"
import { env } from "@/lib/env"
import { z } from "zod"

// ========================
// VALIDATION SCHEMAS
// ========================

const workoutGenerationSchema = z.object({
  userId: z.string().uuid(),
  preferences: z.object({
    trainingStyle: z.enum(['strength', 'hypertrophy', 'endurance', 'power', 'HIIT', 'mobility', 'functional', 'mind_body', 'mixed']).optional(),
    daysPerWeek: z.number().min(1).max(7).optional(),
    sessionDurationMinutes: z.number().min(30).max(120).optional(),
    fitnessGoal: z.string().optional(),
    experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    availableEquipment: z.array(z.string()).optional(),
    excludeExercises: z.array(z.string()).optional(),
    focusAreas: z.array(z.string()).optional(),
  }),
})

type WorkoutGenerationInput = z.infer<typeof workoutGenerationSchema>

// ========================
// TYPES
// ========================

interface GeneratedWorkout {
  weekNumber: number
  workouts: Array<{
    dayOfWeek: number
    workoutName: string
    focusAreas: string[]
    estimatedDuration: number
    exercises: Array<{
      exerciseId: string
      exerciseOrder: number
      sets: number
      repsMin: number
      repsMax: number
      restSeconds: number
      tempo?: string
      rpe?: number
      notes?: string
    }>
  }>
}

interface GeneratedPlan {
  planName: string
  planType: string
  daysPerWeek: number
  splitPattern: string
  weeks: GeneratedWorkout[]
}

// ========================
// HELPER FUNCTIONS
// ========================

/**
 * Safe validation with detailed error reporting
 */
function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    throw new Error(`Validation failed: ${errors}`)
  }
  return result.data
}

/**
 * Build the comprehensive AI prompt for workout plan generation
 */
function buildWorkoutPlanPrompt(
  profile: any,
  exercises: any[],
  preferences: WorkoutGenerationInput['preferences']
): string {
  const trainingStyle = preferences.trainingStyle || 'mixed'
  const daysPerWeek = preferences.daysPerWeek || profile.training_days_per_week || 5
  const sessionDuration = preferences.sessionDurationMinutes || profile.available_time_minutes || 60
  const experienceLevel = preferences.experienceLevel || profile.experience_level || 'intermediate'
  const fitnessGoal = preferences.fitnessGoal || profile.primary_goal || 'general_fitness'

  // Format available exercises for the prompt (limit to 100 for token efficiency)
  const availableExercises = exercises.slice(0, 100).map(ex => {
    const fields = [
      `ID: ${ex.id}`,
      `Name: ${ex.name}`,
      `Category: ${ex.category}`,
      `Type: ${ex.exercise_type}`,
      `Primary: ${ex.primary_muscles?.join(', ') || 'N/A'}`,
      `Difficulty: ${ex.difficulty}`,
      `📊 Sets: ${ex.recommended_sets_min}-${ex.recommended_sets_max}`,
      `🔢 Reps: ${ex.recommended_reps_min}-${ex.recommended_reps_max}`,
      `⏱️ Rest: ${ex.recommended_rest_seconds_min}-${ex.recommended_rest_seconds_max}s`,
      `💪 Intensity: ${ex.intensity_percentage_min}-${ex.intensity_percentage_max}%`,
      ex.tempo ? `🎯 Tempo: ${ex.tempo}` : '',
      ex.recommended_rpe_min && ex.recommended_rpe_max ? `🔥 RPE: ${ex.recommended_rpe_min}-${ex.recommended_rpe_max}` : '',
    ].filter(Boolean)

    return `- ${fields.join(' | ')}`
  }).join('\n')

  const equipmentList = preferences.availableEquipment?.join(', ') || profile.available_equipment?.join(', ') || 'Full gym access'
  const excludedExercises = preferences.excludeExercises?.join(', ') || 'None'
  const focusAreas = preferences.focusAreas?.join(', ') || 'Balanced full-body'

  return `Generate a personalized 4-week workout mesocycle for a user with the following profile:

**USER PROFILE:**
- Age: ${profile.age || 'Unknown'}
- Gender: ${profile.gender || 'Unknown'}
- Experience Level: ${experienceLevel}
- Fitness Goal: ${fitnessGoal.replace(/_/g, ' ')}
- Training Style: ${trainingStyle.toUpperCase()}
- Days per week: ${daysPerWeek}
- Session duration: ${sessionDuration} minutes
- Available Equipment: ${equipmentList}
- Focus Areas: ${focusAreas}
- Excluded Exercises: ${excludedExercises}

**AVAILABLE EXERCISES (${exercises.length} total, showing top 100 - PRE-FILTERED FOR ${trainingStyle.toUpperCase()} MODALITY):**

${availableExercises}

**CRITICAL MANDATORY REQUIREMENTS:**

1. **Exercise Selection:**
   - ONLY use exercise IDs from the available exercises list above
   - Use EXACT UUIDs provided (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
   - For ${sessionDuration}-minute workouts: MINIMUM 7 exercises (Target: 8-9)
   - For 45-minute workouts: MINIMUM 6 exercises (Target: 7-8)
   - For 30-minute workouts: MINIMUM 5 exercises (Target: 6-7)

2. **Set Volume:**
   - For ${sessionDuration}-minute workouts: MINIMUM 12 total sets
   - For 45-minute workouts: MINIMUM 10 total sets
   - For 30-minute workouts: MINIMUM 8 total sets
   - Each exercise needs 2-4 sets minimum (match recommended_sets_min/max from exercise data)

3. **Rep Ranges:**
   - Use the recommended_reps_min and recommended_reps_max from each exercise
   - Respect the training modality guidelines (${trainingStyle})
   - Progressive overload through weeks (Week 1 baseline → Week 3 peak → Week 4 deload)

4. **Rest Periods:**
   - Use recommended_rest_seconds_min/max from exercise data
   - Adjust based on intensity and training phase

5. **RPE/Intensity:**
   - Use recommended_rpe_min/max when provided
   - Follow intensity_percentage_min/max guidelines
   - Progressive: Week 1 (RPE 7-8) → Week 2 (RPE 8-8.5) → Week 3 (RPE 8.5-9.5) → Week 4 (RPE 6-7)

**4-WEEK MESOCYCLE STRUCTURE:**

**Week 1: Baseline/Learning Phase**
- Volume: Baseline (100%)
- Intensity: Moderate (RPE 7-8)
- Focus: Learn movement patterns, establish baseline performance
- Sets: Use lower end of recommended sets range
- Reps: Use middle of recommended reps range

**Week 2: Volume Increase**
- Volume: +10% from baseline
- Intensity: Moderate-High (RPE 8-8.5)
- Focus: Build work capacity, increase time under tension
- Sets: Increase by 1 set per exercise OR add 1 exercise
- Reps: Use upper end of recommended reps range

**Week 3: Peak Week**
- Volume: Highest (maintain Week 2 volume)
- Intensity: High (RPE 8.5-9.5)
- Focus: Maximum stimulus, peak performance
- Sets: Maintain Week 2 sets
- Reps: Use lower end of reps range (higher weight)
- Add intensity techniques if appropriate (drop sets, rest-pause)

**Week 4: Deload/Recovery**
- Volume: 60-70% of baseline
- Intensity: Low-Moderate (RPE 6-7)
- Focus: Recovery, tissue repair, nervous system restoration
- Sets: Reduce to 2-3 sets per exercise
- Reps: Use middle of reps range (lighter weight)
- Optional: Replace some exercises with mobility/flexibility work

**TRAINING MODALITY-SPECIFIC PROGRAMMING (${trainingStyle.toUpperCase()}):**

${getModalityGuidelines(trainingStyle, daysPerWeek)}

**WORKOUT SPLIT PATTERN (${daysPerWeek} days/week):**

${getSplitPattern(daysPerWeek, trainingStyle)}

**OUTPUT FORMAT:**
Return ONLY a valid JSON object (no markdown, no explanation):

{
  "planName": "Descriptive plan name (e.g., '4-Week Hypertrophy Mesocycle')",
  "planType": "${trainingStyle}",
  "daysPerWeek": ${daysPerWeek},
  "splitPattern": "Brief description of split (e.g., 'Push/Pull/Legs')",
  "weeks": [
    {
      "weekNumber": 1,
      "workouts": [
        {
          "dayOfWeek": 1,
          "workoutName": "Descriptive name (e.g., 'Push Day - Chest & Shoulders')",
          "focusAreas": ["chest", "shoulders", "triceps"],
          "estimatedDuration": ${sessionDuration},
          "exercises": [
            {
              "exerciseId": "EXACT UUID FROM AVAILABLE EXERCISES LIST",
              "exerciseOrder": 1,
              "sets": 4,
              "repsMin": 8,
              "repsMax": 12,
              "restSeconds": 90,
              "tempo": "3-0-1-1",
              "rpe": 8.0,
              "notes": "Optional coaching cue"
            }
          ]
        }
      ]
    }
  ]
}

**VALIDATION CHECKLIST (AI MUST VERIFY BEFORE RETURNING):**
✓ Exactly 4 weeks in "weeks" array
✓ Each week has ${daysPerWeek} workouts
✓ Each workout has minimum required exercises (7+ for 60min, 6+ for 45min, 5+ for 30min)
✓ Each workout has minimum required total sets (12+ for 60min, 10+ for 45min, 8+ for 30min)
✓ ALL exerciseId values are valid UUIDs from the available exercises list
✓ Week 4 has reduced volume (60-70% of Week 1)
✓ Progressive overload evident Week 1→2→3
✓ Rep ranges match exercise recommendations
✓ Rest periods match exercise recommendations
✓ Equipment requirements match user's available equipment
✓ No excluded exercises are used`
}

/**
 * Get modality-specific programming guidelines
 */
function getModalityGuidelines(modality: string, daysPerWeek: number): string {
  const guidelines: Record<string, string> = {
    strength: `
**STRENGTH MODALITY:**
- Primary Focus: Maximum force production, neural adaptations
- Intensity: 85-95% 1RM
- Rep Range: 3-6 reps per set
- Rest Periods: 240-300 seconds (4-5 minutes)
- Tempo: Explosive concentric (X), controlled eccentric (3-4 seconds)
- Exercise Selection: Compound movements (squat, deadlift, bench, overhead press)
- Sets: 4-6 per exercise
- Frequency: Each major lift 2-3x per week
- Progression: Add 2.5-5lbs weekly or reduce rest periods`,

    hypertrophy: `
**HYPERTROPHY MODALITY:**
- Primary Focus: Muscle growth, metabolic stress, time under tension
- Intensity: 70-80% 1RM
- Rep Range: 8-12 reps per set
- Rest Periods: 90-120 seconds
- Tempo: Controlled (3-0-1-1: 3s eccentric, 0s pause, 1s concentric, 1s squeeze)
- Exercise Selection: Mix of compound and isolation movements
- Sets: 3-4 per exercise
- Volume: 12-20 sets per muscle group per week
- Progression: Increase reps, then weight, then sets`,

    endurance: `
**ENDURANCE MODALITY:**
- Primary Focus: Muscular endurance, aerobic capacity
- Intensity: 50-65% 1RM
- Rep Range: 15-20 reps per set
- Rest Periods: 45-60 seconds
- Tempo: Steady pace (2-0-2-0)
- Exercise Selection: Full-body, circuit-friendly movements
- Sets: 2-3 per exercise
- Progression: Increase reps, reduce rest, add circuits`,

    power: `
**POWER MODALITY:**
- Primary Focus: Explosive force, rate of force development
- Intensity: 75-90% 1RM
- Rep Range: 3-5 reps (EXPLOSIVE)
- Rest Periods: 180-240 seconds (3-4 minutes)
- Tempo: X-0-3-0 (explosive concentric, controlled eccentric)
- Exercise Selection: Olympic lifts, plyometrics, jump variations
- Sets: 3-5 per exercise
- Quality over quantity - stop before fatigue degrades speed
- Progression: Increase load while maintaining bar speed`,

    HIIT: `
**HIIT MODALITY:**
- Primary Focus: Metabolic conditioning, anaerobic capacity
- Work:Rest Ratios: 1:1 to 1:3 (e.g., 30s work, 30-90s rest)
- Intensity: 85-95% max effort during work intervals
- Exercise Selection: Full-body, high-energy movements
- Rounds: 4-8 rounds per circuit
- Total Duration: 20-30 minutes including rest
- Progression: Increase work time, decrease rest time, add rounds`,

    mobility: `
**MOBILITY MODALITY:**
- Primary Focus: Joint range of motion, tissue quality
- Intensity: Controlled, sub-maximal
- Hold Time: 30-90 seconds per position
- Sets: 2-3 per movement
- Exercise Selection: Dynamic stretches, yoga flows, controlled articular rotations
- Rest: Minimal (transition time only)
- Progression: Increase ROM, hold time, complexity`,

    functional: `
**FUNCTIONAL MODALITY:**
- Primary Focus: Multi-planar movement, real-world strength
- Intensity: 65-80% 1RM
- Rep Range: 6-10 reps per set
- Rest Periods: 90-120 seconds
- Exercise Selection: Multi-joint, multi-planar movements (lunges, rotations, carries)
- Sets: 3-4 per exercise
- Include unilateral work, core stability, movement prep
- Progression: Increase complexity, then load`,

    mind_body: `
**MIND-BODY MODALITY:**
- Primary Focus: Body awareness, breath control, mindfulness
- Intensity: Low-moderate, emphasis on control
- Hold Time: 30-120 seconds per position
- Exercise Selection: Yoga, Pilates, Tai Chi movements
- Sets: 2-3 flows per session
- Rest: Active recovery with breathing exercises
- Progression: Increase hold time, complexity of flows`,

    mixed: `
**MIXED MODALITY:**
- Combines elements from multiple training styles
- Vary intensity throughout week: Heavy (85%+), Moderate (70-80%), Light (50-65%)
- Include: Compound strength, hypertrophy isolation, conditioning, mobility
- Balance pushing, pulling, squatting, hinging, carrying movements
- Progression: Periodize across weeks (strength → hypertrophy → endurance → power)`
  }

  return guidelines[modality] || guidelines.mixed
}

/**
 * Get split pattern recommendations based on training frequency
 */
function getSplitPattern(daysPerWeek: number, modality: string): string {
  if (daysPerWeek === 3) {
    return `3-Day Full Body Split:
- Day 1: Upper Body Focus (Push-dominant)
- Day 2: Lower Body Focus (Squat/Hip Hinge)
- Day 3: Full Body Hybrid (Pull-dominant + Accessories)`
  }

  if (daysPerWeek === 4) {
    return `4-Day Upper/Lower Split:
- Day 1: Upper Body Push (Chest, Shoulders, Triceps)
- Day 2: Lower Body (Quads, Hamstrings, Glutes, Calves)
- Day 3: Upper Body Pull (Back, Biceps, Rear Delts)
- Day 4: Lower Body Accessory (Single-leg, Core, Mobility)`
  }

  if (daysPerWeek === 5) {
    return `5-Day Push/Pull/Legs Split:
- Day 1: Push (Chest, Shoulders, Triceps)
- Day 2: Pull (Back, Biceps, Rear Delts)
- Day 3: Legs (Quads, Hamstrings, Glutes, Calves)
- Day 4: Upper Body Hypertrophy (Compound + Isolation)
- Day 5: Lower Body Power/Athleticism`
  }

  if (daysPerWeek === 6) {
    return `6-Day Push/Pull/Legs x2 Split:
- Day 1: Push (Strength Focus - Heavy compounds)
- Day 2: Pull (Strength Focus - Heavy compounds)
- Day 3: Legs (Strength Focus - Heavy squats/deads)
- Day 4: Push (Hypertrophy Focus - Volume work)
- Day 5: Pull (Hypertrophy Focus - Volume work)
- Day 6: Legs (Hypertrophy/Accessories)`
  }

  // Default: flexible
  return `Flexible ${daysPerWeek}-Day Split: Distribute workouts across push, pull, legs, and conditioning sessions based on training modality.`
}

/**
 * Validate generated plan structure
 */
function validatePlanStructure(plan: any): string | null {
  if (!Array.isArray(plan.weeks) || plan.weeks.length !== 4) {
    return 'Plan must have exactly 4 weeks'
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  for (let weekIdx = 0; weekIdx < plan.weeks.length; weekIdx++) {
    const week = plan.weeks[weekIdx]

    if (!Array.isArray(week.workouts)) {
      return `Week ${weekIdx + 1}: Missing workouts array`
    }

    for (let workoutIdx = 0; workoutIdx < week.workouts.length; workoutIdx++) {
      const workout = week.workouts[workoutIdx]
      const duration = workout.estimatedDuration || 60

      // Determine minimum exercises based on duration
      let minExercises = 7
      if (duration <= 45) minExercises = 6
      if (duration <= 30) minExercises = 5

      if (!workout.exercises || workout.exercises.length < minExercises) {
        return `Week ${weekIdx + 1}, Workout ${workoutIdx + 1}: Has only ${workout.exercises?.length || 0} exercises. Minimum ${minExercises} required for ${duration}-minute workout.`
      }

      // Check total sets
      const totalSets = workout.exercises.reduce((sum: number, ex: any) => sum + (ex.sets || 0), 0)
      let minSets = 12
      if (duration <= 45) minSets = 10
      if (duration <= 30) minSets = 8

      if (totalSets < minSets) {
        return `Week ${weekIdx + 1}, Workout ${workoutIdx + 1}: Has only ${totalSets} total sets. Minimum ${minSets} required for ${duration}-minute workout.`
      }

      // Validate exercise IDs
      for (const exercise of workout.exercises) {
        if (!uuidRegex.test(exercise.exerciseId)) {
          return `Week ${weekIdx + 1}, Workout ${workoutIdx + 1}: Invalid exercise ID format: ${exercise.exerciseId}`
        }
      }
    }
  }

  // Week 4 should have reduced volume (deload)
  const week1TotalSets = plan.weeks[0].workouts.reduce((sum: number, w: any) =>
    sum + w.exercises.reduce((s: number, e: any) => s + (e.sets || 0), 0), 0
  )
  const week4TotalSets = plan.weeks[3].workouts.reduce((sum: number, w: any) =>
    sum + w.exercises.reduce((s: number, e: any) => s + (e.sets || 0), 0), 0
  )

  if (week4TotalSets >= week1TotalSets * 0.75) {
    return `Week 4 deload is insufficient. Week 4 has ${week4TotalSets} sets vs Week 1's ${week1TotalSets} sets. Week 4 should be 60-70% of Week 1.`
  }

  return null
}

/**
 * Save generated plan to database
 */
async function savePlanToDatabase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  generatedPlan: GeneratedPlan,
  profile: any,
  preferences: WorkoutGenerationInput['preferences']
): Promise<{ planId: string; startDate: Date; endDate: Date }> {
  const startDate = new Date()
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 28) // 4 weeks

  // 1. Create main workout plan
  const { data: planData, error: planError } = await supabase
    .from('user_workout_plans')
    .insert({
      user_id: userId,
      plan_name: generatedPlan.planName,
      plan_type: generatedPlan.planType,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      weeks_duration: 4,
      days_per_week: generatedPlan.daysPerWeek,
      split_pattern: generatedPlan.splitPattern,
      available_equipment: preferences.availableEquipment || profile.available_equipment || [],
      status: 'active',
      ai_model_version: 'gpt-4o',
      generation_parameters: preferences,
    })
    .select('id')
    .single()

  if (planError || !planData) {
    console.error('[WorkoutGen] Failed to create plan:', planError)
    throw new Error('Unable to create workout plan')
  }

  const planId = planData.id

  // 2. Create workouts and exercises for each week
  for (const week of generatedPlan.weeks) {
    for (const workout of week.workouts) {
      // Calculate scheduled date
      const scheduledDate = new Date(startDate)
      const daysOffset = (week.weekNumber - 1) * 7 + (workout.dayOfWeek - 1)
      scheduledDate.setDate(scheduledDate.getDate() + daysOffset)

      // Create workout record
      const { data: workoutData, error: workoutError } = await supabase
        .from('plan_workouts')
        .insert({
          plan_id: planId,
          user_id: userId,
          workout_name: workout.workoutName,
          week_number: week.weekNumber,
          day_of_week: workout.dayOfWeek,
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          estimated_duration_minutes: workout.estimatedDuration,
          focus_areas: workout.focusAreas || [],
          status: 'pending',
        })
        .select('id')
        .single()

      if (workoutError || !workoutData) {
        console.error('[WorkoutGen] Failed to create workout:', workoutError)
        continue
      }

      const workoutId = workoutData.id

      // Create exercise records for this workout
      const exerciseInserts = workout.exercises.map(exercise => ({
        workout_id: workoutId,
        exercise_id: exercise.exerciseId,
        user_id: userId,
        exercise_order: exercise.exerciseOrder,
        target_sets: exercise.sets,
        target_reps_min: exercise.repsMin,
        target_reps_max: exercise.repsMax,
        rest_seconds: exercise.restSeconds,
        tempo: exercise.tempo || null,
        target_rpe: exercise.rpe || null,
        notes: exercise.notes || null,
      }))

      const { error: exercisesError } = await supabase
        .from('plan_exercises')
        .insert(exerciseInserts)

      if (exercisesError) {
        console.error('[WorkoutGen] Failed to create exercises:', exercisesError)
      }
    }
  }

  return { planId, startDate, endDate }
}

// ========================
// API ROUTE HANDLER
// ========================

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { user, error: authError } = await getAuthUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // 2. Check OpenAI API key availability
    if (!env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI workout generation is not configured. Please contact support.' },
        { status: 503 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validated = safeValidate(workoutGenerationSchema, body)
    const { userId, preferences } = validated

    // Security: Ensure user can only generate plans for themselves
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // 4. Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // 5. Fetch ALL active exercises first (smart filtering with fallback)
    const trainingStyle = preferences.trainingStyle || profile.training_style || 'mixed'
    const availableEquipment = preferences.availableEquipment || profile.available_equipment || []
    const excludedIds = preferences.excludeExercises || []

    const { data: allExercises, error: exercisesError } = await supabase
      .from('exercise_library')
      .select('*')
      .eq('is_active', true)

    if (exercisesError || !allExercises || allExercises.length === 0) {
      return NextResponse.json(
        { error: 'No exercises found in the library. Please contact support.' },
        { status: 404 }
      )
    }

    // Helper function to filter exercises by equipment
    const filterByEquipment = (exercises: any[]) => {
      return exercises.filter(ex => {
        // No equipment required = always included
        if (!ex.equipment || ex.equipment.length === 0) return true
        // No equipment available = only bodyweight exercises
        if (!availableEquipment || availableEquipment.length === 0) {
          return ex.equipment.length === 0
        }
        // Has equipment = check if any required equipment is available
        return ex.equipment.some((eq: string) => availableEquipment.includes(eq))
      })
    }

    // Helper function to filter by modality
    const filterByModality = (exercises: any[], modality: string) => {
      if (modality === 'mixed') return exercises
      return exercises.filter(ex => ex.training_modality === modality)
    }

    // Helper function to remove excluded exercises
    const removeExcluded = (exercises: any[]) => {
      if (!excludedIds || excludedIds.length === 0) return exercises
      return exercises.filter(ex => !excludedIds.includes(ex.id))
    }

    // 6. Smart filtering strategy with 4-tier fallback
    let finalExercises: any[] = []
    let filteringStrategy = ''

    // Strategy 1: Try strict filtering (modality + equipment + exclusions)
    let filtered = filterByModality(allExercises, trainingStyle)
    filtered = filterByEquipment(filtered)
    filtered = removeExcluded(filtered)

    if (filtered.length >= 12) {
      finalExercises = filtered
      filteringStrategy = 'strict'
      console.log('[WorkoutGen] Using strict filtering:', filtered.length, 'exercises')
    }
    // Strategy 2: Relax modality constraint if not enough exercises
    else if (filtered.length < 12) {
      console.log('[WorkoutGen] Only', filtered.length, 'with strict filter, relaxing modality...')
      filtered = filterByEquipment(allExercises)
      filtered = removeExcluded(filtered)

      if (filtered.length >= 8) {
        finalExercises = filtered
        filteringStrategy = 'mixed-modality'
        console.log('[WorkoutGen] Using mixed modality filtering:', filtered.length, 'exercises')
      }
      // Strategy 3: Include ALL equipment-compatible exercises (ignore exclusions if needed)
      else {
        console.log('[WorkoutGen] Only', filtered.length, 'exercises, including all compatible...')
        filtered = filterByEquipment(allExercises)

        if (filtered.length >= 5) {
          finalExercises = filtered
          filteringStrategy = 'inclusive'
          console.log('[WorkoutGen] Using inclusive filtering:', filtered.length, 'exercises')
        }
        // Strategy 4: Last resort - use what we have
        else {
          console.log('[WorkoutGen] Very limited exercises, using all available')
          finalExercises = allExercises.slice(0, Math.max(filtered.length, 10))
          filteringStrategy = 'minimal'
        }
      }
    }

    // 7. Absolute minimum check (reduced from 20 to 5 for flexibility)
    if (finalExercises.length < 5) {
      return NextResponse.json(
        {
          error: `Unable to generate a workout plan. Only ${finalExercises.length} exercises available. Please add more equipment options or contact support.`,
          details: {
            finalCount: finalExercises.length,
            minimumRequired: 5,
            trainingStyle,
            availableEquipment: availableEquipment.length > 0 ? availableEquipment : ['bodyweight only']
          }
        },
        { status: 400 }
      )
    }

    // 8. Build AI prompt
    const prompt = buildWorkoutPlanPrompt(profile, finalExercises, preferences)

    // 9. Call OpenAI API
    console.log('[WorkoutGen] Calling OpenAI API...')
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 4000,
        messages: [
          {
            role: 'system',
            content: 'You are an expert fitness coach and exercise physiologist. Generate scientifically-backed workout programs following evidence-based programming principles. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      console.error('[WorkoutGen] OpenAI API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to generate workout plan. Please try again.' },
        { status: 500 }
      )
    }

    const completion = await response.json()
    const aiResponse = completion.choices?.[0]?.message?.content

    if (!aiResponse) {
      console.error('[WorkoutGen] No response from OpenAI')
      return NextResponse.json(
        { error: 'No response from AI. Please try again.' },
        { status: 500 }
      )
    }

    // 10. Parse and validate AI response
    let generatedPlan: GeneratedPlan
    try {
      generatedPlan = JSON.parse(aiResponse)
    } catch (parseError) {
      console.error('[WorkoutGen] Failed to parse AI response:', parseError)
      return NextResponse.json(
        { error: 'Invalid AI response format. Please try again.' },
        { status: 500 }
      )
    }

    // 11. Validate plan structure
    const validationError = validatePlanStructure(generatedPlan)
    if (validationError) {
      console.error('[WorkoutGen] Plan validation failed:', validationError)
      return NextResponse.json(
        { error: `Generated plan validation failed: ${validationError}` },
        { status: 400 }
      )
    }

    // 12. Save plan to database
    console.log('[WorkoutGen] Saving plan to database...')
    const savedPlan = await savePlanToDatabase(supabase, userId, generatedPlan, profile, preferences)

    // 13. Return success response
    return NextResponse.json({
      success: true,
      planId: savedPlan.planId,
      planName: generatedPlan.planName,
      startDate: savedPlan.startDate.toISOString(),
      endDate: savedPlan.endDate.toISOString(),
      daysPerWeek: generatedPlan.daysPerWeek,
      totalWorkouts: generatedPlan.weeks.reduce((sum, week) => sum + week.workouts.length, 0),
    })

  } catch (error) {
    console.error('[WorkoutGen] Unexpected error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate workout plan',
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
