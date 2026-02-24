"use server"

import { createClient, createAdminClient, getAuthUser } from "@/lib/supabase/server"
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

  return { participants: participants as unknown as ChallengeParticipant[] }
}

// Get all users for admin management
export async function getAdminUsers(): Promise<{
  users?: Array<{
    id: string
    name: string | null
    email: string | null
    avatar_url: string | null
    is_admin: boolean
    user_role: string
    created_at: string
  }>
  error?: string
}> {
  const { isAdmin, error: adminError } = await checkIsAdmin()
  if (!isAdmin) {
    return { error: adminError || "Unauthorized" }
  }

  const supabase = await createClient()

  // Get profiles
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, is_admin, user_role, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  // Get emails from auth.users using admin client with pagination
  try {
    const adminClient = createAdminClient()

    // Fetch all users with pagination (Supabase has a max of 1000 per page)
    const allAuthUsers: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data: { users: authUsers }, error: authError } = await adminClient.auth.admin.listUsers({
        page,
        perPage: 1000
      })

      if (authError) {
        console.error(`Error fetching auth users page ${page}:`, authError)
        // If we can't get emails on first page, return users without them
        if (page === 1) {
          return {
            users: (profiles || []).map(p => ({
              ...p,
              email: null as string | null,
              is_admin: p.is_admin || false,
              user_role: p.user_role || 'user',
            }))
          }
        }
        // If error on subsequent pages, break and use what we have
        break
      }

      if (authUsers && authUsers.length > 0) {
        allAuthUsers.push(...authUsers)
        // If we got fewer than 1000 users, we've reached the end
        if (authUsers.length < 1000) {
          hasMore = false
        } else {
          page++
        }
      } else {
        hasMore = false
      }
    }

    console.log(`[Admin] Fetched ${allAuthUsers.length} auth users across ${page} page(s)`)

    // Create a map of user IDs to emails
    const emailMap = new Map<string, string>()
    allAuthUsers.forEach(user => {
      if (user.email) {
        emailMap.set(user.id, user.email)
      }
    })

    // Combine profiles with emails
    const users = (profiles || []).map(p => ({
      ...p,
      email: emailMap.get(p.id) || null,
      is_admin: p.is_admin || false,
      user_role: p.user_role || 'user',
    }))

    return { users }
  } catch (err) {
    console.error("Error creating admin client:", err)
    // If admin client fails, return users without emails
    return {
      users: (profiles || []).map(p => ({
        ...p,
        email: null as string | null,
        is_admin: p.is_admin || false,
        user_role: p.user_role || 'user',
      }))
    }
  }
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

// Update user role (user, chosen, super_admin)
export async function updateUserRole(
  userId: string,
  newRole: "user" | "chosen" | "super_admin"
): Promise<{ success?: boolean; error?: string }> {
  const { isAdmin, error: adminError } = await checkIsAdmin()
  if (!isAdmin) {
    return { error: adminError || "Unauthorized" }
  }

  const supabase = await createClient()

  // Update user role and is_admin flag
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      user_role: newRole,
      is_admin: newRole === "super_admin"
    })
    .eq("id", userId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath("/admin/users")
  return { success: true }
}

