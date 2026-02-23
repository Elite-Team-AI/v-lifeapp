"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient, getAuthUser } from "@/lib/supabase/server"
import { env } from "@/lib/env"
import OpenAI from "openai"
import { generateWeekFast } from "./generate-week-fast"

// ========================
// TYPES
// ========================

export interface WorkoutPlanSummary {
  id: string
  planName: string
  planType: string
  startDate: string
  endDate: string
  weeksRemaining: number
  currentWeek: number
  daysPerWeek: number
  splitPattern: string
  status: 'active' | 'completed' | 'paused'
  progressPercentage: number
}

export interface WorkoutPlanDetails extends WorkoutPlanSummary {
  weeks: Array<{
    weekNumber: number
    workouts: Array<{
      id: string
      workoutName: string
      dayOfWeek: number
      scheduledDate: string
      status: 'pending' | 'in_progress' | 'completed' | 'skipped'
      estimatedDuration: number
      focusAreas: string[]
      exercises: Array<{
        id: string
        exerciseId: string
        exerciseName: string
        primaryMuscles: string[]
        category: string
        exerciseOrder: number
        targetSets: number
        targetRepsMin: number
        targetRepsMax: number
        restSeconds: number
        tempo?: string
        targetRpe?: number
        notes?: string
        completedSets: number
        isCompleted: boolean
      }>
    }>
  }>
}

export interface WorkoutSession {
  workoutId: string
  planId: string
  workoutName: string
  weekNumber: number
  scheduledDate: string
  estimatedDuration: number
  focusAreas: string[]
  exercises: Array<{
    id: string
    exerciseId: string
    exerciseName: string
    primaryMuscles: string[]
    secondaryMuscles: string[]
    category: string
    difficulty: string
    exerciseOrder: number
    targetSets: number
    targetRepsMin: number
    targetRepsMax: number
    restSeconds: number
    tempo?: string
    targetRpe?: number
    notes?: string
    completedSets: number
    isCompleted: boolean
    instructions?: string
    cues?: string[]
    // Performance history
    lastWeight?: number
    lastReps?: number
    estimatedOneRepMax?: number
    personalRecord?: {
      weight: number
      reps: number
      date: string
    }
  }>
}

export interface ExerciseLogInput {
  planExerciseId: string
  workoutId: string
  exerciseId: string
  setNumber: number
  reps: number
  weight: number
  unit: 'lbs' | 'kg'
  rpe?: number
  notes?: string
}

export interface WorkoutPlanPreferences {
  trainingStyle?: 'strength' | 'hypertrophy' | 'endurance' | 'power' | 'HIIT' | 'mobility' | 'functional' | 'mind_body' | 'mixed'
  daysPerWeek?: number
  sessionDurationMinutes?: number
  fitnessGoal?: string
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  availableEquipment?: string[]
  excludeExercises?: string[]
  focusAreas?: string[]
}

// ========================
// SERVER ACTIONS
// ========================

/**
 * Generate a new AI-powered workout plan
 * Now calls OpenAI directly instead of using internal API route to avoid auth issues
 */
