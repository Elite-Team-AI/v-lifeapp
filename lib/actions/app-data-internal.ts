/**
 * Internal Data Fetchers for App Data API
 * 
 * These functions accept userId, timezone, and supabase client as parameters
 * instead of fetching auth themselves. This eliminates redundant auth checks
 * when fetching multiple data types in parallel.
 * 
 * IMPORTANT: Only use these from the /api/app-data route where auth is already verified.
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { getTodayInTimezone } from "@/lib/utils/timezone"
import type {
  Profile,
  HabitWithStatus,
  ReferralStats,
  StreakStats,
  Milestone,
  NotificationPreferences,
  HabitStreakDetail,
  WeeklyActivityDay,
} from "@/lib/types"
import type { VitalFlowSuggestion } from "./vitalflow-habits"

// ============================================================================
// PROFILE
// ============================================================================

export async function getProfileInternal(
  userId: string,
  supabase: SupabaseClient
): Promise<Profile | null> {
  console.log("[getProfileInternal] Fetching profile for userId:", userId)

  // First, check if profile exists at all (count query doesn't require RLS)
  const { count, error: countError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("id", userId)

  console.log("[getProfileInternal] Profile count check:", {
    count,
    countError: countError?.message,
  })

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error("[getProfileInternal] Database error:", error)
    console.error("[getProfileInternal] Error code:", error.code)
    console.error("[getProfileInternal] Error message:", error.message)
    console.error("[getProfileInternal] Error details:", error.details)
    console.error("[getProfileInternal] Error hint:", error.hint)
    return null
  }

  console.log("[getProfileInternal] Profile fetched successfully:", profile ? "YES" : "NO")
  if (profile) {
    console.log("[getProfileInternal] Profile keys:", Object.keys(profile))
    console.log("[getProfileInternal] Profile sample data:", {
      id: profile.id,
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      primary_goal: profile.primary_goal,
      height_feet: profile.height_feet,
      height_inches: profile.height_inches,
      weight: profile.weight,
      goal_weight: profile.goal_weight,
    })
  } else {
    console.warn("[getProfileInternal] Profile is null despite no error - this suggests RLS blocking the query")
  }

  return profile
}

// ============================================================================
// HABITS
// ============================================================================

async function checkAndResetHabitsIfNeededInternal(
  userId: string,
  timezone: string,
  supabase: SupabaseClient
) {
  const today = getTodayInTimezone(timezone)

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("last_habit_reset")
      .eq("id", userId)
      .single()

    if (error) return

    const lastReset = profile?.last_habit_reset

    // Check if it's a new day
    if (!lastReset || lastReset !== today) {
      // Update last reset date
      await supabase.from("profiles").update({ last_habit_reset: today }).eq("id", userId)
    }
  } catch {
    // Silently handle errors
  }
}

export async function getUserHabitsInternal(
  userId: string,
  timezone: string,
  supabase: SupabaseClient
): Promise<HabitWithStatus[]> {
  const today = getTodayInTimezone(timezone)

  try {
    // Check reset in parallel with fetching data (non-blocking)
    const resetPromise = checkAndResetHabitsIfNeededInternal(userId, timezone, supabase)

    // Fetch habits and logs in parallel
    const [habitsResult, logsResult] = await Promise.all([
      supabase
        .from("habits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("habit_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("logged_at", today),
    ])

    // Wait for reset check to complete
    await resetPromise

    const habits = habitsResult.data
    const logs = logsResult.data

    if (!habits || habits.length === 0) {
      return []
    }

    // Merge habits with today's completion status
    const habitsWithStatus: HabitWithStatus[] = habits.map((habit) => {
      const log = logs?.find((l) => l.habit_id === habit.id)
      return {
        ...habit,
        completed: log?.completed || false,
        logId: log?.id || null,
      }
    })

    return habitsWithStatus
  } catch (error) {
    console.error("[getUserHabitsInternal] Error:", error)
    return []
  }
}

// ============================================================================
// WEEKLY PROGRESS
// ============================================================================

export async function getWeeklyProgressInternal(
  userId: string,
  timezone: string,
  supabase: SupabaseClient
): Promise<number> {
  const today = getTodayInTimezone(timezone)

  // Get the last 7 days
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const startDate = sevenDaysAgo.toISOString().split("T")[0]

  // Fetch habits and logs in parallel
  const [habitsResult, logsResult] = await Promise.all([
    supabase.from("habits").select("id").eq("user_id", userId),
    supabase
      .from("habit_logs")
      .select("completed")
      .eq("user_id", userId)
      .gte("logged_at", startDate)
      .lte("logged_at", today),
  ])

  const habits = habitsResult.data
  const logs = logsResult.data

  if (!habits || habits.length === 0) {
    return 0
  }

  // Calculate progress
  const totalPossible = habits.length * 7
  const completedCount = logs?.filter((log) => log.completed).length || 0
  return totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0
}

// ============================================================================
// SUBSCRIPTION
// ============================================================================

export async function getSubscriptionInternal(
  userId: string,
  supabase: SupabaseClient
) {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (data) return data

  // Create default subscription if none exists
  const { data: created } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan: "free",
      status: "active",
      billing_cycle: "monthly",
      price: 0,
      next_billing_date: null,
    })
    .select("*")
    .single()

  return created
}

// ============================================================================
// REFERRAL STATS
// ============================================================================

export async function getReferralStatsInternal(
  userId: string,
  supabase: SupabaseClient
): Promise<ReferralStats> {
  const defaultStats: ReferralStats = {
    referralCode: "",
    creditsBalance: 0,
    referralsCount: 0,
    creditsEarned: 0,
  }

  try {
    // Get user's profile with referral code and credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("referral_code, credits, name")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("[getReferralStatsInternal] Profile error:", profileError)
      return defaultStats
    }

    let referralCode = profile.referral_code
    const needsNewCode = !referralCode || !referralCode.startsWith("VLIFE-")

    if (needsNewCode) {
      const userName = profile.name || "USER"
      const firstName = userName
        .split(" ")[0]
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
      const year = new Date().getFullYear()
      referralCode = `VLIFE-${firstName}${year}`

      const { data: existingCode } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode)
        .maybeSingle()

      if (existingCode) {
        referralCode = `VLIFE-${firstName}${Math.floor(Math.random() * 1000)}`
      }

      // Update profile with new referral code
      await supabase
        .from("profiles")
        .update({ referral_code: referralCode })
        .eq("id", userId)
    }

    // Get count of successful referrals
    const { data: referrals } = await supabase
      .from("referrals")
      .select("id, credits_earned")
      .eq("referrer_id", userId)
      .eq("status", "completed")

    const referralsCount = referrals?.length || 0
    const creditsEarned = referrals?.reduce((sum, ref) => sum + (ref.credits_earned || 0), 0) || 0
    const creditsBalance = profile.credits || 0

    return {
      referralCode,
      creditsBalance,
      referralsCount,
      creditsEarned,
    }
  } catch (error) {
    console.error("[getReferralStatsInternal] Exception:", error)
    return defaultStats
  }
}

// ============================================================================
// STREAK STATS
// ============================================================================

export async function getStreakStatsInternal(
  userId: string,
  timezone: string,
  supabase: SupabaseClient
): Promise<StreakStats> {
  const defaultStats: StreakStats = {
    overallStreak: 0,
    longestStreak: 0,
    totalDaysActive: 0,
    habitStreaks: [],
    weeklyActivity: [],
  }

  const today = getTodayInTimezone(timezone)

  try {
    // Get all user's habits with their streaks
    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select("id, name, category, current_streak, best_streak, created_at")
      .eq("user_id", userId)
      .order("current_streak", { ascending: false })

    if (habitsError || !habits || habits.length === 0) {
      return defaultStats
    }

    // Calculate overall streak
    const overallStreak = Math.max(...habits.map((h) => h.current_streak || 0), 0)
    const longestStreak = Math.max(...habits.map((h) => h.best_streak || 0), 0)

    // Get habit logs
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("habit_id, logged_at, completed")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })

    // Calculate stats for each habit
    const habitStreaks: HabitStreakDetail[] = habits.map((habit) => {
      const habitLogs = logs?.filter((log) => log.habit_id === habit.id) || []
      const completedLogs = habitLogs.filter((log) => log.completed)

      // Find last completed date
      const lastCompletedLog = completedLogs[0]
      let lastCompleted = "Never"
      if (lastCompletedLog) {
        const logDate = lastCompletedLog.logged_at
        if (logDate === today) {
          lastCompleted = "Today"
        } else {
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split("T")[0]
          if (logDate === yesterdayStr) {
            lastCompleted = "Yesterday"
          } else {
            const date = new Date(logDate)
            lastCompleted = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          }
        }
      }

      // Calculate completion rate (last 30 days)
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0]

      const recentLogs = habitLogs.filter((log) => log.logged_at >= thirtyDaysAgoStr)
      const completedRecent = recentLogs.filter((log) => log.completed).length
      const completionRate = recentLogs.length > 0 ? Math.round((completedRecent / 30) * 100) : 0

      return {
        id: habit.id,
        name: habit.name,
        currentStreak: habit.current_streak || 0,
        longestStreak: habit.best_streak || 0,
        category: habit.category,
        lastCompleted,
        completionRate,
        totalCompletions: completedLogs.length,
      }
    })

    // Calculate weekly activity (last 7 days)
    const weeklyActivity: WeeklyActivityDay[] = []
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      const dayName = daysOfWeek[date.getDay()]

      const dayLogs = logs?.filter((log) => log.logged_at === dateStr && log.completed) || []
      const active = dayLogs.length > 0

      weeklyActivity.push({
        day: dayName,
        active,
        date: dateStr,
      })
    }

    // Calculate total days active
    const uniqueDates = new Set(logs?.filter((log) => log.completed).map((log) => log.logged_at))
    const totalDaysActive = uniqueDates.size

    return {
      overallStreak,
      longestStreak,
      totalDaysActive,
      habitStreaks,
      weeklyActivity,
    }
  } catch (error) {
    console.error("[getStreakStatsInternal] Error:", error)
    return defaultStats
  }
}

// ============================================================================
// MILESTONES
// ============================================================================

export async function getMilestonesInternal(
  userId: string,
  supabase: SupabaseClient
): Promise<Milestone[]> {
  try {
    // Get user's habits
    const { data: habits } = await supabase
      .from("habits")
      .select("current_streak, best_streak")
      .eq("user_id", userId)

    if (!habits || habits.length === 0) {
      return []
    }

    const maxCurrentStreak = Math.max(...habits.map((h) => h.current_streak || 0), 0)
    const maxBestStreak = Math.max(...habits.map((h) => h.best_streak || 0), 0)

    // Get total habit logs
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("logged_at, completed")
      .eq("user_id", userId)
      .eq("completed", true)

    const uniqueDates = new Set(logs?.map((log) => log.logged_at))
    const totalDaysActive = uniqueDates.size

    const milestones: Milestone[] = [
      {
        id: 1,
        name: "First Week",
        achieved: maxCurrentStreak >= 7 || maxBestStreak >= 7,
        icon: "Target",
        color: "text-accent",
      },
      {
        id: 2,
        name: "30 Day Warrior",
        achieved: maxCurrentStreak >= 30 || maxBestStreak >= 30,
        icon: "Trophy",
        color: "text-yellow-500",
      },
      {
        id: 3,
        name: "100 Day Legend",
        achieved: maxCurrentStreak >= 100 || maxBestStreak >= 100,
        icon: "Award",
        color: "text-purple-500",
      },
      {
        id: 4,
        name: "Consistency King",
        achieved: totalDaysActive >= 50,
        icon: "Zap",
        color: "text-blue-500",
      },
    ]

    return milestones
  } catch (error) {
    console.error("[getMilestonesInternal] Error:", error)
    return []
  }
}

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

export async function getNotificationPreferencesInternal(
  userId: string,
  supabase: SupabaseClient
): Promise<NotificationPreferences> {
  const defaults: NotificationPreferences = {
    notificationsEnabled: true,
    workoutReminders: true,
    workoutReminderTime: "08:00",
    mealReminders: true,
    breakfastReminderTime: "08:00",
    lunchReminderTime: "12:00",
    dinnerReminderTime: "18:00",
    progressUpdates: true,
    streakWarnings: true,
    achievementNotifications: true,
    habitReminders: true,
  }

  function normalizeTime(value: string | null | undefined, fallback: string) {
    if (!value) return fallback
    return value.slice(0, 5)
  }

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "notifications_enabled, workout_reminders, workout_reminder_time, meal_reminders, breakfast_reminder_time, lunch_reminder_time, dinner_reminder_time, progress_updates, streak_warnings, achievement_notifications, habit_reminders"
      )
      .eq("id", userId)
      .single()

    if (error) {
      console.error("[getNotificationPreferencesInternal] Error:", error)
      return defaults
    }

    return {
      notificationsEnabled: profile.notifications_enabled ?? true,
      workoutReminders: profile.workout_reminders ?? true,
      workoutReminderTime: normalizeTime(profile.workout_reminder_time, "08:00"),
      mealReminders: profile.meal_reminders ?? true,
      breakfastReminderTime: normalizeTime(profile.breakfast_reminder_time, "08:00"),
      lunchReminderTime: normalizeTime(profile.lunch_reminder_time, "12:00"),
      dinnerReminderTime: normalizeTime(profile.dinner_reminder_time, "18:00"),
      progressUpdates: profile.progress_updates ?? true,
      streakWarnings: profile.streak_warnings ?? true,
      achievementNotifications: profile.achievement_notifications ?? true,
      habitReminders: profile.habit_reminders ?? true,
    }
  } catch (error) {
    console.error("[getNotificationPreferencesInternal] Exception:", error)
    return defaults
  }
}

// ============================================================================
// DAILY INSIGHT
// ============================================================================

export async function getDailyInsightInternal(
  userId: string,
  timezone: string,
  supabase: SupabaseClient,
  accessToken: string
): Promise<string | null> {
  const localDate = getTodayInTimezone(timezone)

  try {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke("daily-insight", {
      body: {
        localDate,
        timezone,
      },
    })

    if (error) {
      console.error("[getDailyInsightInternal] Edge function error:", error)
      return "Keep pushing forward! Every small step counts toward your goals."
    }

    return data?.insight || "Stay focused on your journey. You've got this!"
  } catch (error) {
    console.error("[getDailyInsightInternal] Error:", error)
    return "Start small and build momentum. Complete one habit today!"
  }
}

// ============================================================================
// WEEKLY REFLECTION STATUS
// ============================================================================

function getWeekStartDate(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split("T")[0]
}

export async function shouldPromptWeeklyReflectionInternal(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const weekStart = getWeekStartDate()
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday

  // Only prompt on Sunday (0) or Monday (1) - not every day
  if (dayOfWeek !== 0 && dayOfWeek !== 1) {
    return false
  }

  try {
    // Check if there's already a reflection for this week
    const { data: reflection, error: reflectionError } = await supabase
      .from("weekly_reflections")
      .select("id")
      .eq("user_id", userId)
      .eq("week_start_date", weekStart)
      .single()

    if (reflectionError && reflectionError.code !== "PGRST116") {
      console.error("[shouldPromptWeeklyReflectionInternal] Error:", reflectionError)
      return false
    }

    // If reflection already exists, don't prompt
    if (reflection) {
      return false
    }

    // Check if user dismissed the prompt this week (stored in profile)
    const { data: profile } = await supabase
      .from("profiles")
      .select("weekly_reflection_dismissed_at")
      .eq("id", userId)
      .single()

    if (profile?.weekly_reflection_dismissed_at) {
      const dismissedAt = new Date(profile.weekly_reflection_dismissed_at)
      const weekStartDate = new Date(weekStart)
      // If dismissed after this week started, don't prompt again this week
      if (dismissedAt >= weekStartDate) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error("[shouldPromptWeeklyReflectionInternal] Exception:", error)
    return false
  }
}

// ============================================================================
// VITALFLOW SUGGESTIONS
// ============================================================================

export async function getVitalFlowSuggestionsInternal(
  userId: string,
  supabase: SupabaseClient
): Promise<VitalFlowSuggestion[]> {
  const targetDate = new Date().toISOString().split("T")[0]

  try {
    const { data, error } = await supabase
      .from("daily_habit_suggestions")
      .select("*")
      .eq("user_id", userId)
      .eq("date", targetDate)
      .order("rank", { ascending: true })

    if (error) {
      console.error("[getVitalFlowSuggestionsInternal] Error:", error)
      return []
    }

    return (data as VitalFlowSuggestion[]) || []
  } catch (error) {
    console.error("[getVitalFlowSuggestionsInternal] Exception:", error)
    return []
  }
}
