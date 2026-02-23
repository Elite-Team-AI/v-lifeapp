import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import {
  analyzePerformance,
  determineProgressionRecommendation,
  calculateExerciseProgression
} from '@/lib/performance-analyzer'
import { createApiLogger } from '@/lib/utils/logger'
import { weeklyAdjustmentsSchema, validateQueryParams } from '@/lib/validations/api'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Get weekly adjustment recommendations without regenerating plan
 *
 * GET /api/workouts/weekly-adjustments?userId=xxx&planId=xxx
 *
 * Query Parameters:
 * - userId: string (required)
 * - planId: string (required)
 * - weeks: number (optional) - Number of weeks to analyze (default: 1)
 */
export async function GET(request: NextRequest) {
  const log = createApiLogger(request)

  try {
    const searchParams = request.nextUrl.searchParams

    // Validate query parameters
    const params = validateQueryParams(weeklyAdjustmentsSchema, searchParams)
    const { userId, planId, weeks } = params

    log.info("Calculating weekly workout adjustments", undefined, {
      userId,
      planId,
      weeks
    })

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Fetch current plan
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
              category
            )
          )
        )
      `)
      .eq('id', planId)
      .eq('user_id', userId)
      .single()

    if (planError || !currentPlan) {
      log.warn("Workout plan not found for weekly adjustments", undefined, {
        userId,
        planId,
        errorCode: planError?.code
      })
      return NextResponse.json(
        { error: 'Workout plan not found' },
        { status: 404 }
      )
    }

    // Fetch workout logs for current period
    const currentDate = new Date()
    const analysisStartDate = new Date()
    analysisStartDate.setDate(analysisStartDate.getDate() - (weeks * 7))

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

    // Fetch previous period for comparison
    const previousStartDate = new Date(analysisStartDate)
    previousStartDate.setDate(previousStartDate.getDate() - (weeks * 7))

    const { data: previousWeekLogs } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('workout_date', previousStartDate.toISOString().split('T')[0])
      .lt('workout_date', analysisStartDate.toISOString().split('T')[0])
      .eq('status', 'completed')

    if (!currentWeekLogs || currentWeekLogs.length === 0) {
      log.info("Insufficient workout data for weekly adjustments", undefined, {
        userId,
        planId,
        weeks
      })
      return NextResponse.json({
        success: true,
        hasData: false,
        message: 'No workout data available for analysis yet.',
        recommendation: {
          action: 'maintain',
          reason: 'Insufficient data. Complete your workouts as planned.'
        }
      })
    }

    // Analyze performance
    const plannedWorkoutsCount = currentPlan.workouts_per_week * weeks
    const performanceMetrics = analyzePerformance(
      currentWeekLogs,
      previousWeekLogs || [],
      plannedWorkoutsCount
    )

    const globalRecommendation = determineProgressionRecommendation(performanceMetrics)

    // Organize exercise logs
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

    // Calculate exercise-specific recommendations
    const exerciseRecommendations: any[] = []
    currentPlan.plan_workouts.forEach((workout: any) => {
      workout.plan_exercises?.forEach((planExercise: any) => {
        const exerciseLogs = exerciseLogsByExercise.get(planExercise.exercise_id) || []
        if (exerciseLogs.length > 0) {
          const progression = calculateExerciseProgression(
            exerciseLogs,
            planExercise,
            globalRecommendation
          )

          exerciseRecommendations.push({
            exerciseId: planExercise.exercise_id,
            exerciseName: planExercise.exercise?.name,
            workoutName: workout.workout_name,
            currentSets: planExercise.target_sets,
            currentReps: `${planExercise.target_reps_min}-${planExercise.target_reps_max}`,
            recommendedSets: planExercise.target_sets + progression.setsAdjustment,
            recommendedReps: `${planExercise.target_reps_min + progression.repsAdjustment}-${planExercise.target_reps_max + progression.repsAdjustment}`,
            weightAdjustment: progression.weightAdjustment,
            completionRate: exerciseLogs.length > 0
              ? (exerciseLogs.reduce((sum, log) => sum + log.sets_completed, 0) / exerciseLogs.length / planExercise.target_sets) * 100
              : 0,
            avgRPE: exerciseLogs.filter(log => log.avg_rpe).length > 0
              ? exerciseLogs.reduce((sum, log) => sum + (log.avg_rpe || 0), 0) / exerciseLogs.filter(log => log.avg_rpe).length
              : null,
            notes: progression.recommendation.recommendedReason
          })
        }
      })
    })

    // Calculate summary statistics
    const totalWorkoutsCompleted = currentWeekLogs.length
    const totalSetsCompleted = currentWeekLogs.reduce((sum, log) => sum + (log.total_sets_completed || 0), 0)
    const totalVolumeCompleted = currentWeekLogs.reduce((sum, log) => sum + (log.total_volume_lbs || 0), 0)
    const avgDuration = totalWorkoutsCompleted > 0
      ? currentWeekLogs.reduce((sum, log) => sum + (log.actual_duration_minutes || 0), 0) / totalWorkoutsCompleted
      : 0

    log.info("Weekly adjustments calculated successfully", undefined, {
      userId,
      planId,
      weeks,
      workoutsCompleted: totalWorkoutsCompleted,
      completionRate: performanceMetrics.completionRate,
      recommendedAction: globalRecommendation.action,
      exerciseRecommendations: exerciseRecommendations.length
    })

    return NextResponse.json({
      success: true,
      hasData: true,
      period: {
        startDate: analysisStartDate.toISOString().split('T')[0],
        endDate: currentDate.toISOString().split('T')[0],
        weeks
      },
      summary: {
        workoutsCompleted: totalWorkoutsCompleted,
        workoutsPlanned: plannedWorkoutsCount,
        completionRate: performanceMetrics.completionRate,
        totalSets: totalSetsCompleted,
        totalVolume: totalVolumeCompleted,
        avgDuration: Math.round(avgDuration),
        avgRPE: performanceMetrics.rpeAverage
      },
      performanceScores: {
        completion: performanceMetrics.completionRate,
        consistency: performanceMetrics.consistencyScore,
        readiness: performanceMetrics.readinessScore,
        recovery: performanceMetrics.recoveryScore
      },
      globalRecommendation: {
        action: globalRecommendation.action,
        volumeAdjustment: globalRecommendation.volumeAdjustment,
        intensityAdjustment: globalRecommendation.intensityAdjustment,
        reason: globalRecommendation.recommendedReason,
        confidence: globalRecommendation.confidence
      },
      exerciseRecommendations: exerciseRecommendations.sort((a, b) => {
        // Sort by exercises that need the most adjustment
        const aAdjustment = Math.abs(a.setsAdjustment || 0) + Math.abs(a.weightAdjustment || 0)
        const bAdjustment = Math.abs(b.setsAdjustment || 0) + Math.abs(b.weightAdjustment || 0)
        return bAdjustment - aAdjustment
      }),
      nextSteps: generateNextSteps(globalRecommendation, performanceMetrics, currentPlan)
    })

  } catch (error: any) {
    log.error('Error calculating weekly adjustments', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to calculate adjustments',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * Generate actionable next steps based on recommendations
 */
function generateNextSteps(
  recommendation: any,
  metrics: any,
  plan: any
): string[] {
  const steps: string[] = []

  // Based on recommendation action
  switch (recommendation.action) {
    case 'increase':
      steps.push('🎯 You\'re ready to progress! Increase weights by 2.5-5% on key exercises.')
      steps.push('📈 Add 1-2 additional sets to exercises you\'re completing easily.')
      steps.push('💪 Maintain good form as you increase load.')
      break

    case 'maintain':
      steps.push('✅ Keep doing what you\'re doing! Consistency is key.')
      steps.push('🎯 Focus on improving technique and mind-muscle connection.')
      steps.push('📊 Track your RPE to ensure you\'re training at appropriate intensity.')
      break

    case 'decrease':
      steps.push('⚠️ Time to reduce volume slightly to prevent overtraining.')
      steps.push('😴 Prioritize sleep and recovery this week.')
      steps.push('🍽️ Ensure adequate nutrition to support recovery.')
      break

    case 'deload':
      steps.push('🛑 Deload week! Reduce weight by 15-20% and sets by 30%.')
      steps.push('😴 Focus on recovery: sleep, nutrition, and stress management.')
      steps.push('🧘 Consider active recovery: yoga, walking, or light cardio.')
      steps.push('📅 Plan to return to regular training next week feeling refreshed.')
      break
  }

  // Based on consistency score
  if (metrics.consistencyScore < 60) {
    steps.push('📅 Work on consistency: aim to complete all planned workouts.')
    steps.push('⏰ Schedule workouts in your calendar to improve adherence.')
  }

  // Based on readiness score
  if (metrics.readinessScore < 50) {
    steps.push('😴 Your body may need more recovery. Prioritize sleep quality.')
    steps.push('🥗 Review your nutrition and hydration habits.')
  }

  // Week progression
  if (plan.current_week >= plan.duration_weeks) {
    steps.push('🎊 You\'ve completed a training cycle! Consider regenerating your plan.')
    steps.push('📊 Review your progress and set new goals for the next cycle.')
  }

  return steps
}