export async function generateWorkoutPlan(preferences: WorkoutPlanPreferences) {
  const { user, error: authError } = await getAuthUser()

  if (authError || !user) {
    console.error('[generateWorkoutPlan] Authentication failed:', authError)
    return { success: false, error: 'Not authenticated' }
  }

  console.log('[generateWorkoutPlan] Starting plan generation for user:', user.id)
  console.log('[generateWorkoutPlan] Preferences:', JSON.stringify(preferences, null, 2))

  try {
    // Check OpenAI API key
    if (!env.OPENAI_API_KEY) {
      console.error('[generateWorkoutPlan] Missing OpenAI API key')
      return {
        success: false,
        error: 'AI workout generation is not configured. Please contact support.'
      }
    }

    const supabase = await createClient()

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'User profile not found' }
    }

    // Fetch exercises with smart fallback strategy
    const trainingStyle = preferences.trainingStyle || profile.training_style || 'mixed'
    const availableEquipment = preferences.availableEquipment || profile.available_equipment || []
    const excludedIds = preferences.excludeExercises || []

    // Fetch ALL active exercises first
    const { data: allExercises, error: exercisesError } = await supabase
      .from('exercise_library')
      .select('*')
      .eq('is_active', true)

    if (exercisesError || !allExercises || allExercises.length === 0) {
      return {
        success: false,
        error: 'No exercises found in the library. Please contact support.'
      }
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

    // Smart filtering strategy with fallback
    let finalExercises: any[] = []
    let filteringStrategy = ''

    // Strategy 1: Try strict filtering (modality + equipment + exclusions)
    let filtered = filterByModality(allExercises, trainingStyle)
    filtered = filterByEquipment(filtered)
    filtered = removeExcluded(filtered)

    if (filtered.length >= 12) {
      finalExercises = filtered
      filteringStrategy = 'strict'
      console.log('[generateWorkoutPlan] Using strict filtering:', filtered.length, 'exercises')
    }
    // Strategy 2: Relax modality constraint if not enough exercises
    else if (filtered.length < 12) {
      console.log('[generateWorkoutPlan] Only', filtered.length, 'with strict filter, relaxing modality...')
      filtered = filterByEquipment(allExercises)
      filtered = removeExcluded(filtered)

      if (filtered.length >= 8) {
        finalExercises = filtered
        filteringStrategy = 'mixed-modality'
        console.log('[generateWorkoutPlan] Using mixed modality filtering:', filtered.length, 'exercises')
      }
      // Strategy 3: Include ALL equipment-compatible exercises (ignore exclusions if needed)
      else {
        console.log('[generateWorkoutPlan] Only', filtered.length, 'exercises, including all compatible...')
        filtered = filterByEquipment(allExercises)

        if (filtered.length >= 5) {
          finalExercises = filtered
          filteringStrategy = 'inclusive'
          console.log('[generateWorkoutPlan] Using inclusive filtering:', filtered.length, 'exercises')
        }
        // Strategy 4: Last resort - use what we have
        else {
          console.log('[generateWorkoutPlan] Very limited exercises, using all available')
          finalExercises = allExercises.slice(0, Math.max(filtered.length, 10))
          filteringStrategy = 'minimal'
        }
      }
    }

    // Absolute minimum check
    if (finalExercises.length < 5) {
      return {
        success: false,
        error: `Unable to generate a workout plan. Only ${finalExercises.length} exercises available. Please add more equipment options or contact support.`
      }
    }

    // Build AI prompt with adaptive guidance
    const daysPerWeek = preferences.daysPerWeek || profile.training_days_per_week || 5
    const sessionDuration = preferences.sessionDurationMinutes || profile.available_time_minutes || 60
    const experienceLevel = preferences.experienceLevel || profile.experience_level || 'intermediate'
    const fitnessGoal = preferences.fitnessGoal || profile.primary_goal || 'general_fitness'

    // Map internal training style to user-friendly display name for AI prompts
    const trainingStyleDisplay = trainingStyle === 'hypertrophy' ? 'Bodybuilding' :
                                  trainingStyle === 'mind_body' ? 'Mind-Body' :
                                  trainingStyle.toUpperCase() === 'HIIT' ? 'HIIT' :
                                  trainingStyle.charAt(0).toUpperCase() + trainingStyle.slice(1)

    // Calculate optimal exercises per workout based on available pool
    const exercisesPerWorkout = Math.max(
      4, // Minimum 4 exercises per workout
      Math.min(
        9, // Maximum 9 exercises per workout
        Math.floor(finalExercises.length / (daysPerWeek * 0.7)) // Allow 70% reuse across workouts
      )
    )

    // Provide top 40 exercises (sufficient for 4-week plan variation while reducing prompt tokens)
    // For a 4-week plan with 4-9 exercises per workout, 40 exercises allows ample variety
    const exercisesToProvide = finalExercises.slice(0, 40)
    const availableExercises = exercisesToProvide.map(ex =>
      `ID: ${ex.id} | ${ex.name} (${ex.category}) - ${ex.primary_muscles?.join(', ') || 'full body'}`
    ).join('\n')

    // Build adaptive instructions based on exercise pool size
    let adaptiveInstructions = ''
    if (finalExercises.length < 12) {
      adaptiveInstructions = `
IMPORTANT: Limited exercise pool (${finalExercises.length} exercises). Adapt by:
- Reuse exercises across different workouts with varied set/rep schemes
- Use different tempos (e.g., slow eccentric) to create variation
- Vary rest periods and RPE targets
- Include unilateral variations when possible
- Focus on progressive overload across weeks`
    } else if (finalExercises.length < 25) {
      adaptiveInstructions = `
NOTE: Moderate exercise pool (${finalExercises.length} exercises). Create variety by:
- Strategic exercise reuse with different parameters
- Progressive volume/intensity across weeks
- Varied tempo and rest periods`
    } else {
      adaptiveInstructions = `
NOTE: Good exercise variety (${finalExercises.length} exercises). Maximize quality by:
- Minimizing exercise repetition across workouts
- Optimal exercise selection for muscle groups
- Progressive overload principles`
    }

    // Validation function for generated plan structure (adapted from Reborn)
    const validatePlanStructure = (plan: any): string | null => {
      if (!plan.planName || typeof plan.planName !== 'string') {
        return 'Missing or invalid planName'
      }

      if (!plan.planType || typeof plan.planType !== 'string') {
        return 'Missing or invalid planType'
      }

      if (!plan.daysPerWeek || typeof plan.daysPerWeek !== 'number') {
        return 'Missing or invalid daysPerWeek'
      }

      if (!Array.isArray(plan.weeks) || plan.weeks.length !== 4) {
        return 'Must have exactly 4 weeks'
      }

      for (let i = 0; i < plan.weeks.length; i++) {
        const week = plan.weeks[i]

        if (week.weekNumber !== i + 1) {
          return `Week ${i + 1} has incorrect weekNumber`
        }

        if (!Array.isArray(week.workouts)) {
          return `Week ${i + 1} missing workouts array`
        }

        for (const workout of week.workouts) {
          if (!workout.workoutName) {
            return 'Workout missing name'
          }

          if (!Array.isArray(workout.exercises)) {
            return 'Workout missing exercises array'
          }

          // Validate minimum exercise count based on workout duration
          const duration = workout.estimatedDuration || sessionDuration
          let minExercises = 5 // Default minimum

          if (duration >= 60) {
            minExercises = 7 // 60+ minute workouts need at least 7 exercises
          } else if (duration >= 45) {
            minExercises = 6 // 45+ minute workouts need at least 6 exercises
          }

          if (workout.exercises.length < minExercises) {
            return `Workout "${workout.workoutName}" (${duration} min) has only ${workout.exercises.length} exercises. Minimum ${minExercises} required for proper volume.`
          }

          // Validate total sets per workout
          const totalSets = workout.exercises.reduce((sum: number, ex: any) => sum + (ex.sets || 0), 0)
          const minSets = duration >= 60 ? 12 : duration >= 45 ? 12 : 10

          if (totalSets < minSets) {
            return `Workout "${workout.workoutName}" has only ${totalSets} total sets. Minimum ${minSets} required for ${duration}-minute workout.`
          }

          // Validate each exercise
          for (const exercise of workout.exercises) {
            if (!exercise.exerciseId || !exercise.exerciseName) {
              return 'Exercise missing ID or name'
            }

            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (!uuidRegex.test(exercise.exerciseId)) {
              return `Exercise "${exercise.exerciseName}" has invalid ID format. Must be a UUID from available exercises list.`
            }

            if (typeof exercise.sets !== 'number' || exercise.sets < 1) {
              return `Exercise "${exercise.exerciseName}" has invalid sets count`
            }
          }
        }
      }

      return null // Valid
    }

    // Enhanced prompt for generating complete 4-week plan
    const buildCompletePlanPrompt = (): string => {
      return `Generate a personalized 4-WEEK workout mesocycle for a user with the following profile:

**USER PROFILE:**
- Experience Level: ${experienceLevel}
- Fitness Goal: ${fitnessGoal}
- Days per Week: ${daysPerWeek}
- Session Duration: ${sessionDuration} minutes
- Training Style: ${trainingStyleDisplay}

${adaptiveInstructions}

**AVAILABLE EXERCISES (${exercisesToProvide.length} exercises):**
${availableExercises}

**CRITICAL MANDATORY REQUIREMENTS - FOLLOW EXACTLY:**

⚠️ **BEFORE OUTPUT: COUNT EXERCISES IN EACH WORKOUT** ⚠️

**VALIDATION CHECKLIST (MUST BE 100% CHECKED):**
- [ ] Does EVERY ${sessionDuration}-minute workout have AT LEAST ${exercisesPerWorkout} exercises?
- [ ] Does EVERY workout have AT LEAST ${sessionDuration >= 60 ? '12' : '10'} total sets?
- [ ] Does each exercise have 2-3 sets (NOT just 1 set)?
- [ ] Have I used EXACT UUIDs from the available exercises list?
- [ ] Does my plan have EXACTLY 4 weeks?

**IF ANY CHECKBOX IS UNCHECKED, GO BACK AND FIX IT NOW.**

**REQUIREMENTS:**

1. **4-Week Mesocycle Structure:**
   - Week 1: Baseline (moderate volume)
   - Week 2: Volume increase (+10%)
   - Week 3: Peak intensity
   - Week 4: Deload (60-70% volume for recovery)

2. **Progressive Overload:**
   - Increase weight OR reps OR sets each week (Weeks 1-3)
   - Week 4 reduces volume for recovery

3. **Exercise Selection - CRITICAL:**
   - MUST use EXACT UUIDs from available exercises list
   - DO NOT generate sequential numbers like "1", "2", "3"
   - Include ${exercisesPerWorkout} exercises per workout minimum
   - 2-3 sets per exercise (minimum 2 sets)
   - Total sets per workout: ${sessionDuration >= 60 ? '12-16' : '10-14'}

4. **Workout Structure:**
   - Each week has ${daysPerWeek} workouts
   - Each workout is approximately ${sessionDuration} minutes
   - Balance muscle groups and recovery
   - Progressive difficulty across weeks 1-3

**FINAL PRE-OUTPUT CHECKLIST:**

Before you output JSON, verify:
1. Plan has EXACTLY 4 weeks in "weeks" array
2. Each week has ${daysPerWeek} workouts
3. Each ${sessionDuration}-min workout has ${exercisesPerWorkout}+ exercises
4. Each workout has ${sessionDuration >= 60 ? '12' : '10'}+ total sets
5. Exercise IDs are UUIDs from available list

**OUTPUT FORMAT (JSON):**

{
  "planName": "${trainingStyleDisplay} 4-Week Plan",
  "planType": "custom",
  "daysPerWeek": ${daysPerWeek},
  "splitPattern": "training split description",
  "weeks": [
    {
      "weekNumber": 1,
      "weekType": "baseline",
      "workouts": [
        {
          "dayOfWeek": 1,
          "workoutName": "Workout Name",
          "focusAreas": ["muscle1", "muscle2"],
          "estimatedDuration": ${sessionDuration},
          "exercises": [
            {
              "exerciseId": "EXACT-UUID-FROM-LIST-ABOVE",
              "exerciseName": "Exercise Name",
              "exerciseOrder": 1,
              "sets": 3,
              "repsMin": 8,
              "repsMax": 12,
              "restSeconds": 90,
              "tempo": "3-0-1-1",
              "rpe": 7.5,
              "notes": "form cue"
            }
            // ${exercisesPerWorkout - 1} MORE EXERCISES HERE (total: ${exercisesPerWorkout}+ exercises)
          ]
        }
        // ${daysPerWeek - 1} MORE WORKOUTS FOR WEEK 1
      ]
    }
    // WEEKS 2, 3, AND 4 WITH SAME STRUCTURE
  ]
}

⚠️ YOUR RESPONSE MUST INCLUDE ALL 4 WEEKS WITH COMPLETE WORKOUT DETAILS ⚠️

Generate a complete, personalized 4-week workout plan following all requirements.`
    }

    // Helper function to call OpenAI for complete 4-week plan
    const callOpenAIForCompletePlan = async (maxRetries = 3): Promise<any> => {
      const prompt = buildCompletePlanPrompt()

      // Initialize OpenAI client (following Reborn's pattern)
      const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      })

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[generateWorkoutPlan] Generating complete 4-week plan (attempt ${attempt}/${maxRetries})...`)

          // Use OpenAI SDK client instead of fetch (like Reborn)
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            temperature: 0.7,
            max_tokens: 16000, // Explicitly set to ensure we get complete JSON
            messages: [
              {
                role: 'system',
                content: `You are an expert fitness coach. Create a personalized 4-WEEK workout program. Respond ONLY with valid JSON - NO other text.

