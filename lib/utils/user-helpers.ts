import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "@/lib/types"

const DEFAULT_TIMEZONE = "America/New_York"

/**
 * Gets the user's timezone from their profile.
 * Falls back to America/New_York if not set or on error.
 */
export async function getUserTimezone(): Promise<string> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return DEFAULT_TIMEZONE

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .single()

    if (error) {
      // Column might not exist yet in some environments
      if (error.code !== "PGRST116") {
        console.error("[getUserTimezone] Error:", error.message)
      }
      return DEFAULT_TIMEZONE
    }

    return profile?.timezone || DEFAULT_TIMEZONE
  } catch (error) {
    console.error("[getUserTimezone] Exception:", error)
    return DEFAULT_TIMEZONE
  }
}

/**
 * Gets the authenticated user or throws if not authenticated.
 * Use this when authentication is required.
 */
export async function requireUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Not authenticated")
  }

  return { user, supabase }
}

/**
 * Gets the authenticated user or returns null.
 * Use this when authentication is optional.
 */
export async function getUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { user, supabase }
}

/**
 * Gets the user's role from their profile.
 * Returns 'user' as default if not found.
 */
export async function getUserRole(): Promise<UserRole> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return 'user'

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single()

    return (profile?.user_role as UserRole) || 'user'
  } catch (error) {
    console.error("[getUserRole] Error:", error)
    return 'user'
  }
}

/**
 * Checks if the current user is a Super Admin.
 */
export async function isSuperAdmin(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'super_admin'
}

/**
 * Checks if the current user is "The Chosen" (free access tier).
 */
export async function isChosen(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'chosen'
}

/**
 * Checks if the current user has free access (Chosen or Super Admin).
 */
export async function hasFreeAccess(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'chosen' || role === 'super_admin'
}

/**
 * Requires the user to be a Super Admin, throws otherwise.
 * Use this to protect admin-only routes and actions.
 */
export async function requireSuperAdmin() {
  const { user, supabase } = await requireUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_role")
    .eq("id", user.id)
    .single()

  if (profile?.user_role !== 'super_admin') {
    throw new Error("Access denied: Super Admin privileges required")
  }

  return { user, supabase, profile }
}

