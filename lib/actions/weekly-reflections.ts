"use server"

import { createClient } from "@/lib/supabase/server"

export interface WeeklyReflection {
  id: string
  user_id: string
  week_start_date: string
  fatigue_level?: number
  enjoyment_level?: number
  difficulty_level?: number
  notes?: string
  created_at: string
}

/**
 * Get the start of the current week (Monday)
 */
function getWeekStartDate(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}

/**
 * Get weekly reflection for the current week
 */
export async function getCurrentWeekReflection() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { reflection: null, error: "Not authenticated" }
    }

    const weekStart = getWeekStartDate()

    const { data, error } = await supabase
      .from('weekly_reflections')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStart)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error("[WeeklyReflection] Error fetching:", error)
      return { reflection: null, error: error.message }
    }

    return { reflection: data as WeeklyReflection | null, error: null }
  } catch (error) {
    console.error("[WeeklyReflection] Exception:", error)
    return { reflection: null, error: "Failed to fetch reflection" }
  }
}

/**
 * Create or update weekly reflection
 */
export async function saveWeeklyReflection(
  fatigueLevel: number,
  enjoymentLevel: number,
  difficultyLevel: number,
  notes?: string
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const weekStart = getWeekStartDate()

    // Validate levels (1-10)
    if (
      fatigueLevel < 1 || fatigueLevel > 10 ||
      enjoymentLevel < 1 || enjoymentLevel > 10 ||
      difficultyLevel < 1 || difficultyLevel > 10
    ) {
      return { success: false, error: "Invalid level values (must be 1-10)" }
    }

    const { error } = await supabase
      .from('weekly_reflections')
      .upsert({
        user_id: user.id,
        week_start_date: weekStart,
        fatigue_level: fatigueLevel,
        enjoyment_level: enjoymentLevel,
        difficulty_level: difficultyLevel,
        notes: notes || null,
      }, {
        onConflict: 'user_id,week_start_date'
      })

    if (error) {
      console.error("[WeeklyReflection] Error saving:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("[WeeklyReflection] Exception:", error)
    return { success: false, error: "Failed to save reflection" }
  }
}

/**
 * Check if user should be prompted for weekly reflection
 */
export async function shouldPromptWeeklyReflection() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { shouldPrompt: false, error: "Not authenticated" }
    }

    const weekStart = getWeekStartDate()

    // Check if there's already a reflection for this week
    const { data, error } = await supabase
      .from('weekly_reflections')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStart)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error("[WeeklyReflection] Error checking:", error)
      return { shouldPrompt: false, error: error.message }
    }

    // If no reflection exists for this week, prompt
    return { shouldPrompt: !data, error: null }
  } catch (error) {
    console.error("[WeeklyReflection] Exception:", error)
    return { shouldPrompt: false, error: "Failed to check reflection status" }
  }
}

/**
 * Get recent reflections for trend analysis
 */
export async function getRecentReflections(weeks = 4) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { reflections: null, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from('weekly_reflections')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start_date', { ascending: false })
      .limit(weeks)

    if (error) {
      console.error("[WeeklyReflection] Error fetching recent:", error)
      return { reflections: null, error: error.message }
    }

    return { reflections: data as WeeklyReflection[], error: null }
  } catch (error) {
    console.error("[WeeklyReflection] Exception:", error)
    return { reflections: null, error: "Failed to fetch reflections" }
  }
}

/**
 * Dismiss weekly reflection prompt for the current week
 */
export async function dismissWeeklyReflection() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ weekly_reflection_dismissed_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      console.error("[WeeklyReflection] Error dismissing:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("[WeeklyReflection] Exception:", error)
    return { success: false, error: "Failed to dismiss reflection" }
  }
}

