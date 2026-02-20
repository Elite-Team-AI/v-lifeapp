/**
 * Bootstrap API Endpoint - OPTIMIZED
 * 
 * Fetches all core application data in a single parallel request.
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Single auth check (was 9+ before)
 * - Single profile query shared across all data types
 * - Parallel database queries with shared context
 * - Batched dashboard data (daily insight, weekly reflection, vitalflow)
 */

import { NextResponse } from "next/server"
import { createClient, getAuthUser } from "@/lib/supabase/server"
import {
  getProfileInternal,
  getUserHabitsInternal,
  getWeeklyProgressInternal,
  getSubscriptionInternal,
  getReferralStatsInternal,
  getStreakStatsInternal,
  getMilestonesInternal,
  getNotificationPreferencesInternal,
  getDailyInsightInternal,
  shouldPromptWeeklyReflectionInternal,
  getVitalFlowSuggestionsInternal,
} from "@/lib/actions/app-data-internal"
import { getGamificationDataInternal } from "@/lib/actions/gamification"
import type { AppData } from "@/lib/types/app-data"

const DEFAULT_TIMEZONE = "America/New_York"

export async function GET() {
  const startTime = performance.now()

  try {
    // Create Supabase client ONCE and use it for everything
    const supabase = await createClient()

    // SINGLE auth check for the entire request using the same client
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("[AppData API] Auth error:", authError)
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    console.log("[AppData API] Authenticated user:", {
      id: user.id,
      email: user.email,
      role: user.role,
    })

    const userId = user.id

    // Get session for edge function calls and verification
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token || ""
    console.log("[AppData API] Session exists:", !!session)
    console.log("[AppData API] Auth UID matches user ID:", user.id === userId)

    // Step 1: Get profile first to extract timezone (needed by other queries)
    const profile = await getProfileInternal(userId, supabase)
    const timezone = profile?.timezone || DEFAULT_TIMEZONE

    console.log("[AppData API] Profile result:", {
      exists: !!profile,
      userId: userId,
      timezone: timezone,
      profileKeys: profile ? Object.keys(profile) : null,
    })

    // Step 2: Fetch ALL data in parallel using internal functions
    // These don't re-check auth - they use the userId and supabase we pass
    const [
      habits,
      weeklyProgress,
      subscription,
      referralStats,
      streakStats,
      milestones,
      notificationPreferences,
      dailyInsight,
      shouldPromptWeeklyReflection,
      vitalFlowSuggestions,
      gamificationData,
    ] = await Promise.all([
      getUserHabitsInternal(userId, timezone, supabase),
      getWeeklyProgressInternal(userId, timezone, supabase),
      getSubscriptionInternal(userId, supabase),
      getReferralStatsInternal(userId, supabase),
      getStreakStatsInternal(userId, timezone, supabase),
      getMilestonesInternal(userId, supabase),
      getNotificationPreferencesInternal(userId, supabase),
      getDailyInsightInternal(userId, timezone, supabase, accessToken),
      shouldPromptWeeklyReflectionInternal(userId, supabase),
      getVitalFlowSuggestionsInternal(userId, supabase),
      getGamificationDataInternal(userId, supabase),
    ])

    // Build the AppData payload
    const appData: AppData = {
      profile: profile,
      weeklyProgress: weeklyProgress,
      habits: habits,
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            billingCycle: subscription.billing_cycle,
            price: subscription.price,
            nextBillingDate: subscription.next_billing_date,
          }
        : null,
      referralStats: referralStats,
      streakStats: streakStats,
      milestones: milestones,
      notificationPreferences: notificationPreferences,
      dailyInsight: dailyInsight,
      shouldPromptWeeklyReflection: shouldPromptWeeklyReflection,
      vitalFlowSuggestions: vitalFlowSuggestions,
      gamification: gamificationData.stats,
      unlockedAchievements: gamificationData.achievements,
      allAchievements: gamificationData.allAchievements,
      todayXP: gamificationData.todayXP,
      fetchedAt: new Date().toISOString(),
    }

    const duration = Math.round(performance.now() - startTime)
    console.log(`[AppData API] ✅ Fetched all data in ${duration}ms (optimized)`)

    return NextResponse.json(appData)
  } catch (error) {
    console.error("[AppData API] Error fetching bootstrap data:", error)
    return NextResponse.json(
      { error: "Failed to fetch app data" },
      { status: 500 }
    )
  }
}

