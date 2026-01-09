"use server"

import { createClient, getAuthUser, createServiceClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import { retryWithBackoff, isNetworkError } from "@/lib/utils/retry"
import type { Profile, ProfileResult } from "@/lib/types"

// Cached profile fetch - revalidates every 60 seconds or on-demand
const getCachedProfile = unstable_cache(
  async (userId: string) => {
    const supabase = createServiceClient()
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (error) throw error
    return profile as Profile | null
  },
  ["profile"],
  { revalidate: 60, tags: ["profile"] }
)

export async function getProfile(): Promise<ProfileResult> {
  const { user, error: authError } = await getAuthUser()

  if (authError || !user) {
    console.log("[getProfile] Not authenticated")
    return { profile: null, error: "Not authenticated" }
  }

  try {
    // Use cached profile for better performance
    const profile = await getCachedProfile(user.id)
    return { profile: profile || null }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load profile"
    
    if (isNetworkError(error)) {
      return { profile: null, error: "Network error. Please check your connection and try again." }
    }

    return { profile: null, error: errorMessage }
  }
}

export async function updateProfile(profileData: {
  name?: string
  avatar_url?: string
  age?: string
  gender?: string
  heightFeet?: string
  heightInches?: string
  weight?: string
  goalWeight?: string
  primaryGoal?: string
  activityLevel?: number | string
  gymAccess?: string
  selectedGym?: string
  customEquipment?: string
  allergies?: string[]
  customRestrictions?: string[]
  programType?: string
  customProgramType?: string
  availableTimeMinutes?: number
  trainingDaysPerWeek?: number
  timezone?: string
  onboardingCompleted?: boolean
}): Promise<{ success?: boolean; error?: string }> {
  const { user, error: authError } = await getAuthUser()

  if (authError || !user) {
    return { error: "Not authenticated" }
  }

  const supabase = await createClient()

  // Validation
  const validationErrors: string[] = []

  if (profileData.gender && !["male", "female", "other", "prefer_not_to_say"].includes(profileData.gender)) {
    validationErrors.push("Invalid gender value")
  }

  if (profileData.gymAccess && !["yes", "no", "sometimes", "home", "hotel", "commercial", "gym", "custom", "none"].includes(profileData.gymAccess)) {
    validationErrors.push("Invalid gym access value")
  }

  if (profileData.primaryGoal && !["lose-weight", "tone-up", "build-muscle", "lifestyle"].includes(profileData.primaryGoal)) {
    validationErrors.push("Invalid primary goal value")
  }

  if (validationErrors.length > 0) {
    return { error: `Validation failed: ${validationErrors.join(", ")}` }
  }

  try {
    const dataToUpsert = {
      id: user.id,
      name: profileData.name,
      avatar_url: profileData.avatar_url,
      age: profileData.age ? Number.parseInt(profileData.age) : null,
      gender: profileData.gender,
      height_feet: profileData.heightFeet ? Number.parseInt(profileData.heightFeet) : null,
      height_inches: profileData.heightInches ? Number.parseInt(profileData.heightInches) : null,
      weight: profileData.weight ? Number.parseFloat(profileData.weight) : null,
      goal_weight: profileData.goalWeight ? Number.parseFloat(profileData.goalWeight) : null,
      primary_goal: profileData.primaryGoal,
      activity_level: profileData.activityLevel,
      gym_access: profileData.gymAccess,
      selected_gym: profileData.selectedGym,
      custom_equipment: profileData.customEquipment,
      allergies: profileData.allergies,
      custom_restrictions: profileData.customRestrictions,
      // Store program type - if "other", use the custom value
      training_style: profileData.programType === "other" && profileData.customProgramType
        ? `other:${profileData.customProgramType}`
        : profileData.programType,
      available_time_minutes: profileData.availableTimeMinutes,
      training_days_per_week: profileData.trainingDaysPerWeek,
      timezone: profileData.timezone,
      onboarding_completed: profileData.onboardingCompleted,
      updated_at: new Date().toISOString(),
    }
    
    console.log("[updateProfile] User ID:", user.id)
    console.log("[updateProfile] Data to upsert:", dataToUpsert)

    await retryWithBackoff(
      async () => {
        const { error, data } = await supabase.from("profiles").upsert(
          dataToUpsert,
          { onConflict: "id" }
        ).select()

        console.log("[updateProfile] Upsert result - error:", error, "data:", data)

        if (error) throw error
      },
      { maxAttempts: 3 }
    )

    revalidateTag("profile")
    revalidatePath("/settings")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update profile"

    if (errorMessage.includes("check constraint")) {
      return { error: "Some profile data doesn't meet requirements. Please check all fields and try again." }
    }

    if (isNetworkError(error)) {
      return { error: "Network error. Please check your connection and try again." }
    }

    return { error: errorMessage }
  }
}

export async function checkOnboardingStatus(): Promise<{ onboardingCompleted?: boolean; error?: string }> {
  const { user, error: authError } = await getAuthUser()

  if (authError || !user) {
    return { error: "Not authenticated" }
  }

  try {
    // Use cached profile to check onboarding status
    const profile = await getCachedProfile(user.id)
    return { onboardingCompleted: profile?.onboarding_completed || false }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to check onboarding status"
    return { error: errorMessage }
  }
}

export async function createProfile(userId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  // Generate unique referral code
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let referralCode = ""
  for (let i = 0; i < 8; i++) {
    referralCode += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  try {
    await retryWithBackoff(
      async () => {
        const { error } = await supabase.from("profiles").insert({
          id: userId,
          name: "User",
          referral_code: referralCode,
          credits: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (error) throw error
      },
      { maxAttempts: 3 }
    )

    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create profile"

    if (isNetworkError(error)) {
      return { error: "Network error. Please check your connection and try again." }
    }

    return { error: errorMessage }
  }
}
