import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revalidateTag, revalidatePath } from "next/cache"
import type { OnboardingData } from "@/lib/types"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log("[API] Auth check:", { userId: user?.id, authError: authError?.message })
    
    if (authError || !user) {
      console.error("[API] Not authenticated")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const payload: OnboardingData = await req.json()
    console.log("[API] Onboarding complete - received payload:", payload)

    // Build the profile data to upsert
    const profileData = {
      id: user.id,
      name: payload.name,
      age: payload.age ? Number.parseInt(payload.age) : null,
      gender: payload.gender || null,
      height_feet: payload.heightFeet ? Number.parseInt(payload.heightFeet) : null,
      height_inches: payload.heightInches ? Number.parseInt(payload.heightInches) : null,
      weight: payload.weight ? Number.parseFloat(payload.weight) : null,
      goal_weight: payload.goalWeight ? Number.parseFloat(payload.goalWeight) : null,
      primary_goal: payload.primaryGoal || null,
      activity_level: payload.activityLevel || null,
      gym_access: payload.gymAccess || null,
      selected_gym: payload.selectedGym || null,
      custom_equipment: payload.customEquipment || null,
      allergies: payload.allergies || [],
      custom_restrictions: payload.customRestrictions || [],
      training_style: payload.trainingStyle || null,
      available_time_minutes: payload.availableTimeMinutes || null,
      training_days_per_week: payload.trainingDaysPerWeek || null,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    }

    console.log("[API] Upserting profile data:", profileData)

    const { data, error } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "id" })
      .select()

    console.log("[API] Upsert result - error:", error, "data:", data)

    if (error) {
      console.error("[API] Profile upsert error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate cached data
    revalidateTag("profile", "max")
    revalidatePath("/settings")
    revalidatePath("/dashboard")

    console.log("[API] Profile saved successfully")
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("[API] Exception:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to save profile"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

