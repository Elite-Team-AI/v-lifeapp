"use server"

import { revalidatePath } from "next/cache"
import { createClient, getAuthUser } from "@/lib/supabase/server"
import type { WorkoutTemplate } from "@/lib/workout-programming"
import { env } from "@/lib/env"
import {
  getDayName,
  getDayEmphasis,
  getRandomTemplate,
  getWeekIntensity,
  type DayOfWeek,
} from "@/lib/workout-programming"

type WorkoutMode = "sets" | "rounds"

interface WorkoutExerciseDetail {
  workoutExerciseId: string
  exerciseId: string
  name: string
  category: string | null
  sets: number
  reps: string
  restSeconds: number
  completed: boolean
  completedSets: number
  lastWeight?: number | null
  lastReps?: number | null
}

export interface ActiveWorkoutPayload {
  workoutId: string
  name: string
  mode: WorkoutMode
  workoutType: string | null
  durationMinutes: number | null
  description: string | null
  dayEmphasis: string
  conditioningNotes: string | null
  exercises: WorkoutExerciseDetail[]
}

interface ProfileInfo {
  primary_goal?: string | null
  activity_level?: number | null
  gym_access?: string | null
  custom_equipment?: string | null
  weight?: number | null
  age?: number | null
  gender?: string | null
  training_style?: string | null
  available_time_minutes?: number | null
  training_days_per_week?: number | null
}

interface AIGeneratedWorkout {
  name: string
  description: string
  exercises: Array<{
    name: string
    category: string
    muscleGroup?: string
    sets: number
    reps: string
    restSeconds: number
    notes?: string
  }>
  conditioningNotes?: string
}

const exerciseCache = new Map<string, string>()

// Calculate realistic workout duration based on exercises
function calculateWorkoutDuration(exercises: Array<{ sets: number; reps: string; restSeconds: number }>): number {
  if (exercises.length === 0) return 30
  
  // Average time per rep: 3 seconds
  const avgSecondsPerRep = 3
  // Warmup: 5 minutes
  const warmupMinutes = 5
  // Cooldown: 5 minutes
  const cooldownMinutes = 5
  
  let totalSeconds = 0
  
  for (const exercise of exercises) {
    // Parse reps (handle formats like "8-12", "30 seconds", "10 each")
    let repsPerSet = 10 // default
    const repsStr = exercise.reps.toLowerCase()
    
    if (repsStr.includes('each')) {
      // "10 each leg" = 20 total reps
      const match = repsStr.match(/(\d+)/)
      repsPerSet = match ? parseInt(match[1]) * 2 : 20
    } else if (repsStr.includes('second')) {
      // "30 seconds" - use as-is
      const match = repsStr.match(/(\d+)/)
      repsPerSet = match ? parseInt(match[1]) / avgSecondsPerRep : 10
    } else if (repsStr.includes('-')) {
      // "8-12" - use average
      const parts = repsStr.split('-')
      const low = parseInt(parts[0]) || 8
      const high = parseInt(parts[1]) || 12
      repsPerSet = (low + high) / 2
    } else {
      // Simple number
      repsPerSet = parseInt(repsStr) || 10
    }
    
    // Time for one set: (reps * seconds per rep) + rest
    const timePerSet = (repsPerSet * avgSecondsPerRep) + exercise.restSeconds
    // Total time for all sets
    totalSeconds += timePerSet * exercise.sets
  }
  
  // Convert to minutes and add warmup/cooldown
  const exerciseMinutes = Math.ceil(totalSeconds / 60)
  const totalMinutes = warmupMinutes + exerciseMinutes + cooldownMinutes
  
  // Round to nearest 5 minutes
  return Math.ceil(totalMinutes / 5) * 5
}

async function getExerciseId(name: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  if (exerciseCache.has(name)) {
    return exerciseCache.get(name)!
  }

  const { data, error } = await supabase.from("exercises").select("id").eq("name", name).maybeSingle()
  if (error) {
    throw new Error(`Failed to lookup exercise ${name}: ${error.message}`)
  }
  if (data) {
    exerciseCache.set(name, data.id)
    return data.id
  }

  return createExercisePlaceholder(name, supabase)
}

