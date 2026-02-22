"use server"

import { revalidatePath } from "next/cache"
import { createClient, getAuthUser } from "@/lib/supabase/server"
import { env } from "@/lib/env"

// ========================
// TYPES
// ========================

export type WorkoutPlanPreferences = {
  trainingStyle?: 'strength' | 'hypertrophy' | 'endurance' | 'power' | 'HIIT' | 'mobility' | 'functional' | 'mind_body' | 'mixed'
  daysPerWeek?: number
  sessionDurationMinutes?: number
  fitnessGoal?: string
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  availableEquipment?: string[]
  excludeExercises?: string[]
  focusAreas?: string[]
}

type GeneratedWorkoutResult = {
  success: boolean
  planId?: string
  planName?: string
  startDate?: string
  endDate?: string
  daysPerWeek?: number
  totalWorkouts?: number
  error?: string
}

// ========================
// SERVER ACTIONS
// ========================

/**
 * Generate a new AI-powered workout plan
 */
export async function generateWorkoutPlan(preferences: WorkoutPlanPreferences): Promise<GeneratedWorkoutResult> {
  const { user, error } = await getAuthUser()

  if (error || !user) {
    console.error('[generateWorkoutPlan] Authentication failed:', error)
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // Check OpenAI API key availability
    if (!env.OPENAI_API_KEY) {
      return {
        success: false,
        error: 'AI workout generation is not configured. Please contact support.'
      }
    }

    const supabase = await createClient()

    // Fetch user profile
    const { data: profile, error: profileError} = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'User profile not found' }
    }

    // Fetch exercises filtered by modality
    const trainingStyle = preferences.trainingStyle || profile.training_style || 'mixed'
    const availableEquipment = preferences.availableEquipment || profile.available_equipment || []

    let exercisesQuery = supabase
      .from('exercise_library')
      .select('*')
      .eq('is_active', true)

    // Filter by training modality (unless 'mixed')
    if (trainingStyle !== 'mixed') {
      exercisesQuery = exercisesQuery.eq('training_modality', trainingStyle)
    }

    const { data: exercises, error: exercisesError } = await exercisesQuery

    if (exercisesError || !exercises || exercises.length === 0) {
      return {
        success: false,
        error: 'No exercises found for the selected training modality'
      }
    }

    // Filter exercises by equipment availability
    const filteredExercises = exercises.filter(ex => {
      if (!ex.equipment || ex.equipment.length === 0) return true
      if (!availableEquipment || availableEquipment.length === 0) {
        return ex.equipment.length === 0
      }
      return ex.equipment.some((eq: string) => availableEquipment.includes(eq))
    })

    // Filter out excluded exercises
    const excludedIds = preferences.excludeExercises || []
    const finalExercises = filteredExercises.filter(ex => !excludedIds.includes(ex.id))

    if (finalExercises.length < 20) {
      return {
        success: false,
        error: `Not enough exercises available (found ${finalExercises.length}, need 20). Please select more equipment options or choose "Mixed" training style.`
      }
    }

    // Build AI prompt (simple version for now)
    const daysPerWeek = preferences.daysPerWeek || profile.training_days_per_week || 5
    const sessionDuration = preferences.sessionDurationMinutes || profile.available_time_minutes || 60
    const experienceLevel = preferences.experienceLevel || profile.experience_level || 'intermediate'
    const fitnessGoal = preferences.fitnessGoal || profile.primary_goal || 'general_fitness'

    const prompt = `Generate a personalized 4-week workout plan for a ${experienceLevel} user focused on ${fitnessGoal}. Training ${daysPerWeek} days per week, ${sessionDuration} minutes per session. Training style: ${trainingStyle}.

Return ONLY valid JSON with this structure:
{
  "planName": "4-Week Plan Name",
  "planType": "${trainingStyle}",
  "daysPerWeek": ${daysPerWeek},
  "splitPattern": "Brief split description",
  "weeks": [
    {
      "weekNumber": 1,
      "workouts": [
        {
          "dayOfWeek": 1,
          "workoutName": "Workout Name",
          "focusAreas": ["muscle1", "muscle2"],
          "estimatedDuration": ${sessionDuration},
          "exercises": [
            {
              "exerciseId": "${finalExercises[0]?.id || ''}",
              "exerciseOrder": 1,
              "sets": 3,
              "repsMin": 8,
              "repsMax": 12,
              "restSeconds": 90,
              "tempo": "3-0-1-1",
              "rpe": 8.0,
              "notes": "Form cue"
            }
          ]
        }
      ]
    }
  ]
}

Use only these exercise IDs: ${finalExercises.slice(0, 30).map(ex => ex.id).join(', ')}.
Create 4 weeks with ${daysPerWeek} workouts each. Include 7-9 exercises per workout.`

    // Call OpenAI API directly
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
            content: 'You are an expert fitness coach. Generate workout programs. Always return valid JSON.',
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
      console.error('[WorkoutGen] OpenAI API error:', response.status)
      return { success: false, error: 'Failed to generate workout plan. Please try again.' }
    }

    const completion = await response.json()
    const aiResponse = completion.choices?.[0]?.message?.content

    if (!aiResponse) {
      return { success: false, error: 'No response from AI. Please try again.' }
    }

    // Parse AI response
    const generatedPlan = JSON.parse(aiResponse)

    // Save plan to database (simplified)
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 28) // 4 weeks

    const { data: plan, error: planError } = await supabase
      .from('workout_plans')
      .insert({
        user_id: user.id,
        plan_name: generatedPlan.planName,
        plan_type: generatedPlan.planType,
        days_per_week: generatedPlan.daysPerWeek,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
        split_pattern: generatedPlan.splitPattern,
      })
      .select()
      .single()

    if (planError || !plan) {
      console.error('[WorkoutGen] Failed to save plan:', planError)
      return { success: false, error: 'Failed to save workout plan' }
    }

    // Save weeks and workouts (basic version)
    for (const week of generatedPlan.weeks) {
      for (const workout of week.workouts) {
        const workoutDate = new Date(startDate)
        workoutDate.setDate(workoutDate.getDate() + ((week.weekNumber - 1) * 7) + (workout.dayOfWeek - 1))

        const { data: savedWorkout, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            user_id: user.id,
            workout_plan_id: plan.id,
            workout_date: workoutDate.toISOString(),
            workout_name: workout.workoutName,
            focus_areas: workout.focusAreas,
            estimated_duration_minutes: workout.estimatedDuration,
            status: 'planned',
          })
          .select()
          .single()

        if (!workoutError && savedWorkout) {
          // Save exercises for this workout
          for (const exercise of workout.exercises) {
            await supabase
              .from('workout_exercises')
              .insert({
                workout_id: savedWorkout.id,
                exercise_id: exercise.exerciseId,
                exercise_order: exercise.exerciseOrder,
                planned_sets: exercise.sets,
                planned_reps_min: exercise.repsMin,
                planned_reps_max: exercise.repsMax,
                rest_seconds: exercise.restSeconds,
                tempo: exercise.tempo,
                rpe: exercise.rpe,
                notes: exercise.notes,
              })
          }
        }
      }
    }

    // Revalidate relevant paths
    revalidatePath('/fitness')

    return {
      success: true,
      planId: plan.id,
      planName: generatedPlan.planName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      daysPerWeek: generatedPlan.daysPerWeek,
      totalWorkouts: generatedPlan.weeks.reduce((sum: number, week: any) => sum + week.workouts.length, 0),
    }
  } catch (err) {
    console.error('[generateWorkoutPlan] Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to generate workout plan'
    }
  }
}


/**
 * Get all active workout plans for the current user
 */
export async function getActiveWorkoutPlans() {
  const { user, error } = await getAuthUser()

  if (error || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const supabase = await createClient()

    const { data: plans, error: plansError } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (plansError) {
      return { success: false, error: plansError.message }
    }

    return { success: true, plans: plans || [] }
  } catch (err) {
    console.error('[getActiveWorkoutPlans] Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch workout plans'
    }
  }
}

/**
 * Get a specific workout plan with all its workouts
 */
export async function getWorkoutPlan(planId: string) {
  const { user, error } = await getAuthUser()

  if (error || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const supabase = await createClient()

    const { data: plan, error: planError } = await supabase
      .from('workout_plans')
      .select(`
        *,
        workouts:workouts(
          *,
          exercises:workout_exercises(
            *,
            exercise:exercise_library(*)
          )
        )
      `)
      .eq('id', planId)
      .eq('user_id', user.id)
      .single()

    if (planError || !plan) {
      return { success: false, error: 'Workout plan not found' }
    }

    return { success: true, plan }
  } catch (err) {
    console.error('[getWorkoutPlan] Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch workout plan'
    }
  }
}
