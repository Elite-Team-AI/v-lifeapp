"use server"

import { createClient, getAuthUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface Challenge {
  id: string
  title: string
  description: string | null
  challenge_type: string | null
  target_value: number | null
  duration_days: number | null
  start_date: string | null
  end_date: string | null
  participants_count: number
  created_at: string
}

interface ChallengeParticipant {
  id: string
  user_id: string
  progress: number
  completed: boolean
  joined_at: string
  profiles: {
    id: string
    name: string | null
    avatar_url: string | null
  } | null
}

// Check if current user is an admin
export async function checkIsAdmin(): Promise<{ isAdmin: boolean; error?: string }> {
  const { user, error: authError } = await getAuthUser()
  if (authError || !user) {
    return { isAdmin: false, error: "Not authenticated" }
  }

  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (error || !profile) {
    return { isAdmin: false, error: "Could not verify admin status" }
  }

  return { isAdmin: profile.is_admin === true }
}

// Get all challenges for admin
export async function getAdminChallenges(): Promise<{ challenges?: Challenge[]; error?: string }> {
  const { isAdmin, error: adminError } = await checkIsAdmin()
  if (!isAdmin) {
    return { error: adminError || "Unauthorized" }
  }

  const supabase = await createClient()
  const { data: challenges, error } = await supabase
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { challenges: challenges as Challenge[] }
}

// Create a new challenge
export async function createChallenge(data: {
  title: string
  description: string
  challenge_type: string
  target_value: number
  duration_days: number
  start_date: string
  end_date: string
}): Promise<{ success?: boolean; challenge?: Challenge; error?: string }> {
  const { isAdmin, error: adminError } = await checkIsAdmin()
  if (!isAdmin) {
    return { error: adminError || "Unauthorized" }
  }

  const supabase = await createClient()
  const { data: challenge, error } = await supabase
    .from("challenges")
    .insert({
      title: data.title,
      description: data.description,
      challenge_type: data.challenge_type,
      target_value: data.target_value,
      duration_days: data.duration_days,
      start_date: data.start_date,
      end_date: data.end_date,
      participants_count: 0,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/challenges")
  return { success: true, challenge: challenge as Challenge }
}

// Update an existing challenge
export async function updateChallenge(
  challengeId: string,
  data: {
    title?: string
    description?: string
    challenge_type?: string
    target_value?: number
    duration_days?: number
    start_date?: string
    end_date?: string
  }
): Promise<{ success?: boolean; error?: string }> {
  const { isAdmin, error: adminError } = await checkIsAdmin()
  if (!isAdmin) {
    return { error: adminError || "Unauthorized" }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("challenges")
    .update(data)
    .eq("id", challengeId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/challenges")
  return { success: true }
}

// Delete a challenge
export async function deleteChallenge(challengeId: string): Promise<{ success?: boolean; error?: string }> {
  const { isAdmin, error: adminError } = await checkIsAdmin()
  if (!isAdmin) {
    return { error: adminError || "Unauthorized" }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("challenges")
    .delete()
    .eq("id", challengeId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/challenges")
  return { success: true }
}

// Get participants for a challenge
export async function getChallengeParticipants(
  challengeId: string
): Promise<{ participants?: ChallengeParticipant[]; error?: string }> {
  const { isAdmin, error: adminError } = await checkIsAdmin()
  if (!isAdmin) {
    return { error: adminError || "Unauthorized" }
  }

  const supabase = await createClient()
  const { data: participants, error } = await supabase
    .from("challenge_participants")
    .select(`
      id,
      user_id,
      progress,
      completed,
      joined_at,
      profiles:user_id (
        id,
        name,
        avatar_url
      )
    `)
    .eq("challenge_id", challengeId)
    .order("joined_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { participants: participants as ChallengeParticipant[] }
}

// Get all users for admin management
export async function getAdminUsers(): Promise<{
  users?: Array<{
    id: string
    name: string | null
    email: string | null
    avatar_url: string | null
    is_admin: boolean
    created_at: string
  }>
  error?: string
}> {
  const { isAdmin, error: adminError } = await checkIsAdmin()
  if (!isAdmin) {
    return { error: adminError || "Unauthorized" }
  }

  const supabase = await createClient()
  
  // Get profiles with auth user emails
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, is_admin, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  // Get emails from auth.users (requires service role, so we'll use a workaround)
  // For now, return profiles without emails
  const users = (profiles || []).map(p => ({
    ...p,
    email: null as string | null,
    is_admin: p.is_admin || false,
  }))

  return { users }
}

// Toggle admin status for a user
export async function toggleUserAdmin(userId: string): Promise<{ success?: boolean; isAdmin?: boolean; error?: string }> {
  const { isAdmin, error: adminError } = await checkIsAdmin()
  if (!isAdmin) {
    return { error: adminError || "Unauthorized" }
  }

  const supabase = await createClient()

  // Get current admin status
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single()

  if (fetchError || !profile) {
    return { error: "User not found" }
  }

  const newAdminStatus = !profile.is_admin

  // Update admin status
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ is_admin: newAdminStatus })
    .eq("id", userId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath("/admin/users")
  return { success: true, isAdmin: newAdminStatus }
}

// Get admin dashboard stats
export async function getAdminStats(): Promise<{
  stats?: {
    totalUsers: number
    activeChallenges: number
    totalPosts: number
    totalWorkouts: number
  }
  error?: string
}> {
  const { isAdmin, error: adminError } = await checkIsAdmin()
  if (!isAdmin) {
    return { error: adminError || "Unauthorized" }
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [usersResult, challengesResult, postsResult, workoutsResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("challenges").select("id", { count: "exact", head: true }).gte("end_date", today),
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase.from("workouts").select("id", { count: "exact", head: true }).eq("completed", true),
  ])

  return {
    stats: {
      totalUsers: usersResult.count || 0,
      activeChallenges: challengesResult.count || 0,
      totalPosts: postsResult.count || 0,
      totalWorkouts: workoutsResult.count || 0,
    },
  }
}

