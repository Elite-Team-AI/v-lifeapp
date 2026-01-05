"use server"

import { revalidatePath } from "next/cache"
import { createClient, getAuthUser } from "@/lib/supabase/server"

interface GroceryItem {
  id: string
  item_name: string
  category: string | null
  quantity: string | null
  checked: boolean
  source: "manual" | "meal" | "forecast"
  meal_id: string | null
}

interface MealWithIngredients {
  id: string
  name: string
  ingredients: string[] | null
  meal_type: string
  consumed_at?: string
}

// Profile info needed for AI grocery generation
interface ProfileInfo {
  weight?: number | null
  height_feet?: number | null
  height_inches?: number | null
  age?: number | null
  gender?: string | null
  activity_level?: number | null
  primary_goal?: string | null
  allergies?: string[] | null
  custom_restrictions?: string[] | null
}

function convertHeightToCm(feet?: number | null, inches?: number | null): number {
  const f = feet ?? 5
  const i = inches ?? 8
  return Math.round((f * 12 + i) * 2.54)
}

function convertWeightToKg(lbs?: number | null): number {
  return Math.round((lbs ?? 170) * 0.453592)
}

function mapActivityLevel(level?: number | null): string {
  switch (level) {
    case 1: return "sedentary"
    case 2: return "lightly_active"
    case 3: return "moderately_active"
    case 4: return "very_active"
    case 5: return "extra_active"
    default: return "moderately_active"
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
    default:
      return "maintain"
  }
}

// Categorize an ingredient based on common food types
function categorizeIngredient(ingredient: string): string {
  const lower = ingredient.toLowerCase()
  
  // Proteins
  if (/chicken|beef|pork|fish|salmon|tuna|shrimp|turkey|eggs?|tofu|tempeh|protein powder/i.test(lower)) {
    return "Proteins"
  }
  // Dairy
  if (/milk|cheese|yogurt|cream|butter/i.test(lower)) {
    return "Dairy"
  }
  // Carbohydrates
  if (/rice|pasta|bread|oats|quinoa|potato|sweet potato|noodle/i.test(lower)) {
    return "Carbohydrates"
  }
  // Vegetables
  if (/broccoli|spinach|kale|carrot|pepper|onion|garlic|tomato|cucumber|lettuce|cabbage|zucchini|asparagus|celery|mushroom/i.test(lower)) {
    return "Vegetables"
  }
  // Fruits
  if (/apple|banana|orange|berry|berries|strawberry|blueberry|mango|grape|lemon|lime|avocado/i.test(lower)) {
    return "Fruits"
  }
  // Healthy Fats
  if (/olive oil|coconut oil|almond|walnut|cashew|peanut|seed|chia|flax|avocado oil/i.test(lower)) {
    return "Healthy Fats"
  }
  // Spices & Seasonings
  if (/salt|pepper|cumin|paprika|oregano|basil|thyme|cinnamon|turmeric|ginger|sauce|vinegar|honey|maple/i.test(lower)) {
    return "Spices & Seasonings"
  }
  // Default to Pantry Items
  return "Pantry Items"
}

// Extract quantity from ingredient string (e.g., "2 cups rice" -> "2 cups")
function extractQuantity(ingredient: string): string {
  const match = ingredient.match(/^(\d+\.?\d*\s*(?:cup|cups|tbsp|tsp|oz|lb|lbs|g|kg|ml|l|piece|pieces|slice|slices|whole|large|medium|small)?s?)/i)
  return match ? match[1].trim() : "as needed"
}

// Extract item name from ingredient string
function extractItemName(ingredient: string): string {
  // Remove quantity prefix
  return ingredient
    .replace(/^\d+\.?\d*\s*(?:cup|cups|tbsp|tsp|oz|lb|lbs|g|kg|ml|l|piece|pieces|slice|slices|whole|large|medium|small)?s?\s*/i, "")
    .trim()
}