async function createExercisePlaceholder(
  name: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  category: string = "strength",
  muscleGroup?: string,
) {
  const payload = {
    name,
    category,
    muscle_group: muscleGroup || null,
    description: `${name} (auto-generated)`,
  }
  const { data, error } = await supabase.from("exercises").insert(payload).select("id").single()

  if (error && error?.code !== "23505") {
    throw new Error(`Unable to create exercise ${name}: ${error.message}`)
  }

  let exerciseId = data?.id
  if (!exerciseId) {
    const { data: fallback, error: fallbackError } = await supabase
      .from("exercises")
      .select("id")
      .eq("name", name)
      .maybeSingle()

    if (fallbackError || !fallback) {
      throw new Error(`Exercise ${name} not found in catalog`)
    }

    exerciseId = fallback.id
  }

  exerciseCache.set(name, exerciseId)
  return exerciseId
}

// Fetch user profile for personalization
async function fetchProfileInfo(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<ProfileInfo | null> {
  const { data } = await supabase
    .from("profiles")
    .select("primary_goal, activity_level, gym_access, custom_equipment, weight, age, gender, training_style, available_time_minutes, training_days_per_week")
    .eq("id", userId)
    .maybeSingle()
  return data
}

// Generate AI-powered workout based on template and user profile
async function generateAIWorkout(
  template: WorkoutTemplate,
  profile: ProfileInfo | null,
  dayOfWeek: DayOfWeek,
): Promise<AIGeneratedWorkout | null> {
  if (!env.OPENAI_API_KEY) {
    return null
  }

  const dayName = getDayName(dayOfWeek)
  const emphasis = getDayEmphasis(dayOfWeek)
  const weekInfo = getWeekIntensity()

  const equipmentContext = profile?.gym_access === "home" || profile?.gym_access === "none"
    ? "User has limited equipment (home/bodyweight focus). Prefer dumbbell, kettlebell, and bodyweight exercises."
    : profile?.custom_equipment
      ? `User equipment: ${profile.custom_equipment}`
      : "Full gym access with barbells, machines, etc."

  const goalContext = profile?.primary_goal
    ? `User goal: ${profile.primary_goal.replace("-", " ")}`
    : "General fitness"

  const activityContext = profile?.activity_level
    ? `Activity level: ${profile.activity_level}/5`
    : "Moderate activity"

  const trainingStyleContext = profile?.training_style
    ? `Training style preference: ${profile.training_style.replace("-", " ")}`
    : ""

  const timeContext = profile?.available_time_minutes
    ? `Target workout duration: ${profile.available_time_minutes} minutes`
    : ""

  const daysContext = profile?.training_days_per_week
    ? `User trains ${profile.training_days_per_week} days per week`
    : ""

  const templateExercises = template.exercises
    .map((e) => `${e.name} (${e.sets}x${e.reps}, ${e.restSeconds}s rest)`)
    .join(", ")

  const systemMessage = `You are the V-Life AI fitness coach. Generate personalized workout variations following evidence-based programming principles.
Current week phase: ${weekInfo.label} (intensity modifier: ${weekInfo.modifier}).
Always return valid JSON with a "workout" object.`

  const userMessage = `Generate a ${dayName} workout for "${emphasis}" day.
${goalContext}. ${activityContext}. ${equipmentContext}.
${trainingStyleContext} ${timeContext} ${daysContext}

Base template: "${template.name}" - ${template.description}
Template exercises: ${templateExercises}
Conditioning format: ${template.conditioningFormat}
Duration: ~${template.durationMinutes} minutes

Create a varied workout following this template's structure but with appropriate exercise substitutions for variety.
Keep the same number of exercises and similar rep/set schemes.
Add brief coaching notes where helpful.

Return JSON format:
{
  "workout": {
    "name": "Creative workout name",
    "description": "Brief description",
    "exercises": [
      {"name": "Exercise", "category": "strength|cardio|skill|accessory", "muscleGroup": "target", "sets": 4, "reps": "8-10", "restSeconds": 90, "notes": "optional tip"}
    ],
    "conditioningNotes": "Brief conditioning instructions"
  }
}`.trim()

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 800,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
      }),
    })

    if (!response.ok) {
      console.error("[Workout] AI generation failed:", response.status)
      return null
    }

    const payload = await response.json()
    const content = payload?.choices?.[0]?.message?.content

    if (!content) {
      return null
    }

    // Extract JSON from response
    const start = content.indexOf("{")
    const end = content.lastIndexOf("}")
    if (start === -1 || end === -1) {
      return null
    }

    const parsed = JSON.parse(content.slice(start, end + 1))
    return parsed.workout || null
  } catch (error) {
    console.error("[Workout] AI generation error:", error)
    return null
  }
}

