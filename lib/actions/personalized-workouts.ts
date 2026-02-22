"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient, getAuthUser } from "@/lib/supabase/server"
import { env } from "@/lib/env"

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
 */
export async function generateWorkoutPlan(preferences: WorkoutPlanPreferences) {
  const { user, error } = await getAuthUser()

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('[generateWorkoutPlan] Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      hasError: !!error,
      errorMessage: error?.message
    })
  }

  if (error || !user) {
    console.error('[generateWorkoutPlan] Authentication failed:', error)
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // Get cookies to pass to internal API call
    const cookieStore = await cookies()
    const cookieString = cookieStore.getAll()
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ')

    // Call the API route to generate the plan
    // Use absolute URL in production, relative in development
    // Vercel automatically provides VERCEL_URL (without protocol) in production
    const baseUrl = env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000'

    const apiUrl = `${baseUrl}/api/workouts/generate-plan`

    console.log('[generateWorkoutPlan] Calling API:', apiUrl, {
      hasAppUrl: !!env.NEXT_PUBLIC_APP_URL,
      hasVercelUrl: !!process.env.VERCEL_URL,
      vercelUrl: process.env.VERCEL_URL
    })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString,
      },
      body: JSON.stringify({
        userId: user.id,
        preferences,
      }),
    })

    if (!response.ok) {
      const responseText = await response.text()
      console.error('[generateWorkoutPlan] API error:', response.status, responseText.substring(0, 500))

      // Try to parse as JSON, fallback to text error
      try {
        const errorData = JSON.parse(responseText)
        return { success: false, error: errorData.error || 'Failed to generate plan' }
      } catch {
        return { success: false, error: `Server error (${response.status}): ${responseText.substring(0, 100)}` }
      }
    }

    const resultText = await response.text()
    console.log('[generateWorkoutPlan] Response:', resultText.substring(0, 200))

    const result = JSON.parse(resultText)

    revalidatePath('/fitness')
    revalidatePath('/dashboard')

    return {
      success: true,
      planId: result.planId,
      planName: result.planName,
      startDate: result.startDate,
      endDate: result.endDate,
    }
  } catch (error) {
    console.error('[generateWorkoutPlan] Unexpected error:', error)
    // Provide more detailed error message
    const errorMessage = error instanceof Error
      ? `${error.message}${error.cause ? ` (${error.cause})` : ''}`
      : 'Failed to generate workout plan'
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