export async function getGroceryItems(): Promise<GroceryItem[]> {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return []
  }

  const supabase = await createClient()
  
  const { data } = await supabase
    .from("grocery_lists")
    .select("*")
    .eq("user_id", user.id)
    .order("category", { ascending: true })
    .order("created_at", { ascending: true })

  return (data || []) as GroceryItem[]
}

export async function toggleGroceryItem(itemId: string, checked: boolean) {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabase = await createClient()
  const { error: updateError } = await supabase
    .from("grocery_lists")
    .update({ checked })
    .eq("id", itemId)
    .eq("user_id", user.id)

  if (updateError) {
    console.error("[Grocery] Failed to toggle item:", updateError)
    return { success: false, error: "Unable to update item" }
  }

  revalidatePath("/grocery-list")
  return { success: true }
}

export async function addGroceryItem(name: string, category: string) {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return { success: false, error: "Not authenticated" }
  }

  if (!name.trim()) {
    return { success: false, error: "Item name is required" }
  }

  const supabase = await createClient()
  const { error: insertError } = await supabase.from("grocery_lists").insert({
    user_id: user.id,
    item_name: name.trim(),
    category,
    checked: false,
    source: "manual",
  })

  if (insertError) {
    console.error("[Grocery] Failed to add item:", insertError)
    return { success: false, error: "Unable to add grocery item" }
  }

  revalidatePath("/grocery-list")
  return { success: true }
}

export async function removeGroceryItem(itemId: string) {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabase = await createClient()
  const { error: deleteError } = await supabase
    .from("grocery_lists")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id)

  if (deleteError) {
    console.error("[Grocery] Failed to remove item:", deleteError)
    return { success: false, error: "Unable to remove grocery item" }
  }

  revalidatePath("/grocery-list")
  return { success: true }
}

export async function clearCompletedItems() {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabase = await createClient()
  const { error: deleteError } = await supabase
    .from("grocery_lists")
    .delete()
    .eq("user_id", user.id)
    .eq("checked", true)

  if (deleteError) {
    console.error("[Grocery] Failed to clear items:", deleteError)
    return { success: false, error: "Unable to clear completed items" }
  }

  revalidatePath("/grocery-list")
  return { success: true }
}

// Fetch meals with ingredients for the next N days
async function fetchMealsWithIngredients(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  startDate: Date,
  endDate: Date
): Promise<MealWithIngredients[]> {
  const { data: mealLogs } = await supabase
    .from("meal_logs")
    .select(`
      id,
      consumed_at,
      meals:meal_id (
        id,
        name,
        meal_type,
        ingredients
      )
    `)
    .eq("user_id", userId)
    .gte("consumed_at", startDate.toISOString())
    .lte("consumed_at", endDate.toISOString())

  if (!mealLogs) return []

  return mealLogs
    .filter((log) => log.meals && !Array.isArray(log.meals))
    .map((log) => {
      const meal = Array.isArray(log.meals) ? log.meals[0] : log.meals
      return {
        id: meal.id,
        name: meal.name,
        meal_type: meal.meal_type,
        ingredients: meal.ingredients,
        consumed_at: log.consumed_at,
      }
    })
}

