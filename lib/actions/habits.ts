"use server"

import { createClient, getAuthUser, createServiceClient } from "@/lib/supabase/server"
import { unstable_cache, revalidateTag } from "next/cache"
import { getTodayInTimezone, isNewDayInTimezone } from "@/lib/utils/timezone"
import { getUserTimezone } from "@/lib/utils/user-helpers"
import type { HabitWithStatus, HabitsResult, ProgressResult } from "@/lib/types"

async function checkAndResetHabitsIfNeeded(userId: string) {
  const supabase = await createClient()
  const timezone = await getUserTimezone()
  const today = getTodayInTimezone(timezone)

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("last_habit_reset")
      .eq("id", userId)
      .single()

    if (error) {
      // Column might not exist yet
      return
    }

    const lastReset = profile?.last_habit_reset

    // Check if it's a new day
    if (isNewDayInTimezone(lastReset, timezone)) {
      // Update last reset date
      await supabase.from("profiles").update({ last_habit_reset: today }).eq("id", userId)
      // Note: We don't delete old logs, we just create new ones for today
    }
  } catch {
    // Silently handle errors during reset check
    return
  }
}

// Cached habits fetch - uses service client for cache compatibility
const getCachedHabits = unstable_cache(
  async (userId: string) => {
    const supabase = createServiceClient()
    const { data: habits, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return habits
  },
  ["user-habits"],
  { revalidate: 30, tags: ["user-habits"] }
)

export async function getUserHabits(): Promise<HabitsResult> {
  const { user, error: authError } = await getAuthUser()

  if (authError || !user) {
    return { habits: [], error: "Not authenticated" }
  }

  await checkAndResetHabitsIfNeeded(user.id)

  const supabase = await createClient()
  const timezone = await getUserTimezone()
  const today = getTodayInTimezone(timezone)

  try {
    // Fetch habits and logs in parallel
    const [habits, logsResult] = await Promise.all([
      getCachedHabits(user.id).catch((err) => {
        console.error("[Habits] Error fetching cached habits:", err)
        return [] // Return empty array on error
      }),
      supabase
        .from("habit_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("logged_at", today)
    ])

    if (!habits || habits.length === 0) {
      return { habits: [], error: null }
    }

    const logs = logsResult.data

    // Merge habits with today's completion status
    const habitsWithStatus: HabitWithStatus[] = habits.map((habit) => {
      const log = logs?.find((l) => l.habit_id === habit.id)
      return {
        ...habit,
        completed: log?.completed || false,
        logId: log?.id || null,
      }
    })

    return { habits: habitsWithStatus, error: null }
  } catch (error) {
    console.error("[Habits] Unexpected error in getUserHabits:", error)
    return { habits: [], error: error instanceof Error ? error.message : "Failed to fetch habits" }
  }
}

export async function toggleHabitCompletion(
  habitId: string, 
  currentlyCompleted: boolean
): Promise<{ success: boolean; error: string | null }> {
  const { user, error: authError } = await getAuthUser()

  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabase = await createClient()

  const timezone = await getUserTimezone()
  const today = getTodayInTimezone(timezone)

  // Check if a log already exists for today
  const { data: existingLog, error: fetchError } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("habit_id", habitId)
    .eq("logged_at", today)
    .maybeSingle()

  if (fetchError) {
    console.error("[Habits] Error fetching habit log:", fetchError)
    return { success: false, error: fetchError.message }
  }

  if (existingLog) {
    // Update existing log
    const { error: updateError } = await supabase
      .from("habit_logs")
      .update({ completed: !currentlyCompleted })
      .eq("id", existingLog.id)

    if (updateError) {
      console.error("[Habits] Error updating habit log:", updateError)
      return { success: false, error: updateError.message }
    }
  } else {
    // Create new log
    const { error: insertError } = await supabase.from("habit_logs").insert({
      user_id: user.id,
      habit_id: habitId,
      completed: !currentlyCompleted,
      logged_at: today,
    })

    if (insertError) {
      console.error("[Habits] Error creating habit log:", insertError)
      return { success: false, error: insertError.message }
    }
  }

  // Update streak if completing the habit
  if (!currentlyCompleted) {
    const { data: habit } = await supabase
      .from("habits")
      .select("current_streak, best_streak")
      .eq("id", habitId)
      .single()

    if (habit) {
      const newStreak = (habit.current_streak || 0) + 1
      const newBestStreak = Math.max(newStreak, habit.best_streak || 0)

      await supabase
        .from("habits")
        .update({
          current_streak: newStreak,
          best_streak: newBestStreak,
        })
        .eq("id", habitId)
    }
  } else {
    // Reset streak if uncompleting
    await supabase
      .from("habits")
      .update({
        current_streak: 0,
      })
      .eq("id", habitId)
  }

  return { success: true, error: null }
}

export async function createDefaultHabits(skipRevalidation = false): Promise<{ success: boolean; error: string | null; message?: string }> {
  const { user, error: authError } = await getAuthUser()

  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabase = await createClient()

  // Check if user already has habits
  const { data: existingHabits } = await supabase
    .from("habits")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)

  if (existingHabits && existingHabits.length > 0) {
    return { success: true, error: null, message: "Habits already exist" }
  }

  // Create default habits
  const defaultHabits = [
    { name: "Morning Workout", category: "fitness", frequency: "daily" },
    { name: "Protein Intake", category: "nutrition", frequency: "daily" },
    { name: "8 Glasses of Water", category: "nutrition", frequency: "daily" },
    { name: "Evening Stretch", category: "fitness", frequency: "daily" },
  ]

  const { error: insertError } = await supabase.from("habits").insert(
    defaultHabits.map((habit) => ({
      user_id: user.id,
      ...habit,
      current_streak: 0,
      best_streak: 0,
    }))
  )

  if (insertError) {
    console.error("[Habits] Error creating default habits:", insertError)
    return { success: false, error: insertError.message }
  }

  // Skip revalidation when called during render (e.g., from Server Components)
  if (!skipRevalidation) {
    revalidateTag("user-habits")
  }
  return { success: true, error: null }
}

export async function createHabit(
  name: string, 
  category: string, 
  frequency: string
): Promise<{ success: boolean; habit?: HabitWithStatus; error: string | null }> {
  const { user, error: authError } = await getAuthUser()

  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("habits")
    .insert({
      user_id: user.id,
      name,
      category,
      frequency,
      current_streak: 0,
      best_streak: 0,
    })
    .select()
    .single()

  if (error) {
    console.error("[Habits] Error creating habit:", error)
    return { success: false, error: error.message }
  }

  revalidateTag("user-habits")
  return { 
    success: true, 
    habit: { ...data, completed: false, logId: null }, 
    error: null 
  }
}

export async function updateHabit(
  habitId: string, 
  name: string, 
  category: string, 
  frequency: string
): Promise<{ success: boolean; habit?: HabitWithStatus; error: string | null }> {
  const { user, error: authError } = await getAuthUser()

  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("habits")
    .update({
      name,
      category,
      frequency,
    })
    .eq("id", habitId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("[Habits] Error updating habit:", error)
    return { success: false, error: error.message }
  }

  revalidateTag("user-habits")
  return { 
    success: true, 
    habit: { ...data, completed: false, logId: null }, 
    error: null 
  }
}

export async function deleteHabit(habitId: string): Promise<{ success: boolean; error: string | null }> {
  const { user, error: authError } = await getAuthUser()

  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabase = await createClient()

  // Delete all habit logs first
  await supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("user_id", user.id)

  // Delete the habit
  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", habitId)
    .eq("user_id", user.id)

  if (error) {
    console.error("[Habits] Error deleting habit:", error)
    return { success: false, error: error.message }
  }

  revalidateTag("user-habits")
  return { success: true, error: null }
}

export async function getWeeklyProgress(): Promise<ProgressResult> {
  const { user, error: authError } = await getAuthUser()

  if (authError || !user) {
    return { progress: 0, error: "Not authenticated" }
  }

  const supabase = await createClient()
  const timezone = await getUserTimezone()
  const today = getTodayInTimezone(timezone)

  // Get the last 7 days in user's timezone
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const startDate = sevenDaysAgo.toISOString().split("T")[0]

  // Fetch habits and logs in parallel
  const [habitsResult, logsResult] = await Promise.all([
    supabase.from("habits").select("id").eq("user_id", user.id),
    supabase.from("habit_logs").select("completed").eq("user_id", user.id).gte("logged_at", startDate).lte("logged_at", today)
  ])

  const habits = habitsResult.data
  const logs = logsResult.data

  if (!habits || habits.length === 0) {
    return { progress: 0, error: null }
  }

  // Calculate progress
  const totalPossible = habits.length * 7
  const completedCount = logs?.filter((log) => log.completed).length || 0
  const progress = totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0

  return { progress, error: null }
}
