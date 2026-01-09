"use server"

import { revalidatePath } from "next/cache"
import { createClient, getAuthUser } from "@/lib/supabase/server"
import type { Macros, Meal, Supplement } from "@/lib/types"
import { getMealImage } from "@/lib/meal-images"

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const

type MealType = (typeof MEAL_TYPES)[number]

interface DailyMeal {
  logId: string
  mealId: string
  type: MealType
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  image: string | null
  isEaten: boolean
  eatenAt: string | null
}

const DEFAULT_MEALS: Array<Omit<Meal, "id" | "user_id" | "created_at"> & { description?: string; recipe?: string | null }> = [
  {
    meal_type: "breakfast",
    name: "Protein Oatmeal Bowl",
    description: "Rolled oats, whey protein, blueberries, almond butter",
    calories: 420,
    protein: 32,
    carbs: 48,
    fat: 14,
    image_url: null,
    recipe: null,
  },
  {
    meal_type: "breakfast",
    name: "Greek Yogurt Parfait",
    description: "Greek yogurt with berries and granola",
    calories: 350,
    protein: 28,
    carbs: 42,
    fat: 9,
    image_url: null,
    recipe: null,
  },
  {
    meal_type: "lunch",
    name: "Grilled Chicken Salad",
    description: "Mixed greens, grilled chicken, quinoa, avocado",
    calories: 550,
    protein: 45,
    carbs: 38,
    fat: 22,
    image_url: null,
    recipe: null,
  },
  {
    meal_type: "lunch",
    name: "Turkey Quinoa Bowl",
    description: "Lean turkey, quinoa, roasted veggies, tahini",
    calories: 520,
    protein: 40,
    carbs: 50,
    fat: 18,
    image_url: null,
    recipe: null,
  },
  {
    meal_type: "dinner",
    name: "Salmon with Vegetables",
    description: "Grilled salmon, asparagus, sweet potato mash",
    calories: 620,
    protein: 46,
    carbs: 45,
    fat: 28,
    image_url: null,
    recipe: null,
  },
  {
    meal_type: "dinner",
    name: "Lean Beef Stir-Fry",
    description: "Sirloin, bell peppers, broccoli, jasmine rice",
    calories: 600,
    protein: 42,
    carbs: 52,
    fat: 20,
    image_url: null,
    recipe: null,
  },
  {
    meal_type: "snack",
    name: "Greek Yogurt with Berries",
    description: "Non-fat yogurt, mixed berries, chia seeds",
    calories: 180,
    protein: 18,
    carbs: 22,
    fat: 3,
    image_url: null,
    recipe: null,
  },
  {
    meal_type: "snack",
    name: "Protein Shake",
    description: "Whey protein, almond milk, banana, peanut butter",
    calories: 250,
    protein: 32,
    carbs: 20,
    fat: 8,
    image_url: null,
    recipe: null,
  },
]

type ProfileInfo = {
  weight?: number | null
  goal_weight?: number | null
  calorie_goal?: number | null
  primary_goal?: string | null
  activity_level?: number | null
  age?: number | null
  gender?: string | null
  height_feet?: number | null
  height_inches?: number | null
  allergies?: string[] | null
  custom_restrictions?: string[] | null
}

interface GeneratedMeal {
  type: MealType
  name: string
  description: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
  image?: string | null
  recipe?: string | null
  ingredients?: string[] | null
}

async function fetchProfileInfo(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("profiles")
    .select("weight, goal_weight, calorie_goal, primary_goal, activity_level, age, gender, height_feet, height_inches, allergies, custom_restrictions")
    .eq("id", userId)
    .maybeSingle()

  return (data as ProfileInfo) ?? null
}

function normalizeMealType(value?: string): MealType | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  switch (normalized) {
    case "breakfast":
      return "Breakfast"
    case "lunch":
      return "Lunch"
    case "dinner":
      return "Dinner"
    case "snack":
      return "Snack"
    default:
      return null
  }
}