// Get all app ratings for admin
export async function getAdminRatings(): Promise<{
  ratings?: Array<{
    id: string
    user_id: string
    rating: number
    feedback: string | null
    created_at: string
    user_name: string | null
    user_avatar: string | null
  }>
  stats?: {
    totalRatings: number
    averageRating: number
    ratingDistribution: Record<number, number>
  }
  error?: string
}> {
  const { isAdmin, error: adminError } = await checkIsAdmin()
  if (!isAdmin) {
    return { error: adminError || "Unauthorized" }
  }

  const supabase = await createClient()

  // Get all ratings with user profile info
  const { data: ratings, error } = await supabase
    .from("app_ratings")
    .select(`
      id,
      user_id,
      rating,
      feedback,
      created_at,
      profiles:user_id (
        name,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  // Transform the data to flatten profile info
  const transformedRatings = (ratings || []).map((r: {
    id: string
    user_id: string
    rating: number
    feedback: string | null
    created_at: string
    profiles: { name: string | null; avatar_url: string | null } | null
  }) => ({
    id: r.id,
    user_id: r.user_id,
    rating: r.rating,
    feedback: r.feedback,
    created_at: r.created_at,
    user_name: r.profiles?.name || null,
    user_avatar: r.profiles?.avatar_url || null,
  }))

  // Calculate stats
  const totalRatings = transformedRatings.length
  const averageRating = totalRatings > 0
    ? transformedRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
    : 0

  // Calculate distribution (1-5 stars)
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  transformedRatings.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingDistribution[r.rating]++
    }
  })

  return {
    ratings: transformedRatings,
    stats: {
      totalRatings,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
    },
  }
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

// Get all referral data for admin
export async function getAdminReferrals(): Promise<{
  referrals?: Array<{
    id: string
    user_id: string
    user_name: string | null
    user_email: string | null
    referral_code: string
    credits_balance: number
    total_referrals: number
    total_credits_earned: number
    share_count: number
    successful_signups: number
    is_affiliate: boolean | null
  }>
  error?: string
}> {
  const { isAdmin, error: adminError } = await checkIsAdmin()
  if (!isAdmin) {
    return { error: adminError || "Unauthorized" }
  }

  const supabase = await createClient()

  // Get all users with referral codes
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, name, referral_code, credits, is_affiliate")
    .order("credits", { ascending: false })

  if (profilesError) {
    return { error: profilesError.message }
  }

  // Get emails from auth.users using admin client with pagination
  try {
    const adminClient = createAdminClient()

    // Fetch all users with pagination
    const allAuthUsers: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data: { users: authUsers }, error: authError } = await adminClient.auth.admin.listUsers({
        page,
        perPage: 1000
      })

      if (authError) {
        console.error(`Error fetching auth users page ${page}:`, authError)
        break
      }

      if (authUsers && authUsers.length > 0) {
        allAuthUsers.push(...authUsers)
        if (authUsers.length < 1000) {
          hasMore = false
        } else {
          page++
        }
      } else {
        hasMore = false
      }
    }

    console.log(`[Admin Referrals] Fetched ${allAuthUsers.length} auth users across ${page} page(s)`)

    // Create email map
    const emailMap = new Map<string, string>()
    allAuthUsers.forEach(user => {
      if (user.email) {
        emailMap.set(user.id, user.email)
      }
    })

    // Get referral counts for each user
    const { data: referrals, error: referralsError } = await supabase
      .from("referrals")
      .select("referrer_id, credits_earned, status")

    if (referralsError) {
      console.error("Error fetching referrals:", referralsError)
    }

    // Calculate referral stats per user
    const referralStats = (profiles || []).map(profile => {
      const userReferrals = (referrals || []).filter(r => r.referrer_id === profile.id)
      const successfulReferrals = userReferrals.filter(r => r.status === "completed")
      const totalCreditsEarned = successfulReferrals.reduce((sum, r) => sum + (r.credits_earned || 0), 0)

      return {
        id: profile.id,
        user_id: profile.id,
        user_name: profile.name,
        user_email: emailMap.get(profile.id) || null,
        referral_code: profile.referral_code || "",
        credits_balance: profile.credits || 0,
        total_referrals: userReferrals.length,
        total_credits_earned: totalCreditsEarned,
        share_count: 0, // This would need tracking implementation
        successful_signups: successfulReferrals.length,
        is_affiliate: profile.is_affiliate || false,
      }
    }).filter(r => r.referral_code) // Only include users with referral codes

    return { referrals: referralStats }
  } catch (err) {
    console.error("Error creating admin client:", err)
    return { error: "Failed to fetch referral data" }
  }
}

// Get all affiliate applications for admin
export async function getAdminAffiliateApplications(): Promise<{
  applications?: Array<{
    id: string
    name: string
    email: string
    phone: string
    status: string
    created_at: string
    reviewed_at: string | null
  }>
  error?: string
}> {
  const { isAdmin, error: adminError } = await checkIsAdmin()
  if (!isAdmin) {
    return { error: adminError || "Unauthorized" }
  }

  const supabase = await createClient()

  // Get all affiliate applications
  const { data: applications, error } = await supabase
    .from("affiliate_applications")
    .select("id, name, email, phone, status, created_at, reviewed_at")
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { applications: applications || [] }
}

// Update affiliate application status
export async function updateAffiliateApplicationStatus(
  applicationId: string,
  newStatus: "pending" | "approved" | "rejected"
): Promise<{ success?: boolean; error?: string }> {
  const { isAdmin, error: adminError } = await checkIsAdmin()
  if (!isAdmin) {
    return { error: adminError || "Unauthorized" }
  }

  const supabase = await createClient()

  // Get the application to retrieve the email
  const { data: application, error: fetchError } = await supabase
    .from("affiliate_applications")
    .select("email")
    .eq("id", applicationId)
    .single()

  if (fetchError || !application) {
    return { error: "Application not found" }
  }

  // Update the application status
  const { error } = await supabase
    .from("affiliate_applications")
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", applicationId)

  if (error) {
    return { error: error.message }
  }

  // If approved, set the user as an affiliate in their profile
  if (newStatus === "approved") {
    // Find the user by email in auth.users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      return { error: "Failed to find user account" }
    }

    const targetUser = users?.find(u => u.email === application.email)

    if (targetUser) {
      // Update the profile to set affiliate status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          is_affiliate: true,
          affiliate_approved_at: new Date().toISOString()
        })
        .eq("id", targetUser.id)

      if (profileError) {
        return { error: "Failed to update affiliate status: " + profileError.message }
      }
    }
  }

  revalidatePath("/admin/referrals")
  return { success: true }
}

