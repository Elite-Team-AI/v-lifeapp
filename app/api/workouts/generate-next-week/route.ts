import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createApiLogger } from '@/lib/utils/logger'

/**
 * Generate next week of workout plan based on previous week's performance
 *
 * POST /api/workouts/generate-next-week
 *
 * Body:
 * - userId: string (required)
 * - planId: string (required)
 */
export async function POST(request: NextRequest) {
  const log = createApiLogger(request)

  try {
    const body = await request.json()
    const { userId, planId } = body

    if (!userId || !planId) {
      log.warn("Generate next week request missing required parameters", undefined, {
        hasUserId: !!userId,
        hasPlanId: !!planId
      })
      return NextResponse.json(
        { error: 'userId and planId are required' },
        { status: 400 }
      )
    }

    log.info("Starting adaptive next week generation", undefined, {
      userId,
      planId
    })

    // Validate environment variables
    const openaiKey = process.env.OPENAI_API_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!openaiKey || !supabaseUrl || !supabaseServiceKey) {
      log.error("Missing environment variables", new Error("Missing credentials"), undefined, { userId })
      return NextResponse.json(
        { error: 'Service not configured', details: 'Missing required credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const openai = new OpenAI({ apiKey: openaiKey })

    // 1. Fetch user's workout plan
    const { data: plan, error: planError } = await supabase
      .from('user_workout_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .single()

    if (planError || !plan) {
      log.error("Workout plan not found", new Error(planError?.message || "Not found"), undefined, {
        userId,
        planId
      })
      return NextResponse.json(
        { error: 'Workout plan not found' },
        { status: 404 }
      )
    }

    const currentWeek = plan.current_week || 1
    const weeksGenerated = plan.weeks_generated || 1
    const nextWeek = currentWeek + 1

    log.info("Plan status", undefined, {
      userId,
      planId,
      currentWeek,
      weeksGenerated,
      nextWeek
    })

    // Check if we're trying to generate beyond week 4
    if (nextWeek > 4) {
      return NextResponse.json(
        { error: 'Cannot generate beyond Week 4', message: 'This is a 4-week program' },
        { status: 400 }
      )
    }

    // Check if next week is already generated
    if (nextWeek <= weeksGenerated) {
      return NextResponse.json(
        { error: 'Week already generated', message: `Week ${nextWeek} has already been generated` },
        { status: 400 }
      )
    }

    // 2. Verify current week is completed
    const { data: currentWeekWorkouts, error: workoutsError } = await supabase
      .from('plan_workouts')
      .select('id')
      .eq('plan_id', planId)
      .eq('week_number', currentWeek)

    if (workoutsError) {
      log.error("Failed to fetch current week workouts", new Error(workoutsError.message), undefined, {
        userId,
        planId,
        currentWeek
      })
      return NextResponse.json(
        { error: 'Failed to verify week completion' },
        { status: 500 }
      )
    }

    const currentWeekWorkoutIds = currentWeekWorkouts?.map(w => w.id) || []

    const { data: completedWorkouts, error: completedError } = await supabase
      .from('workout_logs')
      .select('plan_workout_id')
      .in('plan_workout_id', currentWeekWorkoutIds)
      .eq('status', 'completed')

    if (completedError) {
      log.error("Failed to check workout completion", new Error(completedError.message), undefined, {
        userId,
        planId,
        currentWeek
      })
      return NextResponse.json(
        { error: 'Failed to verify week completion' },
        { status: 500 }
      )
    }

    const completedCount = completedWorkouts?.length || 0
    const totalCount = currentWeekWorkoutIds.length

    if (completedCount < totalCount) {
      log.warn("Current week not yet completed", undefined, {
        userId,
        planId,
        currentWeek,
        completedCount,
        totalCount
      })
      return NextResponse.json(
        {
          error: 'Week not completed',
          message: `Complete all ${totalCount} workouts in Week ${currentWeek} before generating Week ${nextWeek}`,
          details: {
            currentWeek,
            completedWorkouts: completedCount,
            totalWorkouts: totalCount
          }
        },
        { status: 400 }
      )
    }

    // 3. Fetch performance data from current week
    const { data: performanceData, error: perfError } = await supabase
      .from('exercise_logs')
      .select(`
        exercise_id,
        weight_per_set,
        reps_per_set,
        rpe_per_set,
        sets_completed,
        workout_logs!inner(
          plan_workout_id,
          plan_workouts!inner(
            week_number,
            plan_id
          )
        )
      `)
      .eq('workout_logs.plan_workouts.plan_id', planId)
      .eq('workout_logs.plan_workouts.week_number', currentWeek)

    if (perfError) {
      log.error("Failed to fetch performance data", new Error(perfError.message), undefined, {
        userId,
        planId,
        currentWeek
      })
      return NextResponse.json(
        { error: 'Failed to analyze previous week performance' },
        { status: 500 }
      )
    }

    // 4. Calculate progressive overload recommendations
    const exerciseStats = calculateExerciseStats(performanceData || [])

    log.info("Performance analysis complete", undefined, {
      userId,
      planId,
      currentWeek,
      exercisesAnalyzed: Object.keys(exerciseStats).length
    })

    // 5. Fetch user profile for AI generation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      log.error("User profile not found", new Error(profileError?.message || "Not found"), undefined, {
        userId
      })
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // 6. Fetch exercise library
    const trainingStyle = profile.training_style || 'mixed'
    const mappedStyle = trainingStyle === 'aesthetics' ? 'hypertrophy' : trainingStyle === 'crossfit' ? 'mixed' : trainingStyle

    const { data: exercises, error: exercisesError } = await supabase
      .from('exercise_library')
      .select('*')
      .eq('is_active', true)
      .eq('training_modality', mappedStyle)

    if (exercisesError) {
      log.error("Failed to fetch exercise library", new Error(exercisesError.message), undefined, {
        userId
      })
      return NextResponse.json(
        { error: 'Failed to fetch exercises' },
        { status: 500 }
      )
    }

    // Filter by available equipment
    const availableEquipment = profile.available_equipment || []
    const normalizedUserEquipment = availableEquipment.map((e: string) => e.toLowerCase())
    const filteredExercises = exercises?.filter(ex => {
      if (!ex.equipment || ex.equipment.length === 0) return true
      return ex.equipment.some((eq: string) => normalizedUserEquipment.includes(eq.toLowerCase()))
    }) || []

    // 7. Generate AI prompt with performance data
    const prompt = buildNextWeekPrompt(
      profile,
      filteredExercises,
      currentWeek,
      nextWeek,
      exerciseStats,
      plan
    )

    log.info(`Generating Week ${nextWeek} with adaptive progressive overload`, undefined, {
      userId,
      planId,
      model: 'gpt-4o',
      exercisesAvailable: filteredExercises.length
    })

    // 8. Call OpenAI to generate next week
    let completion
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert fitness coach specializing in progressive overload and periodization. You create workout programs that adapt based on the user's actual logged performance data from previous weeks.

🚨 ABSOLUTE REQUIREMENTS 🚨
- 60-minute workouts: EXACTLY 6-7 exercises, 12+ total sets
- 45-minute workouts: EXACTLY 5-6 exercises, 10+ total sets
- Use EXACT UUIDs from the available exercises list
- Apply progressive overload based on previous week's logged data
- Week 2-3: Increase difficulty (weight/reps/sets)
- Week 4: Deload to 60-70% volume for recovery`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
        max_tokens: 16384
      })
    } catch (openaiError: any) {
      log.error(`OpenAI API call failed for Week ${nextWeek}`, openaiError, undefined, {
        userId,
        planId,
        nextWeek
      })
      return NextResponse.json(
        { error: 'AI generation failed', details: openaiError.message },
        { status: 500 }
      )
    }

    const aiResponse = completion.choices[0].message.content
    if (!aiResponse) {
      log.error("Empty AI response", new Error("No content"), undefined, { userId, planId, nextWeek })
      return NextResponse.json(
        { error: 'AI returned empty response' },
        { status: 500 }
      )
    }

    // 9. Parse AI response
    let weekData
    try {
      const parsed = JSON.parse(aiResponse)
      weekData = parsed.weeks && parsed.weeks.length > 0 ? parsed.weeks[0] : parsed
    } catch (parseError: any) {
      log.error("Failed to parse AI response", parseError, undefined, {
        userId,
        planId,
        nextWeek
      })
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: parseError.message },
        { status: 500 }
      )
    }

    // 10. Save new week to database
    log.info("Saving generated week to database", undefined, {
      userId,
      planId,
      nextWeek,
      workoutsCount: weekData.workouts?.length || 0
    })

    let totalWorkoutsCreated = 0
    let totalExercisesCreated = 0

    for (const workout of weekData.workouts || []) {
      const { data: newWorkout, error: workoutError } = await supabase
        .from('plan_workouts')
        .insert({
          plan_id: planId,
          user_id: userId,
          week_number: nextWeek,
          workout_name: workout.workoutName || 'Workout',
          workout_type: workout.workoutType || 'mixed',
          day_of_week: workout.dayOfWeek,
          estimated_duration_minutes: workout.estimatedDuration || 60,
          target_volume_sets: workout.exercises?.reduce((sum: number, ex: any) => sum + (ex.sets || 0), 0) || 0,
          muscle_groups: workout.muscleGroups || [],
          is_locked: true // Lock by default until current week is officially completed
        })
        .select()
        .single()

      if (workoutError) {
        log.error("Failed to create workout", new Error(workoutError.message), undefined, {
          userId,
          planId,
          nextWeek,
          workoutName: workout.workoutName
        })
        continue
      }

      totalWorkoutsCreated++

      // Create exercises for this workout
      for (const exercise of workout.exercises || []) {
        // Get recommended weight from performance stats
        const stats = exerciseStats[exercise.exerciseId]
        const recommendedWeight = stats?.recommendedWeight || exercise.weight || null

        const { error: exerciseError } = await supabase
          .from('plan_exercises')
          .insert({
            workout_id: newWorkout.id,
            exercise_id: exercise.exerciseId,
            user_id: userId,
            exercise_order: exercise.exerciseOrder || exercise.order || 1,
            target_sets: exercise.sets || 3,
            target_reps_min: exercise.repsMin || 8,
            target_reps_max: exercise.repsMax || 12,
            target_weight_lbs: exercise.weight || null,
            recommended_weight_lbs: recommendedWeight,
            last_logged_weight_lbs: stats?.avgWeight || null,
            last_logged_reps: stats?.avgReps || null,
            last_logged_rpe: stats?.avgRpe || null,
            rest_seconds: exercise.restSeconds || 90,
            tempo: exercise.tempo || null,
            exercise_notes: exercise.notes || null,
            progression_type: 'weight'
          })

        if (!exerciseError) {
          totalExercisesCreated++
        } else {
          log.error("Failed to create exercise", new Error(exerciseError.message), undefined, {
            userId,
            planId,
            workoutId: newWorkout.id,
            exerciseName: exercise.exerciseName
          })
        }
      }
    }

    // 11. Update plan to increment weeks_generated
    const { error: updateError } = await supabase
      .from('user_workout_plans')
      .update({
        weeks_generated: nextWeek,
        progression_data: {
          ...plan.progression_data,
          [`week_${currentWeek}`]: exerciseStats
        }
      })
      .eq('id', planId)

    if (updateError) {
      log.error("Failed to update plan", new Error(updateError.message), undefined, {
        userId,
        planId
      })
    }

    log.info("Next week generated successfully", undefined, {
      userId,
      planId,
      weekNumber: nextWeek,
      totalWorkouts: totalWorkoutsCreated,
      totalExercises: totalExercisesCreated
    })

    return NextResponse.json({
      success: true,
      weekNumber: nextWeek,
      totalWorkouts: totalWorkoutsCreated,
      totalExercises: totalExercisesCreated,
      message: `Week ${nextWeek} generated successfully with progressive overload based on your Week ${currentWeek} performance`
    })

  } catch (error: any) {
    log.error("Next week generation failed", error as Error)
    return NextResponse.json(
      {
        error: 'Failed to generate next week',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate exercise statistics from performance data
 */
function calculateExerciseStats(performanceData: any[]): Record<string, any> {
  const stats: Record<string, any> = {}

  for (const log of performanceData) {
    const exerciseId = log.exercise_id
    if (!exerciseId) continue

    if (!stats[exerciseId]) {
      stats[exerciseId] = {
        totalSets: 0,
        totalReps: 0,
        totalWeight: 0,
        totalRpe: 0,
        count: 0,
        maxWeight: 0
      }
    }

    const weightPerSet = log.weight_per_set || []
    const repsPerSet = log.reps_per_set || []
    const rpePerSet = log.rpe_per_set || []

    for (let i = 0; i < weightPerSet.length; i++) {
      if (weightPerSet[i]) {
        stats[exerciseId].totalWeight += weightPerSet[i]
        stats[exerciseId].maxWeight = Math.max(stats[exerciseId].maxWeight, weightPerSet[i])
        stats[exerciseId].count++
      }
      if (repsPerSet[i]) {
        stats[exerciseId].totalReps += repsPerSet[i]
      }
      if (rpePerSet[i]) {
        stats[exerciseId].totalRpe += rpePerSet[i]
      }
    }

    stats[exerciseId].totalSets += log.sets_completed || 0
  }

  // Calculate averages and recommendations
  for (const exerciseId in stats) {
    const s = stats[exerciseId]
    s.avgWeight = s.count > 0 ? s.totalWeight / s.count : 0
    s.avgReps = s.count > 0 ? Math.round(s.totalReps / s.count) : 0
    s.avgRpe = s.count > 0 ? Math.round(s.totalRpe / s.count) : 0

    // Progressive overload: increase weight by 5-10% based on RPE
    if (s.avgWeight > 0) {
      if (s.avgRpe < 7) {
        // Too easy, increase by 10%
        s.recommendedWeight = Math.round((s.avgWeight * 1.1) / 5) * 5 // Round to nearest 5
      } else if (s.avgRpe <= 8) {
        // Just right, increase by 5%
        s.recommendedWeight = Math.round((s.avgWeight * 1.05) / 5) * 5
      } else {
        // Too hard, keep same weight
        s.recommendedWeight = Math.round(s.avgWeight / 5) * 5
      }
    }
  }

  return stats
}

/**
 * Build prompt for generating next week based on previous performance
 */
function buildNextWeekPrompt(
  profile: any,
  exercises: any[],
  currentWeek: number,
  nextWeek: number,
  exerciseStats: Record<string, any>,
  plan: any
): string {
  const daysPerWeek = plan.days_per_week || profile.training_days_per_week || 3
  const trainingStyle = profile.training_style || 'mixed'

  // Determine week type
  let weekType = 'volume'
  let volumeMultiplier = 1.1
  let weekDescription = ''

  if (nextWeek === 2) {
    weekType = 'volume'
    volumeMultiplier = 1.1
    weekDescription = 'VOLUME INCREASE: Add 10% more volume (weight/reps/sets) from Week 1'
  } else if (nextWeek === 3) {
    weekType = 'peak'
    volumeMultiplier = 1.15
    weekDescription = 'PEAK INTENSITY: Highest volume/intensity of the mesocycle (15% increase from Week 1)'
  } else if (nextWeek === 4) {
    weekType = 'deload'
    volumeMultiplier = 0.65
    weekDescription = 'DELOAD/RECOVERY: Reduce volume to 60-70% for recovery and adaptation'
  }

  // Format performance data for AI
  let performanceContext = ''
  if (Object.keys(exerciseStats).length > 0) {
    performanceContext = '\n**PREVIOUS WEEK PERFORMANCE DATA:**\n\n'
    performanceContext += 'The user completed Week ' + currentWeek + ' with the following performance:\n\n'

    for (const [exerciseId, stats] of Object.entries(exerciseStats)) {
      const exercise = exercises.find(ex => ex.id === exerciseId)
      if (exercise) {
        performanceContext += `- ${exercise.name}:\n`
        performanceContext += `  * Average Weight: ${stats.avgWeight} lbs\n`
        performanceContext += `  * Average Reps: ${stats.avgReps}\n`
        performanceContext += `  * Average RPE: ${stats.avgRpe}/10\n`
        performanceContext += `  * Max Weight: ${stats.maxWeight} lbs\n`
        if (stats.recommendedWeight) {
          performanceContext += `  * 🎯 RECOMMENDED WEIGHT FOR WEEK ${nextWeek}: ${stats.recommendedWeight} lbs\n`
        }
        performanceContext += '\n'
      }
    }

    performanceContext += `\n**CRITICAL: Use the recommended weights above when programming Week ${nextWeek}. This ensures proper progressive overload based on actual logged performance.**\n\n`
  }

  return `Generate Week ${nextWeek} of a 4-week workout mesocycle with **ADAPTIVE PROGRESSIVE OVERLOAD** based on the user's logged performance from Week ${currentWeek}.

**USER PROFILE:**
- Age: ${profile.age || 'Unknown'}
- Gender: ${profile.gender || 'Unknown'}
- Fitness Goal: ${profile.fitness_goal || 'General fitness'}
- Experience Level: ${profile.experience_level || 'beginner'}
- Training Style: ${trainingStyle}
- Days Per Week: ${daysPerWeek}
- Available Equipment: ${profile.available_equipment?.join(', ') || 'Bodyweight only'}

${performanceContext}

**WEEK ${nextWeek} SPECIFICATIONS:**
- Week Type: ${weekType}
- Volume Multiplier: ${volumeMultiplier}
- ${weekDescription}

**PROGRESSIVE OVERLOAD STRATEGY FOR WEEK ${nextWeek}:**

${nextWeek === 2 ? `
- Increase weight by 5-10% from Week 1 (use recommended weights above)
- OR increase reps by 1-2 per set
- OR add 1 additional set to key exercises
- Focus: Build on Week 1's foundation with manageable progression
` : ''}

${nextWeek === 3 ? `
- Increase weight by another 5% from Week 2
- OR push to top of rep ranges
- OR add intensity techniques (drop sets, supersets)
- Focus: Peak week - highest training stimulus before deload
` : ''}

${nextWeek === 4 ? `
- REDUCE volume to 60-70% of Week 3
- Use lighter weights (70-80% of Week 3 weights)
- Maintain exercise selection but reduce sets/reps
- Focus: Recovery and adaptation - let gains consolidate
- Example: If Week 3 was 4x8 at 185 lbs → Week 4 is 3x8 at 135 lbs
` : ''}

**AVAILABLE EXERCISES (${exercises.length} total):**

${exercises.slice(0, 50).map(ex =>
  `- ID: ${ex.id} | ${ex.name} | ${ex.category} | ${ex.difficulty} | Muscles: ${ex.primary_muscles?.join(', ')}`
).join('\n')}

🚨 MANDATORY REQUIREMENTS 🚨

1. **Exercise Count:** 60-min workouts = 6-7 exercises, 45-min = 5-6 exercises
2. **Set Count:** 60-min workouts = 12+ total sets minimum
3. **Use Exact UUIDs:** Only use exercise IDs from the list above
4. **Apply Progressive Overload:** Use recommended weights from performance data
5. **Maintain Split:** Keep same workout split as Week ${currentWeek} (${plan.split_pattern || 'auto'})

**OUTPUT FORMAT (JSON):**

{
  "weeks": [
    {
      "weekNumber": ${nextWeek},
      "weekType": "${weekType}",
      "volumeMultiplier": ${volumeMultiplier},
      "workouts": [
        {
          "dayOfWeek": 1,
          "workoutName": "Workout Name",
          "workoutType": "push/pull/legs/upper/lower/full_body",
          "estimatedDuration": 60,
          "muscleGroups": ["chest", "shoulders", "triceps"],
          "exercises": [
            {
              "exerciseId": "EXACT-UUID-FROM-LIST",
              "exerciseName": "Exercise Name",
              "exerciseOrder": 1,
              "sets": 3,
              "repsMin": 8,
              "repsMax": 12,
              "weight": null,
              "restSeconds": 90,
              "tempo": "3-0-1-0",
              "notes": "Form cues"
            }
          ]
        }
      ]
    }
  ]
}

Generate Week ${nextWeek} with exactly ${daysPerWeek} workouts, applying progressive overload based on the performance data above.`
}