function buildMacroTargets(profile?: ProfileInfo): Macros {
  // Check for user-defined calorie goal override first
  if (profile?.calorie_goal && profile.calorie_goal > 0) {
    const calorieTarget = profile.calorie_goal
    // Derive macros from custom calorie target using balanced ratios
    const proteinTarget = Math.round((calorieTarget * 0.3) / 4) // 30% from protein (4 cal/g)
    const carbsTarget = Math.round((calorieTarget * 0.4) / 4)   // 40% from carbs (4 cal/g)
    const fatTarget = Math.round((calorieTarget * 0.3) / 9)     // 30% from fat (9 cal/g)

    return {
      calories: { current: 0, target: calorieTarget },
      protein: { current: 0, target: proteinTarget, unit: "g" },
      carbs: { current: 0, target: carbsTarget, unit: "g" },
      fat: { current: 0, target: fatTarget, unit: "g" },
    }
  }

  // Calculate based on goal weight and primary goal
  const safeBaseWeight = Number(profile?.weight ?? 170) || 170
  const fallbackGoalWeight = profile?.goal_weight ?? profile?.weight ?? safeBaseWeight
  const goalWeight = Number(fallbackGoalWeight) || safeBaseWeight
  const normalizedGoal = (profile?.primary_goal ?? "").toLowerCase().replace(/_/g, "-")
  const losingWeight = normalizedGoal === "lose-weight"
  const calorieMultiplier = losingWeight ? 11 : 13
  const calorieTarget = Math.round(goalWeight * calorieMultiplier) || 2200
  const proteinTarget = Math.round(goalWeight * 0.9) || 150
  const carbsTarget = Math.round((calorieTarget * 0.4) / 4) || 220
  const fatTarget = Math.round((calorieTarget * 0.25) / 9) || 70

  return {
    calories: { current: 0, target: calorieTarget },
    protein: { current: 0, target: proteinTarget, unit: "g" },
    carbs: { current: 0, target: carbsTarget, unit: "g" },
    fat: { current: 0, target: fatTarget, unit: "g" },
  }
}

function selectFallbackMeals(missingTypes: MealType[]): GeneratedMeal[] {
  return missingTypes.map((type) => {
    const normalizedType = type.toLowerCase() as "breakfast" | "lunch" | "dinner" | "snack"
    const pool = DEFAULT_MEALS.filter((meal) => meal.meal_type === normalizedType)
    const candidate =
      pool[Math.floor(Math.random() * pool.length)] ?? DEFAULT_MEALS.find((meal) => meal.meal_type === normalizedType) ?? DEFAULT_MEALS[0]

    return {
      type,
      name: candidate.name,
      description: candidate.description ?? null,
      calories: candidate.calories ?? 0,
      protein: candidate.protein ?? 0,
      carbs: candidate.carbs ?? 0,
      fat: candidate.fat ?? 0,
      image: getMealImage(candidate.name),
    }
  })
}

function convertHeightToCm(feet?: number | null, inches?: number | null): number {
  const f = feet ?? 5
  const i = inches ?? 8
  return Math.round((f * 12 + i) * 2.54) // Convert inches to cm
}

function convertWeightToKg(lbs?: number | null): number {
  return Math.round((lbs ?? 170) * 0.453592) // Convert lbs to kg
}

function mapActivityLevel(level?: number | null): string {
  switch (level) {
    case 1:
      return "sedentary"
    case 2:
      return "lightly_active"
    case 3:
      return "moderately_active"
    case 4:
      return "very_active"
    case 5:
      return "extra_active"
    default:
      return "moderately_active"
  }
}

function mapFitnessGoal(goal?: string | null): string {
  switch (goal?.toLowerCase().replace(/-/g, "_")) {
    case "lose_weight":
    case "lose-weight":
      return "lose_weight"
    case "build_muscle":
    case "build-muscle":
      return "build_muscle"
    case "tone_up":
    case "tone-up":
      return "tone_up"
    default:
      return "maintain"
  }
}