// Create workout from template (fallback when AI unavailable)
function templateToWorkout(template: WorkoutTemplate): AIGeneratedWorkout {
  return {
    name: template.name,
    description: template.description,
    exercises: template.exercises.map((e) => ({
      name: e.name,
      category: e.category,
      muscleGroup: e.muscleGroup,
      sets: e.sets,
      reps: e.reps,
      restSeconds: e.restSeconds,
      notes: e.notes,
    })),
    conditioningNotes: `${template.conditioningFormat}: ${template.conditioningNotes}`,
  }
}

// Main function to create a day-appropriate workout
async function createDailyWorkout(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string> {
  const now = new Date()
  const dayOfWeek = now.getDay() as DayOfWeek
  const dayName = getDayName(dayOfWeek)
  const emphasis = getDayEmphasis(dayOfWeek)

  // Get user profile for personalization
  const profile = await fetchProfileInfo(userId, supabase)

  // Get base template for today
  const template = getRandomTemplate(dayOfWeek)

  // Try AI generation, fallback to template
  let workoutData = await generateAIWorkout(template, profile, dayOfWeek)
  if (!workoutData) {
    workoutData = templateToWorkout(template)
  }

  // Calculate realistic duration based on exercises
  const calculatedDuration = calculateWorkoutDuration(workoutData.exercises)
  
  // Create the workout record
  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({
      user_id: userId,
      workout_name: workoutData.name,
      description: `${dayName} - ${emphasis}: ${workoutData.description}`,
      workout_type: template.workoutType,
      duration_minutes: calculatedDuration,
      mode: "sets",
      scheduled_date: now.toISOString().split("T")[0],
    })
    .select("id")
    .single()

  if (error || !workout) {
    console.error("[Workout] Failed to create workout:", error)
    throw new Error("Unable to create daily workout")
  }

  // Create exercise records
  const rows = []
  for (let i = 0; i < workoutData.exercises.length; i++) {
    const entry = workoutData.exercises[i]
    const exerciseId = await getExerciseId(entry.name, supabase)
    rows.push({
      workout_id: workout.id,
      exercise_id: exerciseId,
      order_index: i + 1,
      sets: entry.sets,
      reps: entry.reps,
      rest_seconds: entry.restSeconds,
    })
  }

  if (rows.length > 0) {
    await supabase.from("workout_exercises").insert(rows)
  }

  return workout.id
}

// Check if user has a workout scheduled for today
async function getTodaysWorkout(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const today = new Date().toISOString().split("T")[0]

  // First try to find a workout scheduled for today
  const { data: scheduledWorkout } = await supabase
    .from("workouts")
    .select("id, name, workout_type, duration_minutes, mode, completed, description")
    .eq("user_id", userId)
    .eq("scheduled_date", today)
    .eq("completed", false)
    .maybeSingle()

  if (scheduledWorkout) {
    return scheduledWorkout
  }

  // Fallback: find any incomplete workout from today
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { data: recentWorkout } = await supabase
    .from("workouts")
    .select("id, name, workout_type, duration_minutes, mode, completed, description")
    .eq("user_id", userId)
    .eq("completed", false)
    .gte("created_at", startOfDay.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return recentWorkout
}

// Get exercise history (last weight/reps for each exercise)
async function getExerciseHistory(
  userId: string,
  exerciseIds: string[],
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Map<string, { weight: number; reps: number }>> {
  if (exerciseIds.length === 0) {
    return new Map()
  }

  // Get the most recent log entry for each exercise
  const { data: logs } = await supabase
    .from("exercise_logs")
    .select("exercise_id, weight, reps, logged_at")
    .eq("user_id", userId)
    .in("exercise_id", exerciseIds)
    .order("logged_at", { ascending: false })

  if (!logs || logs.length === 0) {
    return new Map()
  }

  // Map exercise_id to the most recent entry
  const historyMap = new Map<string, { weight: number; reps: number }>()
  const seen = new Set<string>()

  for (const log of logs) {
    if (!seen.has(log.exercise_id) && log.weight != null && log.reps != null) {
      historyMap.set(log.exercise_id, {
        weight: Number(log.weight),
        reps: Number(log.reps),
      })
      seen.add(log.exercise_id)
    }
  }

  return historyMap
}

export async function getActiveWorkout(): Promise<ActiveWorkoutPayload | null> {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return null
  }

  const supabase = await createClient()
  const dayOfWeek = new Date().getDay() as DayOfWeek
  const dayEmphasis = getDayEmphasis(dayOfWeek)

  // Try to get today's workout
  let workout = await getTodaysWorkout(user.id, supabase)

  // If no workout exists for today, generate one
  if (!workout) {
    try {
      const workoutId = await createDailyWorkout(user.id, supabase)
      const { data: created } = await supabase
        .from("workouts")
        .select("id, name, workout_type, duration_minutes, mode, completed, description")
        .eq("id", workoutId)
        .maybeSingle()
      workout = created || null
    } catch (err) {
      console.error("[Workout] Failed to create daily workout:", err)
      return null
    }
  }

  if (!workout) return null

  const { data: exercises } = await supabase
    .from("workout_exercises")
    .select(
      `
      id,
      exercise_id,
      sets,
      reps,
      rest_seconds,
      completed,
      completed_sets,
      order_index,
      exercises (
        name,
        category
      )
    `,
    )
    .eq("workout_id", workout.id)
    .order("order_index", { ascending: true })

  if (!exercises) return null

  // Get exercise IDs to fetch history
  const exerciseIds = exercises.map((ex) => ex.exercise_id).filter(Boolean) as string[]
  const exerciseHistory = await getExerciseHistory(user.id, exerciseIds, supabase)

  const formatted: WorkoutExerciseDetail[] = exercises.map((exercise) => {
    const exerciseData = Array.isArray(exercise.exercises) ? exercise.exercises[0] : exercise.exercises
    const history = exerciseHistory.get(exercise.exercise_id)
    return {
      workoutExerciseId: exercise.id,
      exerciseId: exercise.exercise_id,
      name: exerciseData?.name || "Exercise",
      category: exerciseData?.category || null,
      sets: exercise.sets || 0,
      reps: exercise.reps || "",
      restSeconds: exercise.rest_seconds || 60,
      completed: exercise.completed ?? false,
      completedSets: exercise.completed_sets || 0,
      lastWeight: history?.weight ?? null,
      lastReps: history?.reps ?? null,
    }
  })

  // Extract conditioning notes from description if present
  const descriptionParts = workout.description?.split(": ") || []
  const conditioningNotes = descriptionParts.length > 1 ? descriptionParts.slice(1).join(": ") : null

  return {
    workoutId: workout.id,
    name: workout.name,
    workoutType: workout.workout_type,
    durationMinutes: workout.duration_minutes,
    mode: (workout.mode as WorkoutMode) || "sets",
    description: workout.description,
    dayEmphasis,
    conditioningNotes,
    exercises: formatted,
  }
}

interface LogSetInput {
  workoutExerciseId: string
  workoutId: string
  exerciseId: string
  setNumber: number
  totalSets: number
  weight: number
  reps: number
  unit: "lbs" | "kg"
}

export async function logExerciseSet(payload: LogSetInput) {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    console.error("[Workout] logExerciseSet: Not authenticated")
    return { success: false, error: "Not authenticated" }
  }

  console.log("[Workout] Logging set:", {
    userId: user.id,
    workoutId: payload.workoutId,
    exerciseId: payload.exerciseId,
    setNumber: payload.setNumber,
    totalSets: payload.totalSets,
    weight: payload.weight,
    reps: payload.reps,
  })

  const supabase = await createClient()
  
  // Insert the exercise log
  const { data: logData, error: logError } = await supabase.from("exercise_logs").insert({
    user_id: user.id,
    workout_id: payload.workoutId,
    exercise_id: payload.exerciseId,
    set_number: payload.setNumber,
    reps: payload.reps,
    weight: payload.weight,
    notes: payload.unit,
  }).select("id").single()

  if (logError) {
    console.error("[Workout] Failed to log set:", logError)
    return { success: false, error: "Unable to record set" }
  }
  
  console.log("[Workout] Exercise log created:", logData?.id)

  const isComplete = payload.setNumber >= payload.totalSets
  
  // Update workout_exercises with new completed_sets count
  const { data: updateData, error: updateError } = await supabase
    .from("workout_exercises")
    .update({
      completed_sets: payload.setNumber,
      completed: isComplete,
    })
    .eq("id", payload.workoutExerciseId)
    .eq("workout_id", payload.workoutId)
    .select("id, completed_sets, completed")
    .single()

  if (updateError) {
    console.error("[Workout] Failed to update exercise:", updateError)
    return { success: false, error: "Unable to update exercise" }
  }
  
  console.log("[Workout] Exercise updated:", updateData)

  revalidatePath("/fitness")
  revalidatePath("/workout")
  return { success: true, completed: isComplete }
}

export async function completeWorkout(workoutId: string) {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabase = await createClient()
  const { error: updateError } = await supabase
    .from("workouts")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", workoutId)
    .eq("user_id", user.id)

  if (updateError) {
    console.error("[Workout] Failed to complete workout:", updateError)
    return { success: false, error: "Unable to complete workout" }
  }

  // Award XP for completing workout
  try {
    const { addXP } = await import("@/lib/actions/gamification")
    await addXP('workout_complete', workoutId, 'workout')
  } catch (xpError) {
    console.error("[Workout] Failed to award XP:", xpError)
    // Don't fail the workout completion if XP fails
  }

  revalidatePath("/fitness")
  return { success: true }
}

export async function refreshTrainingPlan() {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabase = await createClient()
  const { data: event } = await supabase
    .from("plan_refresh_events")
    .insert({
      user_id: user.id,
      status: "processing",
      message: "Plan refresh requested from dashboard",
    })
    .select("id")
    .single()

  try {
    // Mark any existing incomplete workouts for today as cancelled
    const today = new Date().toISOString().split("T")[0]
    await supabase
      .from("workouts")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("completed", false)
      .or(`scheduled_date.eq.${today},scheduled_date.is.null`)

    // Generate a fresh AI workout for today
    await createDailyWorkout(user.id, supabase)

    if (event?.id) {
      await supabase
        .from("plan_refresh_events")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          message: "AI-generated workout created for today",
        })
        .eq("id", event.id)
    }
  } catch (err) {
    if (event?.id) {
      await supabase
        .from("plan_refresh_events")
        .update({ status: "failed", message: "Unable to refresh plan" })
        .eq("id", event.id)
    }
    console.error("[Workout] Plan refresh failed:", err)
    return { success: false, error: "Failed to refresh plan" }
  }

  revalidatePath("/dashboard")
  revalidatePath("/fitness")
  return { success: true }
}