// Sync grocery list with meals - pulls from today/tomorrow and uses AI for 7-day forecast
export async function syncGroceryListWithMeals(dateRange: "today" | "week" = "week") {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabase = await createClient()

  // Get profile for AI generation
  const { data: profileData } = await supabase
    .from("profiles")
    .select("weight, height_feet, height_inches, age, gender, activity_level, primary_goal, allergies, custom_restrictions")
    .eq("id", user.id)
    .maybeSingle()

  const profile = profileData as ProfileInfo | null

  // Set date range based on parameter
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(today)
  
  if (dateRange === "today") {
    // Single day: just today
    endDate.setHours(23, 59, 59, 999)
  } else {
    // Week: today + 7 days
    endDate.setDate(endDate.getDate() + 7)
    endDate.setHours(23, 59, 59, 999)
  }

  // Fetch meals with ingredients for the date range
  const meals = await fetchMealsWithIngredients(user.id, supabase, today, endDate)
  console.log("[Grocery] Found", meals.length, "meals with ingredients for", dateRange)

  // Clear ALL existing items - a fresh sync replaces everything
  // Users can add manual items back after syncing if needed
  await supabase
    .from("grocery_lists")
    .delete()
    .eq("user_id", user.id)

  // Extract ingredients from current meals
  const mealIngredients = meals
    .filter((meal) => meal.ingredients && meal.ingredients.length > 0)
    .map((meal) => ({
      name: meal.name,
      ingredients: meal.ingredients!,
      date: meal.consumed_at?.split("T")[0] || "upcoming",
    }))

  // If we have meals with ingredients, use the AI to generate a smart grocery list
  if (mealIngredients.length > 0 || profile) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error("[Grocery] No auth session for edge function")
        return addBasicIngredientsFromMeals(user.id, supabase, meals)
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        console.error("[Grocery] NEXT_PUBLIC_SUPABASE_URL not configured")
        return addBasicIngredientsFromMeals(user.id, supabase, meals)
      }

      const requestBody = {
        type: "grocery-list",
        profile: {
          weight: convertWeightToKg(profile?.weight),
          height: convertHeightToCm(profile?.height_feet, profile?.height_inches),
          age: profile?.age ?? 30,
          gender: profile?.gender ?? "male",
          activityLevel: mapActivityLevel(profile?.activity_level),
          fitnessGoal: mapFitnessGoal(profile?.primary_goal),
          dietaryPreferences: (profile?.custom_restrictions || []).filter(Boolean),
          restrictions: (profile?.allergies || []).filter(Boolean),
        },
        currentMeals: mealIngredients,
        daysToForecast: dateRange === "today" ? 1 : 7,
      }

      console.log("[Grocery] Calling AI for smart grocery list with", mealIngredients.length, "meals...")
      
      // Add timeout to prevent hanging forever
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
      
      let response: Response
      try {
        response = await fetch(`${supabaseUrl}/functions/v1/ai-planner`, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })
      } finally {
        clearTimeout(timeoutId)
      }

      if (response.ok) {
        const result = await response.json()
        if (result.success && Array.isArray(result.data)) {
          // Insert AI-generated grocery items
          const aiItems = result.data.map((item: any) => ({
            user_id: user.id,
            item_name: item.name,
            category: item.category,
            quantity: item.quantity,
            checked: false,
            source: item.forMeals?.includes("Weekly staple") ? "forecast" : "meal",
          }))

          if (aiItems.length > 0) {
            await supabase.from("grocery_lists").insert(aiItems)
            console.log("[Grocery] Added", aiItems.length, "AI-generated items")
          }

          revalidatePath("/grocery-list")
          return { success: true, itemCount: aiItems.length }
        } else {
          console.error("[Grocery] AI response not successful:", result)
        }
      } else {
        const errorText = await response.text()
        console.error("[Grocery] AI grocery generation failed:", response.status, errorText)
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.error("[Grocery] AI grocery generation timed out after 60 seconds")
      } else {
        console.error("[Grocery] Failed to call AI for grocery list:", err)
      }
    }
  }

  // Fallback: add basic ingredients from meals directly
  return addBasicIngredientsFromMeals(user.id, supabase, meals)
}

