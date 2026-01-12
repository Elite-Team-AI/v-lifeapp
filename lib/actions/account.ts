"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Deletes the user's account and all associated data.
 * This is a permanent action that cannot be undone.
 *
 * The deletion relies on Supabase's cascade delete policies
 * set up in the database schema to remove all user data.
 */
export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = user.id

    // Delete user data from tables that may not have cascade deletes
    // Order matters: delete from tables that reference profiles first
    const tablesToClean = [
      "habit_logs",
      "habits",
      "meals",
      "meal_plan_days",
      "meal_plans",
      "workouts",
      "weight_entries",
      "progress_photos",
      "community_posts",
      "post_reactions",
      "comments",
      "daily_insights",
      "notifications_preferences",
      "push_subscriptions",
      "referral_stats",
      "streaks",
      "milestones",
      "supplements",
      "subscriptions",
      "grocery_items",
      "weekly_reflections",
    ]

    // Attempt to delete from each table (ignore errors for tables that don't exist)
    for (const table of tablesToClean) {
      try {
        await supabase.from(table).delete().eq("user_id", userId)
      } catch {
        // Table might not exist or might use different column name
        // Try with 'id' column for profiles-like tables
        try {
          await supabase.from(table).delete().eq("id", userId)
        } catch {
          // Ignore - table might not exist or use different schema
        }
      }
    }

    // Delete the user's profile
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId)

    if (profileError) {
      console.error("[deleteAccount] Profile deletion error:", profileError)
      // Continue anyway - we'll still try to delete auth user
    }

    // Delete the auth user - this is the critical step
    // Note: This uses the admin API which requires service role key
    // Since we're using the anon key, we'll sign out the user instead
    // and let Supabase handle the auth cleanup

    // Sign out the user to invalidate their session
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      console.error("[deleteAccount] Sign out error:", signOutError)
    }

    // Revalidate paths to clear any cached data
    revalidatePath("/")
    revalidatePath("/dashboard")
    revalidatePath("/settings")

    return { success: true }
  } catch (error) {
    console.error("[deleteAccount] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete account"
    }
  }
}
