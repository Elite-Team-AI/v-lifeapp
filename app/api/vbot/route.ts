import { consumeStream, convertToModelMessages, streamText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { vbotRequestSchema, createErrorResponse } from "@/lib/validations/api"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validationResult = vbotRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return Response.json(
        {
          error: "Invalid request",
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { messages } = validationResult.data

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Date helpers for today's data
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)
    const today = todayStart.toISOString().split("T")[0]

    // Weekly range for workout schedule
    const oneWeekFromNow = new Date(todayStart)
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)
    const weekFromNow = oneWeekFromNow.toISOString().split("T")[0]

    // Fetch all user fitness data in parallel - ENHANCED VERSION
    const [
      profileResult,
      habitsResult,
      workoutsHistoryResult,
      todayWorkoutResult,
      weeklyWorkoutsResult,
      mealsHistoryResult,
      todayMealLogsResult,
      weightEntriesResult,
      progressPhotosResult,
      streaksResult,
      supplementsResult,
      weeklyHabitLogsResult,
      exerciseLogsResult,
    ] = await Promise.all([
      // Profile with all fields
      supabase.from("profiles").select("*").eq("id", user.id).single(),

      // Habits with today's completion status
      supabase.from("habits").select("*, habit_logs(*)").eq("user_id", user.id),

      // Workout history (last 10)
      supabase
        .from("workouts")
        .select("*, workout_exercises(*, exercises(*))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),

      // TODAY'S WORKOUT - scheduled or active
      supabase
        .from("workouts")
        .select("*, workout_exercises(*, exercises(*))")
        .eq("user_id", user.id)
        .or(`scheduled_date.eq.${today},and(scheduled_date.is.null,completed.eq.false)`)
        .gte("created_at", todayStart.toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      // WEEKLY WORKOUT SCHEDULE (next 7 days)
      supabase
        .from("workouts")
        .select("id, name, workout_type, duration_minutes, scheduled_date, completed, workout_exercises(exercises(name))")
        .eq("user_id", user.id)
        .gte("scheduled_date", today)
        .lte("scheduled_date", weekFromNow)
        .order("scheduled_date", { ascending: true }),

      // Meal history (last 10)
      supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),

      // TODAY'S MEAL LOGS - what user has eaten today
      supabase
        .from("meal_logs")
        .select(`
          id,
          meal_type,
          is_eaten,
          eaten_at,
          meals:meal_id (
            id,
            name,
            calories,
            protein,
            carbs,
            fat
          )
        `)
        .eq("user_id", user.id)
        .gte("consumed_at", todayStart.toISOString())
        .lte("consumed_at", todayEnd.toISOString()),

      // Weight tracking
      supabase
        .from("weight_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(10),

      // Progress photos
      supabase
        .from("progress_photos")
        .select("*")
        .eq("user_id", user.id)
        .order("taken_at", { ascending: false })
        .limit(5),

      // Streaks
      supabase.from("streaks").select("*").eq("user_id", user.id),

      // Supplements
      supabase
        .from("supplement_logs")
        .select("*, supplements(*)")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(10),

      // WEEKLY HABIT LOGS - for weekly progress calculation
      supabase
        .from("habit_logs")
        .select("id, habit_id, completed, logged_at")
        .eq("user_id", user.id)
        .gte("logged_at", new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .lte("logged_at", todayEnd.toISOString()),

      // EXERCISE HISTORY - recent performance for progressive overload tracking
      supabase
        .from("exercise_logs")
        .select("exercise_id, weight, reps, logged_at, exercises(name)")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(20),
    ])

    // Build comprehensive user context
    const profile = profileResult.data
    const habits = habitsResult.data || []
    const workoutsHistory = workoutsHistoryResult.data || []
    const todayWorkout = todayWorkoutResult.data
    const weeklyWorkouts = weeklyWorkoutsResult.data || []
    const mealsHistory = mealsHistoryResult.data || []
    const todayMealLogs = todayMealLogsResult.data || []
    const weightEntries = weightEntriesResult.data || []
    const progressPhotos = progressPhotosResult.data || []
    const streaks = streaksResult.data || []
    const supplements = supplementsResult.data || []
    const weeklyHabitLogs = weeklyHabitLogsResult.data || []
    const exerciseLogs = exerciseLogsResult.data || []

    // ============================================
    // ENHANCED CALCULATIONS
    // ============================================

    // 1. TODAY'S NUTRITION TRACKING
    const todayMeals = todayMealLogs
      .filter(log => log.meals)
      .map(log => {
        const meal = Array.isArray(log.meals) ? log.meals[0] : log.meals
        return {
          type: log.meal_type,
          name: meal?.name || "Unknown",
          calories: meal?.calories || 0,
          protein: meal?.protein || 0,
          carbs: meal?.carbs || 0,
          fat: meal?.fat || 0,
          isEaten: log.is_eaten,
          eatenAt: log.eaten_at,
        }
      })

    const consumedCalories = todayMeals
      .filter(m => m.isEaten)
      .reduce((sum, m) => sum + m.calories, 0)

    const consumedProtein = todayMeals
      .filter(m => m.isEaten)
      .reduce((sum, m) => sum + m.protein, 0)

    const consumedCarbs = todayMeals
      .filter(m => m.isEaten)
      .reduce((sum, m) => sum + m.carbs, 0)

    const consumedFat = todayMeals
      .filter(m => m.isEaten)
      .reduce((sum, m) => sum + m.fat, 0)

    // Calculate nutrition targets
    const goalWeight = profile?.goal_weight || profile?.weight || 170
    const primaryGoal = (profile?.primary_goal || "").toLowerCase().replace(/_/g, "-")
    const isLosingWeight = primaryGoal === "lose-weight"

    // Calorie target (use custom goal if set, otherwise calculate)
    const calorieTarget = profile?.calorie_goal && profile.calorie_goal > 0
      ? profile.calorie_goal
      : Math.round(goalWeight * (isLosingWeight ? 11 : 13))

    // Macro targets (derived from calorie target)
    const proteinTarget = profile?.calorie_goal && profile.calorie_goal > 0
      ? Math.round((profile.calorie_goal * 0.3) / 4) // 30% from protein
      : Math.round(goalWeight * 0.9) // 0.9g per lb goal weight

    const carbsTarget = Math.round((calorieTarget * 0.4) / 4) // 40% from carbs
    const fatTarget = Math.round((calorieTarget * 0.3) / 9) // 30% from fat

    // Calculate remaining calories and macros
    const caloriesRemaining = calorieTarget - consumedCalories
    const proteinRemaining = proteinTarget - consumedProtein
    const carbsRemaining = carbsTarget - consumedCarbs
    const fatRemaining = fatTarget - consumedFat

    const isOverCalories = caloriesRemaining < 0
    const calorieStatus = isOverCalories
      ? `OVER by ${Math.abs(caloriesRemaining)} calories`
      : `${caloriesRemaining} calories remaining`

    // 2. HABIT COMPLETION STATS
    const completedHabitsToday = habits.filter((h) =>
      h.habit_logs?.some(
        (log: { completed: boolean; logged_at: string }) =>
          log.completed && new Date(log.logged_at).toDateString() === new Date().toDateString()
      )
    ).length

    // Weekly habit completion rate
    const totalHabitOpportunities = habits.length * 7
    const completedHabitLogs = weeklyHabitLogs.filter(log => log.completed).length
    const weeklyHabitCompletionRate = totalHabitOpportunities > 0
      ? Math.round((completedHabitLogs / totalHabitOpportunities) * 100)
      : 0

    // 3. WORKOUT STATS
    const completedWorkouts = workoutsHistory.filter((w) => w.completed).length
    const totalWorkoutMinutes = workoutsHistory.reduce((sum: number, w) => sum + (w.duration_minutes || 0), 0)

    // This week's workout count
    const oneWeekAgo = new Date(todayStart)
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const weeklyWorkoutCount = workoutsHistory.filter(w =>
      w.completed && new Date(w.created_at) >= oneWeekAgo
    ).length

    const weeklyWorkoutGoal = profile?.training_days_per_week || 3

    // 4. WEIGHT PROGRESS
    const currentWeight = weightEntries[0]?.weight
    const startWeight = weightEntries[weightEntries.length - 1]?.weight
    const weightChange = currentWeight && startWeight ? currentWeight - startWeight : 0

    // Weight trend (last 3 entries)
    const recentWeights = weightEntries.slice(0, 3).map(w => w.weight).filter(Boolean)
    const weightTrend = recentWeights.length >= 2
      ? recentWeights[0] < recentWeights[recentWeights.length - 1]
        ? "decreasing"
        : recentWeights[0] > recentWeights[recentWeights.length - 1]
        ? "increasing"
        : "stable"
      : "insufficient data"

    // 5. EXERCISE PERFORMANCE TRACKING
    const recentExercisePerformance = exerciseLogs.slice(0, 10).map(log => {
      const exerciseName = log.exercises?.name || "Unknown Exercise"
      return `${exerciseName}: ${log.weight || 0}lbs x ${log.reps || 0} reps (${new Date(log.logged_at).toLocaleDateString()})`
    })

    // ============================================
    // BUILD COMPREHENSIVE SYSTEM CONTEXT
    // ============================================
    const systemContext = `You are VBot, an advanced AI fitness coach for V-Life with COMPLETE real-time access to all user data. You are their personal trainer, nutritionist, and accountability partner rolled into one.

═══════════════════════════════════════
USER PROFILE & ONBOARDING DATA
═══════════════════════════════════════
- Name: ${profile?.name || "User"}
- Age: ${profile?.age || "N/A"}
- Gender: ${profile?.gender || "N/A"}
- Height: ${profile?.height_feet || 0}'${profile?.height_inches || 0}"
- Current Weight: ${currentWeight || profile?.weight || "N/A"} lbs
- Goal Weight: ${profile?.goal_weight || "N/A"} lbs
- Weight Change Progress: ${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} lbs
- Weight Trend (last 3 entries): ${weightTrend}
- Primary Goal: ${profile?.primary_goal || "N/A"}
- Activity Level: ${profile?.activity_level || "N/A"}/5
- Gym Access: ${profile?.gym_access || "N/A"}
- Selected Gym: ${profile?.selected_gym || "N/A"}
- Training Style: ${profile?.training_style || "N/A"}
- Available Training Time: ${profile?.available_time_minutes || "N/A"} minutes per session
- Training Days Per Week Goal: ${weeklyWorkoutGoal} days
- This Week's Workouts Completed: ${weeklyWorkoutCount}/${weeklyWorkoutGoal} days
- Allergies: ${profile?.allergies?.join(", ") || "None"}
- Dietary Restrictions: ${profile?.custom_restrictions?.join(", ") || "None"}
- Timezone: ${profile?.timezone || "N/A"}
- Account Created: ${profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}

═══════════════════════════════════════
TODAY'S NUTRITION - REAL-TIME TRACKING
═══════════════════════════════════════
CALORIE TRACKING:
- Calorie Goal: ${calorieTarget} cal/day
- Consumed Today: ${consumedCalories} cal
- Remaining: ${calorieStatus}
${isOverCalories ? `\n⚠️ USER HAS EXCEEDED CALORIE GOAL - Suggest adjustments for rest of week or increased activity` : ""}

MACRO TARGETS & PROGRESS:
- Protein: ${consumedProtein}g / ${proteinTarget}g (${proteinRemaining > 0 ? proteinRemaining + "g remaining" : Math.abs(proteinRemaining) + "g over"})
- Carbs: ${consumedCarbs}g / ${carbsTarget}g (${carbsRemaining > 0 ? carbsRemaining + "g remaining" : Math.abs(carbsRemaining) + "g over"})
- Fat: ${consumedFat}g / ${fatTarget}g (${fatRemaining > 0 ? fatRemaining + "g remaining" : Math.abs(fatRemaining) + "g over"})

TODAY'S MEALS:
${todayMeals.length > 0
  ? todayMeals.map(m =>
      `- ${m.type}: ${m.name} - ${m.calories} cal, ${m.protein}g protein, ${m.carbs}g carbs, ${m.fat}g fat ${m.isEaten ? "✓ EATEN" : "○ PLANNED"}`
    ).join("\n")
  : "- No meals logged yet today"
}

NUTRITION STRATEGY:
${isLosingWeight
  ? "User is in a caloric deficit for weight loss. Prioritize protein to preserve muscle mass."
  : "User is eating at maintenance or surplus for muscle building. Ensure adequate protein for recovery."
}

═══════════════════════════════════════
TODAY'S WORKOUT - ACTIVE PLAN
═══════════════════════════════════════
${todayWorkout
  ? `ACTIVE WORKOUT: ${todayWorkout.name}
- Type: ${todayWorkout.workout_type || "General"}
- Duration: ${todayWorkout.duration_minutes || "N/A"} minutes
- Status: ${todayWorkout.completed ? "✓ COMPLETED" : "○ IN PROGRESS"}
- Exercises (${todayWorkout.workout_exercises?.length || 0} total):
${todayWorkout.workout_exercises?.map((we: any) =>
  `  • ${we.exercises?.name || "Exercise"} - ${we.sets}x${we.reps} (${we.rest_seconds}s rest)`
).join("\n") || "  No exercises logged"}`
  : "NO WORKOUT SCHEDULED FOR TODAY - Suggest creating one based on their training plan"
}

═══════════════════════════════════════
WEEKLY WORKOUT SCHEDULE (Next 7 Days)
═══════════════════════════════════════
${weeklyWorkouts.length > 0
  ? weeklyWorkouts.map(w =>
      `- ${w.scheduled_date}: ${w.name} (${w.workout_type || "General"}, ${w.duration_minutes || 0}min) ${w.completed ? "✓" : "○"}`
    ).join("\n")
  : "No workouts scheduled this week - Recommend creating a weekly plan"
}

Weekly Progress: ${weeklyWorkoutCount}/${weeklyWorkoutGoal} workouts completed

═══════════════════════════════════════
HABITS - DAILY & WEEKLY TRACKING
═══════════════════════════════════════
TODAY'S COMPLETION: ${completedHabitsToday}/${habits.length} habits completed
WEEKLY COMPLETION RATE: ${weeklyHabitCompletionRate}%

HABIT DETAILS:
${habits.length > 0
  ? habits.map(h => {
      const completedToday = h.habit_logs?.some(
        (log: { completed: boolean; logged_at: string }) =>
          log.completed && new Date(log.logged_at).toDateString() === new Date().toDateString()
      )
      return `- ${h.name} (${h.category}, ${h.frequency}) ${completedToday ? "✓" : "○"} - Streak: ${h.current_streak} days (Best: ${h.best_streak})`
    }).join("\n")
  : "No habits set up yet - Recommend creating daily habits aligned with their goals"
}

═══════════════════════════════════════
WORKOUT HISTORY & PERFORMANCE
═══════════════════════════════════════
Recent Workouts (Last 10):
${workoutsHistory.length > 0
  ? workoutsHistory.map(w =>
      `- ${w.name} (${w.workout_type || "General"}) ${w.completed ? "✓" : "○"} - ${w.duration_minutes || 0}min - ${w.workout_exercises?.length || 0} exercises`
    ).join("\n")
  : "No workout history yet"
}

Total Stats:
- Completed Workouts: ${completedWorkouts}
- Total Training Time: ${totalWorkoutMinutes} minutes

Recent Exercise Performance (for progressive overload):
${recentExercisePerformance.length > 0
  ? recentExercisePerformance.join("\n")
  : "No exercise logs yet"
}

═══════════════════════════════════════
WEIGHT TRACKING & BODY COMPOSITION
═══════════════════════════════════════
${weightEntries.length > 0
  ? weightEntries.map(w =>
      `- ${new Date(w.logged_at).toLocaleDateString()}: ${w.weight} lbs ${w.change ? `(${w.change > 0 ? "+" : ""}${w.change} lbs)` : ""} ${w.note ? `- "${w.note}"` : ""}`
    ).join("\n")
  : "No weight entries yet"
}

Progress Photos: ${progressPhotos.length} photos uploaded (track visual progress alongside scale)

═══════════════════════════════════════
STREAKS & GAMIFICATION
═══════════════════════════════════════
${streaks.length > 0
  ? streaks.map(s =>
      `- ${s.streak_type}: Current ${s.current_streak} days, Best ${s.best_streak} days`
    ).join("\n")
  : "No streaks yet - Encourage consistency to build momentum"
}

═══════════════════════════════════════
SUPPLEMENTS & RECOVERY
═══════════════════════════════════════
${supplements.length > 0
  ? supplements.map(s =>
      `- ${s.supplements?.name || "Supplement"} - ${s.taken ? "✓ Taken" : "○ Missed"} on ${new Date(s.logged_at).toLocaleDateString()}`
    ).join("\n")
  : "No supplement tracking yet"
}

═══════════════════════════════════════
YOUR ROLE AS AI COACH
═══════════════════════════════════════
You are an ADVANCED AI fitness coach with complete real-time data access. Your responsibilities:

1. **Nutrition Coaching**
   - Monitor daily calorie and macro intake in real-time
   - Alert when over/under calories and suggest immediate adjustments
   - Recommend meals for remaining calories/macros
   - Adjust weekly nutrition strategy based on progress
   - Consider allergies and restrictions in all recommendations

2. **Workout Programming**
   - Know today's workout and weekly schedule intimately
   - Provide exercise coaching and form tips
   - Track progressive overload based on exercise logs
   - Suggest workout adjustments based on energy/recovery
   - Align workouts with primary goal and available time

3. **Habit & Accountability**
   - Track daily and weekly habit completion
   - Celebrate streaks and milestones
   - Identify patterns and suggest improvements
   - Provide motivational support when streaks break

4. **Progress Monitoring**
   - Analyze weight trends and body composition changes
   - Compare current performance to past performance
   - Identify what's working and what needs adjustment
   - Set realistic short-term goals based on data

5. **Personalization**
   - Always use their name when addressing them
   - Reference specific data points (calories today, workout this week, etc.)
   - Adapt advice based on their primary goal, activity level, and preferences
   - Be encouraging but honest about areas needing improvement

6. **Proactive Guidance**
   - Suggest meal adjustments if calories are too high/low
   - Remind about upcoming workouts or habits
   - Notice and celebrate progress (weight loss, strength gains, streaks)
   - Identify red flags (missed workouts, low protein, broken streaks)

IMPORTANT: Always speak in a supportive, knowledgeable, and conversational tone. Reference specific data points to show you're tracking their journey. Keep responses concise (2-4 sentences usually) and actionable. Be their partner, not just an information source.`

    // Convert messages to the format expected by AI SDK
    const formattedMessages = messages.map((msg, idx) => ({
      id: `msg-${idx}`,
      role: msg.role as 'user' | 'assistant' | 'system',
      parts: [{ type: 'text' as const, text: msg.content }],
    }))

    const prompt = convertToModelMessages([
      {
        id: "system",
        role: "system" as const,
        parts: [{ type: "text" as const, text: systemContext }],
      },
      ...formattedMessages,
    ])

    const result = streamText({
      model: "gpt-4o-mini-2024-07-18",
      prompt,
      abortSignal: req.signal,
      maxOutputTokens: 1000,
      temperature: 0.7,
    })

    return result.toUIMessageStreamResponse({
      consumeSseStream: consumeStream,
    })
  } catch (error) {
    console.error("[VBot API Error]", error)
    return createErrorResponse(error, 500)
  }
}