// Default grocery items for a healthy week when AI fails
const DEFAULT_GROCERY_ITEMS = [
  { name: "Chicken Breast", category: "Proteins", quantity: "2 lbs" },
  { name: "Salmon Fillets", category: "Proteins", quantity: "1 lb" },
  { name: "Eggs", category: "Proteins", quantity: "1 dozen" },
  { name: "Greek Yogurt", category: "Dairy", quantity: "32 oz" },
  { name: "Brown Rice", category: "Carbohydrates", quantity: "2 lbs" },
  { name: "Oats", category: "Carbohydrates", quantity: "1 container" },
  { name: "Sweet Potatoes", category: "Carbohydrates", quantity: "3 lbs" },
  { name: "Quinoa", category: "Carbohydrates", quantity: "1 lb" },
  { name: "Broccoli", category: "Vegetables", quantity: "2 heads" },
  { name: "Spinach", category: "Vegetables", quantity: "1 bag" },
  { name: "Bell Peppers", category: "Vegetables", quantity: "4 pieces" },
  { name: "Onions", category: "Vegetables", quantity: "3 pieces" },
  { name: "Garlic", category: "Vegetables", quantity: "1 head" },
  { name: "Bananas", category: "Fruits", quantity: "6 pieces" },
  { name: "Blueberries", category: "Fruits", quantity: "1 container" },
  { name: "Avocados", category: "Fruits", quantity: "4 pieces" },
  { name: "Olive Oil", category: "Healthy Fats", quantity: "1 bottle" },
  { name: "Almonds", category: "Healthy Fats", quantity: "1 bag" },
  { name: "Salt", category: "Spices & Seasonings", quantity: "as needed" },
  { name: "Black Pepper", category: "Spices & Seasonings", quantity: "as needed" },
  { name: "Garlic Powder", category: "Spices & Seasonings", quantity: "as needed" },
]

// Fallback function to add ingredients directly from meals without AI
async function addBasicIngredientsFromMeals(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  meals: MealWithIngredients[]
) {
  const ingredientMap = new Map<string, { quantity: string; category: string; mealId: string }>()

  for (const meal of meals) {
    if (!meal.ingredients) continue

    for (const ingredient of meal.ingredients) {
      const itemName = extractItemName(ingredient)
      const quantity = extractQuantity(ingredient)
      const category = categorizeIngredient(ingredient)

      // Consolidate duplicate ingredients
      if (!ingredientMap.has(itemName.toLowerCase())) {
        ingredientMap.set(itemName.toLowerCase(), {
          quantity,
          category,
          mealId: meal.id,
        })
      }
    }
  }

  let items: any[] = []

  if (ingredientMap.size > 0) {
    // Use ingredients from meals
    items = Array.from(ingredientMap.entries()).map(([name, data]) => ({
      user_id: userId,
      item_name: name.charAt(0).toUpperCase() + name.slice(1),
      category: data.category,
      quantity: data.quantity,
      checked: false,
      source: "meal" as const,
      meal_id: data.mealId,
    }))
    console.log("[Grocery] Adding", items.length, "items from meal ingredients")
  } else {
    // Use default grocery list if no ingredients found
    items = DEFAULT_GROCERY_ITEMS.map((item) => ({
      user_id: userId,
      item_name: item.name,
      category: item.category,
      quantity: item.quantity,
      checked: false,
      source: "forecast" as const,
    }))
    console.log("[Grocery] No meal ingredients found, using default list with", items.length, "items")
  }

  if (items.length > 0) {
    await supabase.from("grocery_lists").insert(items)
  }

  revalidatePath("/grocery-list")
  return { success: true, itemCount: items.length }
}

// Get grocery list statistics
export async function getGroceryStats() {
  const { user, error } = await getAuthUser()
  if (error || !user) {
    return { total: 0, completed: 0, fromMeals: 0, forecast: 0, manual: 0 }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("grocery_lists")
    .select("checked, source")
    .eq("user_id", user.id)

  if (!data) return { total: 0, completed: 0, fromMeals: 0, forecast: 0, manual: 0 }

  return {
    total: data.length,
    completed: data.filter((i) => i.checked).length,
    fromMeals: data.filter((i) => i.source === "meal").length,
    forecast: data.filter((i) => i.source === "forecast").length,
    manual: data.filter((i) => i.source === "manual").length,
  }
}
