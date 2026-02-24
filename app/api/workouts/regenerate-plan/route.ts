import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import {
  analyzePerformance,
  determineProgressionRecommendation
} from '@/lib/performance-analyzer'
import {
  regenerateWorkoutPlan,
  applyProgressiveOverloadRules,
  validateRegeneratedPlan,
  generateCyclePlan
} from '@/lib/adaptive-progression'
import { createApiLogger } from '@/lib/utils/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Regenerate workout plan based on performance data
 *
 * POST /api/workouts/regenerate-plan
 *
 * Body:
 * - userId: string (required)
 * - planId: string (required) - Current active plan
 * - weeksToAnalyze: number (optional) - Number of weeks to analyze (default: 1)
 * - generateFullCycle: boolean (optional) - Generate 4-week cycle (default: false)
 * - trainingStyle: string (optional) - If provided, generates new plan with this training style instead of progressive overload
 */
export async function POST(request: NextRequest) {
  const log = createApiLogger(request)

  try {
    const body = await request.json()
    const {
      userId,
      planId,
      weeksToAnalyze = 1,
      generateFullCycle = false,
      trainingStyle = null
    } = body

    if (!userId || !planId) {
      log.warn("Plan regeneration request missing required parameters", undefined, {
        hasUserId: !!userId,
        hasPlanId: !!planId
      })
      return NextResponse.json(
        { error: 'userId and planId are required' },
        { status: 400 }
      )
    }

    log.info("Starting workout plan regeneration", undefined, {
      userId,
      planId,
      weeksToAnalyze,
      generateFullCycle,
      trainingStyle
    })

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 1. Fetch user profile to use current equipment, experience, and preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      log.warn("User profile not found for plan regeneration", undefined, {
        userId,
        planId,
        errorCode: profileError?.code
      })
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    log.info("User profile loaded for regeneration", undefined, {
      userId,
      experienceLevel: profile.experience_level,
      availableEquipment: profile.available_equipment?.length || 0,
      weeklyWorkoutGoal: profile.weekly_workout_goal
    })

    // 2. Fetch current plan with all workouts and exercises
    const { data: currentPlan, error: planError } = await supabase
      .from('user_workout_plans')
      .select(`
        *,
        plan_workouts (
          *,
          plan_exercises (
            *,
            exercise:exercise_library (
              id,
              name,
              category,
              exercise_type,
              primary_muscles,
              difficulty
            )
          )
        )
      `)
      .eq('id', planId)
      .eq('user_id', userId)
      .single()

    if (planError || !currentPlan) {
      log.warn("Workout plan not found for regeneration", undefined, {
        userId,
        planId,
        errorCode: planError?.code
      })
      return NextResponse.json(
        { error: 'Workout plan not found' },
        { status: 404 }
      )
    }

    // 2. Fetch workout logs for analysis period
    const analysisStartDate = new Date()
    analysisStartDate.setDate(analysisStartDate.getDate() - (weeksToAnalyze * 7))
    const currentDate = new Date()

    const { data: currentWeekLogs } = await supabase
      .from('workout_logs')
      .select(`
        *,
        exercise_logs (*)
      `)
      .eq('user_id', userId)
      .gte('workout_date', analysisStartDate.toISOString().split('T')[0])
      .lte('workout_date', currentDate.toISOString().split('T')[0])
      .eq('status', 'completed')

    // 3. Fetch previous period logs for comparison
    const previousStartDate = new Date(analysisStartDate)
    previousStartDate.setDate(previousStartDate.getDate() - (weeksToAnalyze * 7))

    const { data: previousWeekLogs } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('workout_date', previousStartDate.toISOString().split('T')[0])
      .lt('workout_date', analysisStartDate.toISOString().split('T')[0])
      .eq('status', 'completed')

    if (!currentWeekLogs || currentWeekLogs.length === 0) {
      log.warn("Insufficient workout data for plan regeneration", undefined, {
        userId,
        planId,
        weeksToAnalyze
      })
      return NextResponse.json(
        {
          error: 'Insufficient data',
          message: 'No workout logs found for the analysis period. Complete at least one workout before regenerating your plan.'
        },
        { status: 400 }
      )
    }

    // 4. Analyze performance
    const plannedWorkoutsCount = currentPlan.workouts_per_week * weeksToAnalyze
    const performanceMetrics = analyzePerformance(
      currentWeekLogs,
      previousWeekLogs || [],
      plannedWorkoutsCount
    )

    // 5. Organize exercise logs by exercise ID
    const exerciseLogsByExercise = new Map<string, any[]>()
    currentWeekLogs.forEach(workoutLog => {
      workoutLog.exercise_logs?.forEach((exerciseLog: any) => {
        const exerciseId = exerciseLog.exercise_id
        if (!exerciseLogsByExercise.has(exerciseId)) {
          exerciseLogsByExercise.set(exerciseId, [])
        }
        exerciseLogsByExercise.get(exerciseId)!.push(exerciseLog)
      })
    })

    // 6. Get progression recommendation
    const globalRecommendation = determineProgressionRecommendation(performanceMetrics)

    let regeneratedWorkouts
    let validation

    // 7. If training style is provided, fetch new exercises and regenerate with new modality
    if (trainingStyle) {
      log.info("Regenerating plan with new training style", undefined, {
        userId,
        planId,
        trainingStyle
      })

      // Fetch exercises for the new training modality
      const { data: allExercises, error: exercisesError } = await supabase
        .from('exercise_library')
        .select('id, name, category, equipment, difficulty, primary_muscles, training_modality, recommended_sets_min, recommended_sets_max, recommended_reps_min, recommended_reps_max, recommended_rest_seconds_min, recommended_rest_seconds_max')
        .eq('is_active', true)
        .eq('training_modality', trainingStyle)

      if (exercisesError || !allExercises || allExercises.length === 0) {
        log.error('Failed to fetch exercises for new training style', new Error(exercisesError?.message || 'No exercises found'), undefined, {
          userId,
          trainingStyle,
          errorCode: exercisesError?.code
        })
        return NextResponse.json(
          { error: 'Failed to fetch exercises for the selected training style' },
          { status: 500 }
        )
      }

      // Filter exercises based on user's available equipment
      const availableEquipment = profile.available_equipment || []
      // Normalize equipment names to lowercase for case-insensitive matching
      const normalizedAvailableEquipment = availableEquipment.map(eq => eq.toLowerCase())

      const newExercises = allExercises.filter(ex => {
        if (!ex.equipment || ex.equipment.length === 0) return true // Bodyweight exercises always available
        // Normalize exercise equipment to lowercase and check if any matches
        return ex.equipment.some((eq: string) => normalizedAvailableEquipment.includes(eq.toLowerCase()))
      })

      log.info("Exercises filtered by available equipment", undefined, {
        userId,
        trainingStyle,
        availableEquipment,
        normalizedEquipment: normalizedAvailableEquipment,
        totalExercises: allExercises.length,
        filteredExercises: newExercises.length
      })

      if (newExercises.length === 0) {
        log.warn("No exercises available after equipment filtering", undefined, {
          userId,
          trainingStyle,
          availableEquipment
        })
        return NextResponse.json(
          { error: 'No exercises available with your current equipment selection. Please update your available equipment in your profile.' },
          { status: 400 }
        )
      }

      // Map new exercises to the existing plan structure with modality-specific recommendations
      regeneratedWorkouts = currentPlan.plan_workouts.map((workout: any) => {
        // Get exercises appropriate for this workout type
        const workoutExercises = workout.plan_exercises.map((planExercise: any, index: number) => {
          // Find a similar exercise from the new modality
          const targetMuscles = planExercise.exercise?.primary_muscles || []
          const matchingExercise = newExercises.find(ex =>
            ex.primary_muscles?.some((muscle: string) => targetMuscles.includes(muscle))
          ) || newExercises[index % newExercises.length]

          return {
            exercise_id: matchingExercise.id,
            target_sets: matchingExercise.recommended_sets_min || planExercise.target_sets,
            target_reps_min: matchingExercise.recommended_reps_min || planExercise.target_reps_min,
            target_reps_max: matchingExercise.recommended_reps_max || planExercise.target_reps_max,
            target_weight_lbs: planExercise.target_weight_lbs,
            rest_seconds: matchingExercise.recommended_rest_seconds_min || planExercise.rest_seconds,
            exercise_order: index,
            progression_notes: `Switched to ${trainingStyle} training modality`
          }
        })

        return {
          workout_name: workout.workout_name,
          workout_type: workout.workout_type,
          day_of_week: workout.day_of_week,
          estimated_duration_minutes: workout.estimated_duration_minutes,
          target_volume_sets: workout.target_volume_sets,
          exercises: workoutExercises
        }
      })

      validation = { isValid: true, errors: [], warnings: [] }
    } else {
      // 8. Regenerate workout plan with progressive overload
      regeneratedWorkouts = regenerateWorkoutPlan(
        currentPlan,
        performanceMetrics,
        exerciseLogsByExercise
      )

      // 9. Apply progressive overload safety rules
      regeneratedWorkouts = applyProgressiveOverloadRules(regeneratedWorkouts, currentPlan)

      // 10. Validate regenerated plan
      validation = validateRegeneratedPlan(regeneratedWorkouts)
    }

    // 10. Generate full cycle if requested
    let cyclePlan = null
    if (generateFullCycle) {
      cyclePlan = generateCyclePlan(regeneratedWorkouts, performanceMetrics)
    }

    // 11. Create new workout plan in database
    const nextWeek = (currentPlan.mesocycle_week || 1) + 1
    const isNewCycle = nextWeek > (currentPlan.weeks_duration || 4)

    // Deactivate current plan
    await supabase
      .from('user_workout_plans')
      .update({ status: 'completed' })
      .eq('id', planId)

    // Create new plan
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + ((currentPlan.weeks_duration || 4) * 7))

    const { data: newPlan, error: newPlanError } = await supabase
      .from('user_workout_plans')
      .insert({
        user_id: userId,
        plan_name: isNewCycle
          ? `${currentPlan.plan_name} - Cycle ${Math.floor(nextWeek / (currentPlan.weeks_duration || 4)) + 1}`
          : currentPlan.plan_name,
        plan_type: currentPlan.plan_type,
        weeks_duration: currentPlan.weeks_duration || 4,
        days_per_week: currentPlan.days_per_week,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        split_pattern: currentPlan.split_pattern,
        mesocycle_week: isNewCycle ? 1 : nextWeek,
        status: 'active',
        ai_model_version: currentPlan.ai_model_version,
        generation_prompt: `Regenerated based on performance: ${globalRecommendation.recommendedReason}`,
        previous_plan_id: planId
      })
      .select()
      .single()

    if (newPlanError) {
      log.error('Error creating new plan', new Error(newPlanError.message), undefined, {
        userId,
        planId,
        errorCode: newPlanError.code
      })
      return NextResponse.json(
        { error: 'Failed to create new plan', details: newPlanError.message },
        { status: 500 }
      )
    }

    // 12. Insert workouts and exercises
    for (const workout of regeneratedWorkouts) {
      const { data: newWorkout, error: workoutError } = await supabase
        .from('plan_workouts')
        .insert({
          plan_id: newPlan.id,
          workout_name: workout.workout_name,
          workout_type: workout.workout_type,
          day_of_week: workout.day_of_week,
          estimated_duration_minutes: workout.estimated_duration_minutes,
          target_volume_sets: workout.target_volume_sets
        })
        .select()
        .single()

      if (workoutError) {
        log.error('Error creating workout', new Error(workoutError.message), undefined, {
          userId,
          planId: newPlan.id,
          workoutName: workout.workout_name,
          errorCode: workoutError.code
        })
        continue
      }

      // Insert exercises for this workout
      const exercisesToInsert = workout.exercises.map((exercise: any) => ({
        plan_workout_id: newWorkout.id,
        exercise_id: exercise.exercise_id,
        target_sets: exercise.target_sets,
        target_reps_min: exercise.target_reps_min,
        target_reps_max: exercise.target_reps_max,
        target_weight_lbs: exercise.target_weight_lbs,
        rest_seconds: exercise.rest_seconds,
        order_index: exercise.order_index,
        notes: exercise.progression_notes
      }))

      await supabase
        .from('plan_exercises')
        .insert(exercisesToInsert)
    }

    // 13. Log success and return comprehensive response
    log.info("Workout plan regenerated successfully", undefined, {
      userId,
      oldPlanId: planId,
      newPlanId: newPlan.id,
      isNewCycle,
      week: isNewCycle ? 1 : nextWeek,
      totalWorkouts: regeneratedWorkouts.length,
      recommendedAction: globalRecommendation.action
    })

    return NextResponse.json({
      success: true,
      planId: newPlan.id,
      isNewCycle,
      week: isNewCycle ? 1 : nextWeek,
      performanceAnalysis: {
        metrics: performanceMetrics,
        recommendation: globalRecommendation
      },
      regeneratedPlan: {
        workouts: regeneratedWorkouts,
        totalSets: regeneratedWorkouts.reduce((sum: number, w: any) => sum + w.target_volume_sets, 0),
        estimatedWeeklyDuration: regeneratedWorkouts.reduce((sum: number, w: any) => sum + w.estimated_duration_minutes, 0)
      },
      validation,
      cyclePlan: cyclePlan ? {
        week1Volume: cyclePlan.week1.reduce((sum: number, w: any) => sum + w.target_volume_sets, 0),
        week2Volume: cyclePlan.week2.reduce((sum: number, w: any) => sum + w.target_volume_sets, 0),
        week3Volume: cyclePlan.week3.reduce((sum: number, w: any) => sum + w.target_volume_sets, 0),
        week4Volume: cyclePlan.week4.reduce((sum: number, w: any) => sum + w.target_volume_sets, 0)
      } : null,
      message: `Plan regenerated successfully for ${isNewCycle ? 'new cycle' : `week ${nextWeek}`}. ${globalRecommendation.recommendedReason}`
    })

  } catch (error: any) {
    log.error('Error regenerating plan', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to regenerate plan',
        details: error.message
      },
      { status: 500 }
    )
  }
}