CRITICAL - COMPACT JSON FORMAT:
- Use SHORT, concise notes (max 5-7 words per note)
- Use MINIMAL string fields
- Keep ALL property names SHORT
- NO unnecessary whitespace

PLAN STRUCTURE REQUIREMENTS:
(1) EXACTLY 4 weeks in "weeks" array
(2) For ${sessionDuration}-min workouts: minimum ${exercisesPerWorkout} exercises
(3) Each exercise: 2-3 sets
(4) Use EXACT exercise UUIDs from the provided list
(5) Total sets per workout: at least ${sessionDuration >= 60 ? '12' : '10'}`,
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            response_format: { type: 'json_object' },
          })

          const aiResponse = completion.choices?.[0]?.message?.content

          if (!aiResponse) {
            console.error(`[generateWorkoutPlan] No AI response (attempt ${attempt})`)
            if (attempt === maxRetries) {
              throw new Error('No response from AI after multiple attempts')
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            continue
          }

          // Detailed token usage logging to diagnose truncation
          console.log('[generateWorkoutPlan] AI response received')
          console.log('[generateWorkoutPlan] Response length:', aiResponse.length, 'characters')
          console.log('[generateWorkoutPlan] Token usage:', {
            prompt_tokens: completion.usage?.prompt_tokens,
            completion_tokens: completion.usage?.completion_tokens,
            total_tokens: completion.usage?.total_tokens,
            finish_reason: completion.choices?.[0]?.finish_reason
          })

          // Attempt to parse JSON with detailed error handling
          let generatedPlan: any
          try {
            generatedPlan = JSON.parse(aiResponse)
          } catch (parseError) {
            console.error(`[generateWorkoutPlan] JSON parse error (attempt ${attempt}):`, parseError)
            console.error('[generateWorkoutPlan] AI response length:', aiResponse.length)
            console.error('[generateWorkoutPlan] AI response preview:', aiResponse.substring(0, 500))
            console.error('[generateWorkoutPlan] AI response ending:', aiResponse.substring(Math.max(0, aiResponse.length - 500)))

            if (attempt === maxRetries) {
              throw new Error(`Invalid JSON from AI: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
            }

            // Try next attempt with exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            continue
          }

          // Validate the complete plan structure
          const validationError = validatePlanStructure(generatedPlan)
          if (validationError) {
            console.error(`[generateWorkoutPlan] Plan validation failed (attempt ${attempt}):`, validationError)

            if (attempt === maxRetries) {
              throw new Error(`Generated plan failed validation: ${validationError}`)
            }

            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            continue
          }

          // Success! Return the validated complete plan
          console.log(`[generateWorkoutPlan] Successfully generated complete 4-week plan on attempt ${attempt}`)
          console.log(`[generateWorkoutPlan] Plan contains ${generatedPlan.weeks.length} weeks, ${generatedPlan.weeks.reduce((sum: number, w: any) => sum + w.workouts.length, 0)} total workouts`)
          return generatedPlan

        } catch (error) {
          console.error(`[generateWorkoutPlan] Error on attempt ${attempt}:`, error)

          if (attempt === maxRetries) {
            throw error
          }

          // Exponential backoff before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }

      throw new Error('Failed to generate complete plan after all retries')
    }

    // Generate plan week-by-week (MUCH faster and more reliable)
    console.log('[generateWorkoutPlan] Generating 4-week plan (week-by-week approach)...')

    // Prepare parameters for week generation
    const weekGenerationParams = {
      trainingStyle,
      daysPerWeek,
      sessionDuration,
      exercisesPerWorkout,
    }

    // Debug: Log exercise data being passed
    console.log('[generateWorkoutPlan] Passing', exercisesToProvide.length, 'exercises to generateWeekFast')
    console.log('[generateWorkoutPlan] Sample exercise:', exercisesToProvide[0] ? {
      id: exercisesToProvide[0].id,
      name: exercisesToProvide[0].name,
      category: exercisesToProvide[0].category,
    } : 'NONE')

    const weeks = []
    for (let weekNum = 1; weekNum <= 4; weekNum++) {
      console.log(`[generateWorkoutPlan] Generating Week ${weekNum}/4...`)
      const weekData = await generateWeekFast(weekNum, exercisesToProvide, weekGenerationParams)
      weeks.push(weekData)
      console.log(`[generateWorkoutPlan] Week ${weekNum} generated successfully!`)
    }

    // Combine weeks into the expected plan structure
    const generatedPlan = {
      planName: `AI ${trainingStyleDisplay} Plan`,
      planType: trainingStyle,
      daysPerWeek: daysPerWeek,
      splitPattern: weeks[0].workouts.map((w: any) => w.focusAreas).join(', '),
      weeks: weeks
    }

    console.log('[generateWorkoutPlan] All 4 weeks generated successfully!')

    // Save plan to database
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 28) // 4 weeks

    console.log('[generateWorkoutPlan] Saving plan to database...')
    console.log('[generateWorkoutPlan] Plan data:', {
      user_id: user.id,
      plan_name: generatedPlan.planName,
      plan_type: generatedPlan.planType,
      days_per_week: generatedPlan.daysPerWeek,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      is_active: true,
      split_pattern: generatedPlan.splitPattern,
    })

    const { data: plan, error: planError } = await supabase
      .from('user_workout_plans')
      .insert({
        user_id: user.id,
        plan_name: generatedPlan.planName,
        plan_type: 'custom', // Always use 'custom' for AI-generated plans (not generatedPlan.planType which may return invalid values)
        days_per_week: generatedPlan.daysPerWeek,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        split_pattern: generatedPlan.splitPattern,
      })
      .select()
      .single()

    if (planError || !plan) {
      console.error('[generateWorkoutPlan] Failed to save plan:', planError)
      console.error('[generateWorkoutPlan] Error details:', JSON.stringify(planError, null, 2))
      return { success: false, error: `Failed to save workout plan: ${planError?.message || 'Unknown error'}` }
    }

    console.log('[generateWorkoutPlan] Plan saved successfully:', plan.id)

    // Save weeks and workouts (optimized with parallel saves)
    console.log('[generateWorkoutPlan] Saving workouts and exercises...')

    // Prepare all workout inserts
    const workoutInserts = []
    for (const week of generatedPlan.weeks) {
      for (const workout of week.workouts) {
        const workoutDate = new Date(startDate)
        workoutDate.setDate(workoutDate.getDate() + ((week.weekNumber - 1) * 7) + (workout.dayOfWeek - 1))

        workoutInserts.push({
          plan_id: plan.id,
          scheduled_date: workoutDate.toISOString(),
          workout_name: workout.workoutName,
          week_number: week.weekNumber,
          day_of_week: workout.dayOfWeek,
          focus_areas: workout.focusAreas,
          estimated_duration_minutes: workout.estimatedDuration,
          status: 'pending',
          // Store exercises temporarily to map after insert
          _exercises: workout.exercises,
        })
      }
    }

    // Insert all workouts at once
    const { data: savedWorkouts, error: workoutsError } = await supabase
      .from('plan_workouts')
      .insert(workoutInserts.map(w => ({
        plan_id: w.plan_id,
        scheduled_date: w.scheduled_date,
        workout_name: w.workout_name,
        week_number: w.week_number,
        day_of_week: w.day_of_week,
        focus_areas: w.focus_areas,
        estimated_duration_minutes: w.estimated_duration_minutes,
        status: w.status,
      })))
      .select()

    if (workoutsError || !savedWorkouts) {
      console.error('[generateWorkoutPlan] Failed to save workouts:', workoutsError)
      return { success: false, error: 'Failed to save workouts' }
    }

    console.log('[generateWorkoutPlan] Saved', savedWorkouts.length, 'workouts')

    // Now save all exercises in parallel
    const exerciseInserts = []
    savedWorkouts.forEach((savedWorkout, index) => {
      const originalWorkout = workoutInserts[index]
      if (originalWorkout._exercises) {
        for (const exercise of originalWorkout._exercises) {
          exerciseInserts.push({
            workout_id: savedWorkout.id,
            exercise_id: exercise.exerciseId,
            exercise_order: exercise.exerciseOrder,
            target_sets: exercise.sets,
            target_reps_min: exercise.repsMin,
            target_reps_max: exercise.repsMax,
            rest_seconds: exercise.restSeconds,
            tempo: exercise.tempo,
            target_rpe: exercise.rpe,
            notes: exercise.notes,
          })
        }
      }
    })

    if (exerciseInserts.length > 0) {
      const { error: exercisesError } = await supabase
        .from('plan_exercises')
        .insert(exerciseInserts)

      if (exercisesError) {
        console.error('[generateWorkoutPlan] Failed to save exercises:', exercisesError)
        // Don't fail the whole operation if just exercises fail
      } else {
        console.log('[generateWorkoutPlan] Saved', exerciseInserts.length, 'exercises')
      }
    }

    // Revalidate paths
    revalidatePath('/fitness')
    revalidatePath('/dashboard')

    return {
      success: true,
      planId: plan.id,
      planName: generatedPlan.planName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
  } catch (error) {
    console.error('[generateWorkoutPlan] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate workout plan'
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Get the user's current active workout plan
 */
export async function getCurrentWorkoutPlan(): Promise<WorkoutPlanSummary | null> {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return null
  }

  const supabase = await createClient()

  const { data: plan, error: planError } = await supabase
    .from('user_workout_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (planError || !plan) {
    return null
  }

  const startDate = new Date(plan.start_date)
  const endDate = new Date(plan.end_date)
  const today = new Date()

  const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  const weeksElapsed = Math.floor((today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  const currentWeek = Math.min(weeksElapsed + 1, totalWeeks)
  const weeksRemaining = Math.max(totalWeeks - weeksElapsed, 0)
  const progressPercentage = Math.round((weeksElapsed / totalWeeks) * 100)

  return {
    id: plan.id,
    planName: plan.plan_name,
    planType: plan.plan_type,
    startDate: plan.start_date,
    endDate: plan.end_date,
    weeksRemaining,
    currentWeek,
    daysPerWeek: plan.days_per_week,
    splitPattern: plan.split_pattern,
    status: plan.status,
    progressPercentage,
  }
}

/**
 * Get detailed workout plan with all workouts and exercises
 */
export async function getWorkoutPlanDetails(planId: string): Promise<WorkoutPlanDetails | null> {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return null
  }

  const supabase = await createClient()

  // Get plan
  const { data: plan, error: planError } = await supabase
    .from('user_workout_plans')
    .select('*')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single()

  if (planError || !plan) {
    return null
  }

  // Get all workouts for this plan
  const { data: workouts, error: workoutsError } = await supabase
    .from('plan_workouts')
    .select(`
      id,
      workout_name,
      week_number,
      day_of_week,
      scheduled_date,
      status,
      estimated_duration_minutes,
      focus_areas
    `)
    .eq('plan_id', planId)
    .order('week_number', { ascending: true })
    .order('day_of_week', { ascending: true })

  if (workoutsError || !workouts) {
    return null
  }

  // Get all exercises for these workouts
  const workoutIds = workouts.map(w => w.id)
  const { data: exercises, error: exercisesError } = await supabase
    .from('plan_exercises')
    .select(`
      id,
      workout_id,
      exercise_id,
      exercise_order,
      target_sets,
      target_reps_min,
      target_reps_max,
      rest_seconds,
      tempo,
      target_rpe,
      notes,
      completed_sets,
      is_completed,
      exercise_library (
        id,
        name,
        primary_muscles,
        category
      )
    `)
    .in('workout_id', workoutIds)
    .order('exercise_order', { ascending: true })

  if (exercisesError) {
    console.error('[getWorkoutPlanDetails] Error fetching exercises:', exercisesError)
  }

  // Organize workouts by week
  const weekMap = new Map<number, typeof workouts>()
  workouts.forEach(workout => {
    if (!weekMap.has(workout.week_number)) {
      weekMap.set(workout.week_number, [])
    }
    weekMap.get(workout.week_number)!.push(workout)
  })

  const weeks = Array.from(weekMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([weekNumber, weekWorkouts]) => ({
      weekNumber,
      workouts: weekWorkouts.map(workout => {
        const workoutExercises = (exercises || [])
          .filter(ex => ex.workout_id === workout.id)
          .map(ex => {
            const exerciseData = Array.isArray(ex.exercise_library)
              ? ex.exercise_library[0]
              : ex.exercise_library

            return {
              id: ex.id,
              exerciseId: ex.exercise_id,
              exerciseName: exerciseData?.name || 'Unknown Exercise',
              primaryMuscles: exerciseData?.primary_muscles || [],
              category: exerciseData?.category || 'strength',
              exerciseOrder: ex.exercise_order,
              targetSets: ex.target_sets,
              targetRepsMin: ex.target_reps_min,
              targetRepsMax: ex.target_reps_max,
              restSeconds: ex.rest_seconds,
              tempo: ex.tempo,
              targetRpe: ex.target_rpe,
              notes: ex.notes,
              completedSets: ex.completed_sets || 0,
              isCompleted: ex.is_completed || false,
            }
          })

        return {
          id: workout.id,
          workoutName: workout.workout_name,
          dayOfWeek: workout.day_of_week,
          scheduledDate: workout.scheduled_date,
          status: workout.status,
          estimatedDuration: workout.estimated_duration_minutes,
          focusAreas: workout.focus_areas || [],
          exercises: workoutExercises,
        }
      }),
    }))

  const startDate = new Date(plan.start_date)
  const endDate = new Date(plan.end_date)
  const today = new Date()
  const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  const weeksElapsed = Math.floor((today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  const currentWeek = Math.min(weeksElapsed + 1, totalWeeks)
  const weeksRemaining = Math.max(totalWeeks - weeksElapsed, 0)
  const progressPercentage = Math.round((weeksElapsed / totalWeeks) * 100)

  return {
    id: plan.id,
    planName: plan.plan_name,
    planType: plan.plan_type,
    startDate: plan.start_date,
    endDate: plan.end_date,
    weeksRemaining,
    currentWeek,
    daysPerWeek: plan.days_per_week,
    splitPattern: plan.split_pattern,
    status: plan.status,
    progressPercentage,
    weeks,
  }
}

/**
 * Get today's workout session (if scheduled)
 */
export async function getTodaysWorkout(): Promise<WorkoutSession | null> {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return null
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Find today's scheduled workout
  const { data: workout, error: workoutError } = await supabase
    .from('plan_workouts')
    .select(`
      id,
      plan_id,
      workout_name,
      week_number,
      scheduled_date,
      estimated_duration_minutes,
      focus_areas,
      user_workout_plans!inner (
        user_id,
        status
      )
    `)
    .eq('user_workout_plans.user_id', user.id)
    .eq('user_workout_plans.status', 'active')
    .eq('scheduled_date', today)
    .eq('status', 'pending')
    .maybeSingle()

  if (workoutError || !workout) {
    return null
  }

  // Get exercises for this workout with full exercise details
  const { data: exercises, error: exercisesError } = await supabase
    .from('plan_exercises')
    .select(`
      id,
      exercise_id,
      exercise_order,
      target_sets,
      target_reps_min,
      target_reps_max,
      rest_seconds,
      tempo,
      target_rpe,
      notes,
      completed_sets,
      is_completed,
      exercise_library (
        id,
        name,
        primary_muscles,
        secondary_muscles,
        category,
        difficulty,
        instructions,
        cues
      )
    `)
    .eq('workout_id', workout.id)
    .order('exercise_order', { ascending: true })

  if (exercisesError || !exercises) {
    return null
  }

  // Get exercise performance history
  const exerciseIds = exercises.map(ex => ex.exercise_id)
  const { data: performanceData } = await supabase
    .from('exercise_logs')
    .select('exercise_id, weight, reps, logged_at')
    .eq('user_id', user.id)
    .in('exercise_id', exerciseIds)
    .order('logged_at', { ascending: false })

  // Get personal records
  const { data: prData } = await supabase
    .from('exercise_pr_history')
    .select('exercise_id, weight, reps, achieved_at')
    .eq('user_id', user.id)
    .eq('pr_type', 'strength')
    .in('exercise_id', exerciseIds)
    .order('achieved_at', { ascending: false })

  // Build performance maps
  const performanceMap = new Map<string, { weight: number; reps: number }>()
  const prMap = new Map<string, { weight: number; reps: number; date: string }>()

  performanceData?.forEach(log => {
    if (!performanceMap.has(log.exercise_id)) {
      performanceMap.set(log.exercise_id, { weight: log.weight, reps: log.reps })
    }
  })

  prData?.forEach(pr => {
    if (!prMap.has(pr.exercise_id)) {
      prMap.set(pr.exercise_id, {
        weight: pr.weight,
        reps: pr.reps,
        date: pr.achieved_at,
      })
    }
  })

  const formattedExercises = exercises.map(ex => {
    const exerciseData = Array.isArray(ex.exercise_library)
      ? ex.exercise_library[0]
      : ex.exercise_library

    const lastPerformance = performanceMap.get(ex.exercise_id)
    const pr = prMap.get(ex.exercise_id)

    // Calculate estimated 1RM using Epley formula if we have performance data
    let estimatedOneRepMax: number | undefined
    if (lastPerformance && lastPerformance.reps <= 10) {
      estimatedOneRepMax = Math.round(lastPerformance.weight * (1 + lastPerformance.reps / 30))
    }

    return {
      id: ex.id,
      exerciseId: ex.exercise_id,
      exerciseName: exerciseData?.name || 'Unknown Exercise',
      primaryMuscles: exerciseData?.primary_muscles || [],
      secondaryMuscles: exerciseData?.secondary_muscles || [],
      category: exerciseData?.category || 'strength',
      difficulty: exerciseData?.difficulty || 'intermediate',
      exerciseOrder: ex.exercise_order,
      targetSets: ex.target_sets,
      targetRepsMin: ex.target_reps_min,
      targetRepsMax: ex.target_reps_max,
      restSeconds: ex.rest_seconds,
      tempo: ex.tempo,
      targetRpe: ex.target_rpe,
      notes: ex.notes,
      completedSets: ex.completed_sets || 0,
      isCompleted: ex.is_completed || false,
      instructions: exerciseData?.instructions,
      cues: exerciseData?.cues || [],
      lastWeight: lastPerformance?.weight,
      lastReps: lastPerformance?.reps,
      estimatedOneRepMax,
      personalRecord: pr,
    }
  })

  const planData = Array.isArray(workout.user_workout_plans)
    ? workout.user_workout_plans[0]
    : workout.user_workout_plans

  return {
    workoutId: workout.id,
    planId: planData?.user_id || '',
    workoutName: workout.workout_name,
    weekNumber: workout.week_number,
    scheduledDate: workout.scheduled_date,
    estimatedDuration: workout.estimated_duration_minutes,
    focusAreas: workout.focus_areas || [],
    exercises: formattedExercises,
  }
}

/**
 * Start a workout session (marks workout as in_progress)
 */
export async function startWorkoutSession(workoutId: string) {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('plan_workouts')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .eq('id', workoutId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('[startWorkoutSession] Error:', updateError)
    return { success: false, error: 'Failed to start workout' }
  }

  revalidatePath('/fitness')
  return { success: true }
}

/**
 * Log a single exercise set
 */
export async function logExerciseSet(input: ExerciseLogInput) {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await createClient()

  // Get plan exercise details to determine total sets
  const { data: planExercise, error: planExError } = await supabase
    .from('plan_exercises')
    .select('target_sets, completed_sets')
    .eq('id', input.planExerciseId)
    .single()

  if (planExError || !planExercise) {
    return { success: false, error: 'Exercise not found' }
  }

  // Insert exercise log
  const { error: logError } = await supabase
    .from('exercise_logs')
    .insert({
      user_id: user.id,
      workout_id: input.workoutId,
      exercise_id: input.exerciseId,
      set_number: input.setNumber,
      reps: input.reps,
      weight: input.weight,
      rpe: input.rpe,
      notes: input.notes || `${input.weight}${input.unit}`,
    })

  if (logError) {
    console.error('[logExerciseSet] Error:', logError)
    return { success: false, error: 'Failed to log set' }
  }

  // Update plan_exercises with new completed_sets count
  const newCompletedSets = input.setNumber
  const isComplete = newCompletedSets >= planExercise.target_sets

  const { error: updateError } = await supabase
    .from('plan_exercises')
    .update({
      completed_sets: newCompletedSets,
      is_completed: isComplete,
      last_updated: new Date().toISOString(),
    })
    .eq('id', input.planExerciseId)

  if (updateError) {
    console.error('[logExerciseSet] Update error:', updateError)
    return { success: false, error: 'Failed to update exercise progress' }
  }

  revalidatePath('/fitness')
  return { success: true, completed: isComplete }
}

/**
 * Complete a workout session
 */
export async function completeWorkoutSession(workoutId: string) {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await createClient()

  // Update workout status
  const { error: updateError } = await supabase
    .from('plan_workouts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', workoutId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('[completeWorkoutSession] Error:', updateError)
    return { success: false, error: 'Failed to complete workout' }
  }

  // Award XP for completing workout
  try {
    const { addXP } = await import('@/lib/actions/gamification')
    await addXP('workout_complete', workoutId, 'workout')
  } catch (xpError) {
    console.error('[completeWorkoutSession] XP error:', xpError)
    // Don't fail the workout completion if XP fails
  }

  revalidatePath('/fitness')
  revalidatePath('/dashboard')

  return { success: true }
}

/**
 * Skip a workout (marks as skipped)
 */
export async function skipWorkout(workoutId: string, reason?: string) {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('plan_workouts')
    .update({
      status: 'skipped',
      notes: reason || 'Skipped by user',
    })
    .eq('id', workoutId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('[skipWorkout] Error:', updateError)
    return { success: false, error: 'Failed to skip workout' }
  }

  revalidatePath('/fitness')
  return { success: true }
}

/**
 * Pause/resume a workout plan
 */
export async function togglePlanStatus(planId: string, pause: boolean) {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('user_workout_plans')
    .update({
      status: pause ? 'paused' : 'active',
    })
    .eq('id', planId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('[togglePlanStatus] Error:', updateError)
    return { success: false, error: 'Failed to update plan status' }
  }

  revalidatePath('/fitness')
  revalidatePath('/dashboard')

  return { success: true }
}

/**
 * Get workout statistics for current plan
 */
export async function getWorkoutStatistics(planId: string) {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return null
  }

  const supabase = await createClient()

  // Get all workouts for this plan
  const { data: workouts } = await supabase
    .from('plan_workouts')
    .select('id, status, week_number')
    .eq('plan_id', planId)
    .eq('user_id', user.id)

  if (!workouts) return null

  const totalWorkouts = workouts.length
  const completedWorkouts = workouts.filter(w => w.status === 'completed').length
  const skippedWorkouts = workouts.filter(w => w.status === 'skipped').length
  const pendingWorkouts = workouts.filter(w => w.status === 'pending').length
  const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0

  // Get total volume (weight × reps) for this plan
  const workoutIds = workouts.map(w => w.id)
  const { data: logs } = await supabase
    .from('exercise_logs')
    .select('weight, reps')
    .in('workout_id', workoutIds)
    .eq('user_id', user.id)

  const totalVolume = (logs || []).reduce((sum, log) => sum + (log.weight * log.reps), 0)

  return {
    totalWorkouts,
    completedWorkouts,
    skippedWorkouts,
    pendingWorkouts,
    completionRate,
    totalVolume: Math.round(totalVolume),
  }
}