export interface WorkoutOverview {
  weeklyWorkoutData: Array<{ week: string; workouts: number; volume: number; cardioMinutes: number }>
  exerciseCompletionData: Array<{ day: string; completed: number; total: number }>
  totalWorkoutsThisMonth: number
  avgWorkoutsPerWeek: number
  workoutChange: number
  volumeChange: number
  cardioChange: number
}

export async function getWorkoutOverview(): Promise<WorkoutOverview> {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return {
      weeklyWorkoutData: [],
      exerciseCompletionData: [],
      totalWorkoutsThisMonth: 0,
      avgWorkoutsPerWeek: 0,
      workoutChange: 0,
      volumeChange: 0,
      cardioChange: 0,
    }
  }

  const supabase = await createClient()
  const startRange = new Date()
  startRange.setDate(startRange.getDate() - 35)

  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, workout_type, duration_minutes, completed, created_at")
    .eq("user_id", user.id)
    .gte("created_at", startRange.toISOString())

  const { data: logs } = await supabase
    .from("exercise_logs")
    .select("workout_id, reps, weight")
    .eq("user_id", user.id)
    .gte("logged_at", startRange.toISOString())

  const volumeByWorkout = new Map<string, number>()
  ;(logs || []).forEach((log) => {
    const volume = Number(log.weight || 0) * Number(log.reps || 0)
    volumeByWorkout.set(log.workout_id, (volumeByWorkout.get(log.workout_id) || 0) + volume)
  })

  const weeklyMap = new Map<string, { workouts: number; volume: number; cardioMinutes: number }>()
  ;(workouts || []).forEach((session) => {
    const created = new Date(session.created_at!)
    const weekKey = `${created.getFullYear()}-${getWeekNumber(created)}`
    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, { workouts: 0, volume: 0, cardioMinutes: 0 })
    }
    const bucket = weeklyMap.get(weekKey)!
    bucket.workouts += 1
    bucket.volume += volumeByWorkout.get(session.id) || 0
    if (session.workout_type === "cardio") {
      bucket.cardioMinutes += session.duration_minutes || 0
    }
  })

  const weeklyWorkoutData = Array.from(weeklyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value], idx) => ({
      week: `Week ${idx + 1}`,
      ...value,
    }))

  const totalWorkoutsThisMonth = (workouts || []).filter((session) => {
    const completedAt = new Date(session.created_at!)
    const now = new Date()
    return completedAt.getMonth() === now.getMonth() && completedAt.getFullYear() === now.getFullYear()
  }).length

  const lastTwo = weeklyWorkoutData.slice(-2)
  const workoutChange =
    lastTwo.length === 2 && lastTwo[0].workouts > 0
      ? ((lastTwo[1].workouts - lastTwo[0].workouts) / lastTwo[0].workouts) * 100
      : 0
  const volumeChange =
    lastTwo.length === 2 && lastTwo[0].volume > 0 ? ((lastTwo[1].volume - lastTwo[0].volume) / lastTwo[0].volume) * 100 : 0
  const cardioChange =
    lastTwo.length === 2 && lastTwo[0].cardioMinutes > 0
      ? ((lastTwo[1].cardioMinutes - lastTwo[0].cardioMinutes) / lastTwo[0].cardioMinutes) * 100
      : 0

  const avgWorkoutsPerWeek =
    weeklyWorkoutData.length > 0
      ? weeklyWorkoutData.reduce((sum, week) => sum + week.workouts, 0) / weeklyWorkoutData.length
      : 0

  const exerciseCompletionData = await buildDailyCompletion(user.id, supabase)

  return {
    weeklyWorkoutData,
    exerciseCompletionData,
    totalWorkoutsThisMonth,
    avgWorkoutsPerWeek: Number(avgWorkoutsPerWeek.toFixed(1)),
    workoutChange,
    volumeChange,
    cardioChange,
  }
}

async function buildDailyCompletion(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const start = new Date()
  start.setDate(start.getDate() - 6)
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const { data } = await supabase
    .from("workout_exercises")
    .select(
      `
      completed,
      created_at,
      workouts!inner (
        user_id,
        created_at
      )
    `,
    )
    .eq("workouts.user_id", userId)
    .gte("workouts.created_at", start.toISOString())
    .lte("workouts.created_at", end.toISOString())

  const days: Array<{ day: string; completed: number; total: number }> = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    const label = day.toLocaleDateString(undefined, { weekday: "short" })
    const stats = { day: label, completed: 0, total: 0 }
    ;(data || []).forEach((exercise: any) => {
      const workout = Array.isArray(exercise.workouts) ? exercise.workouts[0] : exercise.workouts
      const exerciseDate = new Date(exercise.created_at || workout?.created_at || "")
      if (
        exerciseDate.getFullYear() === day.getFullYear() &&
        exerciseDate.getMonth() === day.getMonth() &&
        exerciseDate.getDate() === day.getDate()
      ) {
        stats.total += 1
        if (exercise.completed) stats.completed += 1
      }
    })
    days.push(stats)
  }

  return days
}

function getWeekNumber(date: Date) {
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7))
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
  return weekNumber
}