async function generateAIMeals(params: {
  mealTypes: MealType[]
  macros: Macros
  profile?: ProfileInfo | null
  supabase: Awaited<ReturnType<typeof createClient>>
  date?: string
}): Promise<GeneratedMeal[]> {
  if (params.mealTypes.length === 0) {
    return []
  }

  try {
    // Get auth session for the edge function call
    const { data: { session } } = await params.supabase.auth.getSession()
    if (!session?.access_token) {
      console.error("[Nutrition] No auth session for edge function call")
      return []
    }

    const profile = params.profile
    const heightCm = convertHeightToCm(profile?.height_feet, profile?.height_inches)
    const weightKg = convertWeightToKg(profile?.weight)
    const age = profile?.age ?? 30
    const gender = profile?.gender ?? "male"
    const activityLevel = mapActivityLevel(profile?.activity_level)
    const fitnessGoal = mapFitnessGoal(profile?.primary_goal)

    const requestBody = {
      type: "meal-plan",
      profile: {
        weight: weightKg,
        height: heightCm,
        age,
        gender,
        activityLevel,
        fitnessGoal,
        dietaryPreferences: (profile?.custom_restrictions || []).filter(Boolean),
        restrictions: (profile?.allergies || []).filter(Boolean),
      },
      mealTypes: params.mealTypes,
      date: params.date || new Date().toISOString().split("T")[0],
    }

    // Call the Supabase edge function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      console.error("[Nutrition] NEXT_PUBLIC_SUPABASE_URL not configured")
      return []
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-planner`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Nutrition] Edge function error:", response.status, errorText)
      return []
    }

    const result = await response.json()

    if (!result.success || !Array.isArray(result.data)) {
      console.error("[Nutrition] Unexpected edge function response:", result)
      return []
    }

    // Map the response to our GeneratedMeal format
    const meals = result.data as Array<{
      type: string
      name: string
      description?: string
      calories: number
      protein: number
      carbs: number
      fat: number
      ingredients?: string[]
      instructions?: string[]
    }>

    const normalized = meals
      .map((meal) => {
        const type = normalizeMealType(meal.type)
        if (!type || !meal.name) return null

        return {
          type,
          name: meal.name.trim(),
          description: meal.description ?? null,
          calories: Number(meal.calories ?? 0),
          protein: Number(meal.protein ?? 0),
          carbs: Number(meal.carbs ?? 0),
          fat: Number(meal.fat ?? 0),
          image: getMealImage(meal.name),
          recipe: meal.instructions?.join("\n") ?? null,
          ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : null,
        }
      })
      .filter(Boolean) as GeneratedMeal[]

    console.log("[Nutrition] AI generated", normalized.length, "meals via edge function")
    return normalized.filter((meal) => params.mealTypes.includes(meal.type))
  } catch (error) {
    console.error("[Nutrition] Failed to generate AI meals via edge function:", error)
    return []
  }
}

async function persistGeneratedMeals(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  meals: GeneratedMeal[],
  dayStart: Date,
) {
  if (meals.length === 0) return

  const rows = meals.map((meal) => ({
    user_id: userId,
    meal_type: meal.type,
    name: meal.name,
    description: (meal as any).description ?? null,
    calories: Math.round(meal.calories || 0),
    protein: Number(meal.protein ?? 0),
    carbs: Number(meal.carbs ?? 0),
    fat: Number(meal.fat ?? 0),
    image_url: meal.image || getMealImage(meal.name),
    recipe: meal.recipe ?? null,
    ingredients: meal.ingredients ?? null,
  }))

  const { data: insertedMeals, error } = await supabase
    .from("meals")
    .insert(rows)
    .select("id, meal_type")

  if (error || !insertedMeals || insertedMeals.length === 0) {
    console.error("[Nutrition] Failed to persist generated meals:", error)
    return
  }

  const logRows = insertedMeals.map((inserted) => ({
    user_id: userId,
    meal_id: inserted.id,
    meal_type: inserted.meal_type,
    consumed_at: dayStart.toISOString(),
    is_eaten: false,
  }))

  const { error: logError } = await supabase.from("meal_logs").insert(logRows)
  if (logError) {
    console.error("[Nutrition] Failed to persist meal logs:", logError)
  }
}

async function ensureMealCatalog(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { count } = await supabase
    .from("meals")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)

  if (!count || count === 0) {
    const rows = DEFAULT_MEALS.map((meal) => ({
      ...meal,
      user_id: userId,
      image_url: meal.image_url || getMealImage(meal.name),
    }))
    await supabase.from("meals").insert(rows)
  }
}

async function ensureDailyMealLogs(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  dayStart: Date,
  dayEnd: Date,
  profileInfo?: ProfileInfo | null,
) {
  const { data: logs } = await supabase
    .from("meal_logs")
    .select("id, meal_type")
    .eq("user_id", userId)
    .gte("consumed_at", dayStart.toISOString())
    .lte("consumed_at", dayEnd.toISOString())

  const existingTypes = new Set((logs || []).map((log) => log.meal_type as MealType))

  if (existingTypes.size === MEAL_TYPES.length) {
    return
  }

  const missingTypes = MEAL_TYPES.filter((type) => !existingTypes.has(type))
  if (missingTypes.length === 0) {
    return
  }

  const profile = profileInfo ?? (await fetchProfileInfo(userId, supabase))
  const macros = buildMacroTargets(profile)
  const dateStr = dayStart.toISOString().split("T")[0]
  const aiMeals = await generateAIMeals({ mealTypes: missingTypes, macros, profile, supabase, date: dateStr })
  const mealsToPersist = aiMeals.length > 0 ? aiMeals : selectFallbackMeals(missingTypes)

  await persistGeneratedMeals(userId, supabase, mealsToPersist, dayStart)
}

async function fetchMealsForDate(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  dayStart: Date,
  dayEnd: Date,
) {
  const { data, error } = await supabase
    .from("meal_logs")
    .select(
      `
        id,
        meal_type,
        consumed_at,
        is_eaten,
        eaten_at,
        meals:meal_id (
          id,
          name,
          meal_type,
          calories,
          protein,
          carbs,
          fat,
          image_url
        )
      `,
    )
    .eq("user_id", userId)
    .gte("consumed_at", dayStart.toISOString())
    .lte("consumed_at", dayEnd.toISOString())

  if (error || !data) {
    console.error("[Nutrition] Failed to load meal logs:", error)
    return []
  }

  const sortedLogs = (data || [])
    .filter((log) => log.meals)
    .sort((a, b) => new Date(b.consumed_at).getTime() - new Date(a.consumed_at).getTime())

  const mealMap = new Map<MealType, DailyMeal>()

  for (const log of sortedLogs) {
    if (!log.meals) continue
    const meal = Array.isArray(log.meals) ? log.meals[0] : log.meals
    if (!meal) continue
    const type = (log.meal_type as MealType) || (meal.meal_type as MealType)
    if (!type || mealMap.has(type)) continue

    mealMap.set(type, {
      logId: log.id,
      mealId: meal.id,
      type,
      name: meal.name,
      calories: Number(meal.calories || 0),
      protein: Number(meal.protein || 0),
      carbs: Number(meal.carbs || 0),
      fat: Number(meal.fat || 0),
      image: meal.image_url || getMealImage(meal.name),
      isEaten: Boolean(log.is_eaten),
      eatenAt: log.eaten_at || null,
    })
  }

  return Array.from(mealMap.values())
}

async function getMealPlanForDate(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  targetDate: Date,
  profileInfo?: ProfileInfo | null,
) {
  const dayStart = new Date(targetDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setHours(23, 59, 59, 999)

  await ensureDailyMealLogs(userId, supabase, dayStart, dayEnd, profileInfo)
  return fetchMealsForDate(userId, supabase, dayStart, dayEnd)
}

async function safeFetchMealsForDate(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  targetDate: Date,
  profile?: ProfileInfo | null,
) {
  try {
    return await getMealPlanForDate(userId, supabase, targetDate, profile)
  } catch (error) {
    console.error("[Nutrition] Unable to build plan for date:", targetDate, error)
    return []
  }
}

export async function getDailyMealPlan() {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return {
      meals: [] as DailyMeal[],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      tomorrowMeals: [] as DailyMeal[],
    }
  }

  const supabase = await createClient()
  await ensureMealCatalog(user.id, supabase)

  const profile = await fetchProfileInfo(user.id, supabase)

  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setHours(23, 59, 59, 999)

  const todayMeals = await safeFetchMealsForDate(user.id, supabase, dayStart, profile)

  const totals = todayMeals.reduce(
    (acc, meal) => {
      if (meal.isEaten) {
        acc.calories += meal.calories
        acc.protein += meal.protein
        acc.carbs += meal.carbs
        acc.fat += meal.fat
      }
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  const tomorrowDate = new Date(dayStart)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowMeals = await safeFetchMealsForDate(user.id, supabase, tomorrowDate, profile)

  return { meals: todayMeals, totals, tomorrowMeals }
}

export async function swapMeal(logId: string, mealId: string) {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabase = await createClient()
  const { data: meal } = await supabase
    .from("meals")
    .select("meal_type")
    .eq("id", mealId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!meal) {
    return { success: false, error: "Meal not found" }
  }

  const { error: updateError } = await supabase
    .from("meal_logs")
    .update({ meal_id: mealId, meal_type: meal.meal_type })
    .eq("id", logId)
    .eq("user_id", user.id)

  if (updateError) {
    console.error("[Nutrition] Failed to swap meal:", updateError)
    return { success: false, error: "Unable to swap meal" }
  }

  revalidatePath("/nutrition")
  return { success: true }
}

export async function toggleMealEaten(logId: string, isEaten: boolean) {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabase = await createClient()
  const { error: updateError } = await supabase
    .from("meal_logs")
    .update({
      is_eaten: isEaten,
      eaten_at: isEaten ? new Date().toISOString() : null,
    })
    .eq("id", logId)
    .eq("user_id", user.id)

  if (updateError) {
    console.error("[Nutrition] Failed to toggle meal eaten:", updateError)
    return { success: false, error: "Unable to update meal status" }
  }

  revalidatePath("/nutrition")
  return { success: true }
}

export async function getMealAlternatives(mealType: MealType, excludeMealId?: string) {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return []
  }

  const supabase = await createClient()
  const query = supabase
    .from("meals")
    .select("*")
    .eq("user_id", user.id)
    .eq("meal_type", mealType)
    .order("created_at", { ascending: false })

  if (excludeMealId) {
    query.neq("id", excludeMealId)
  }

  const { data } = await query.limit(5)
  if (!data) return []

  return data.map((meal) => ({
    id: meal.id,
    name: meal.name,
    calories: meal.calories || 0,
    description: (meal as any).description || null,
  }))
}

export async function getNutritionTargets(): Promise<{ macros: Macros }> {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return {
      macros: {
        calories: { current: 0, target: 2200 },
        protein: { current: 0, target: 160, unit: "g" },
        carbs: { current: 0, target: 220, unit: "g" },
        fat: { current: 0, target: 70, unit: "g" },
      },
    }
  }

  const supabase = await createClient()
  const profile = await fetchProfileInfo(user.id, supabase)
  return { macros: buildMacroTargets(profile) }
}

export async function getRecommendedSupplements(limit?: number): Promise<Supplement[]> {
  const supabase = await createClient()
  let query = supabase.from("supplements").select("*").order("featured", { ascending: false })

  if (limit && limit > 0) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error("[Nutrition] Failed to load supplements:", error)
    return []
  }

  return data || []
}

export async function regenerateMealPlan() {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabase = await createClient()
  const profile = await fetchProfileInfo(user.id, supabase)
  const macros = buildMacroTargets(profile)

  // Set up date ranges for today and tomorrow
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  const tomorrowEnd = new Date(tomorrowStart)
  tomorrowEnd.setHours(23, 59, 59, 999)

  // Delete existing meal logs for today AND tomorrow
  const { error: deleteError } = await supabase
    .from("meal_logs")
    .delete()
    .eq("user_id", user.id)
    .gte("consumed_at", todayStart.toISOString())
    .lte("consumed_at", tomorrowEnd.toISOString())

  if (deleteError) {
    console.error("[Nutrition] Failed to delete meal logs:", deleteError)
    return { success: false, error: "Unable to clear existing plan" }
  }

  // Generate fresh AI meals for today
  const todayDateStr = todayStart.toISOString().split("T")[0]
  const todayAiMeals = await generateAIMeals({ mealTypes: [...MEAL_TYPES], macros, profile, supabase, date: todayDateStr })
  const todayMealsToPersist = todayAiMeals.length > 0 ? todayAiMeals : selectFallbackMeals([...MEAL_TYPES])
  await persistGeneratedMeals(user.id, supabase, todayMealsToPersist, todayStart)

  // Generate fresh AI meals for tomorrow
  const tomorrowDateStr = tomorrowStart.toISOString().split("T")[0]
  const tomorrowAiMeals = await generateAIMeals({ mealTypes: [...MEAL_TYPES], macros, profile, supabase, date: tomorrowDateStr })
  const tomorrowMealsToPersist = tomorrowAiMeals.length > 0 ? tomorrowAiMeals : selectFallbackMeals([...MEAL_TYPES])
  await persistGeneratedMeals(user.id, supabase, tomorrowMealsToPersist, tomorrowStart)

  revalidatePath("/nutrition")
  return { success: true }
}

export type { DailyMeal, MealType }

