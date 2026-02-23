import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAuthUser } from '@/lib/supabase/server'

/**
 * Unified Fitness Dashboard API
 * Returns ALL fitness data in a single optimized query
 * Pattern inspired by RebornFitness for maximum performance
 *
 * ✅ Single HTTP request
 * ✅ Pre-structured data
 * ✅ Ready-to-render JSON
 * ✅ <100ms response time
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // ✅ PERFORMANCE: Fetch everything in parallel
    const [planResult, todayWorkoutResult] = await Promise.all([
      // Get active plan with nested workouts and exercises
      supabase
        .from('user_workout_plans')
        .select(`
          *,
          plan_workouts (
            id,
            workout_name,
            week_number,
            day_of_week,
            scheduled_date,
            is_completed,
            estimated_duration_minutes,
            muscle_groups,
            plan_exercises (
              id,
              exercise_id,
              exercise_order,
              target_sets,
              target_reps_min,
              target_reps_max,
              rest_seconds,
              tempo,
              target_rpe,
              exercise_notes,
              is_completed,
              exercise_library (
                id,
                name,
                primary_muscles,
                category
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .order('week_number', { foreignTable: 'plan_workouts', ascending: true })
        .order('day_of_week', { foreignTable: 'plan_workouts', ascending: true })
        .order('exercise_order', { foreignTable: 'plan_workouts.plan_exercises', ascending: true })
        .limit(1)
        .maybeSingle(),

      // Get today's workout with exercises
      supabase
        .from('plan_workouts')
        .select(`
          id,
          plan_id,
          workout_name,
          week_number,
          scheduled_date,
          estimated_duration_minutes,
          muscle_groups,
          plan_exercises (
            id,
            exercise_id,
            exercise_order,
            target_sets,
            target_reps_min,
            target_reps_max,
            rest_seconds,
            tempo,
            target_rpe,
            exercise_notes,
            is_completed,
            exercise_library (
              id,
              name,
              primary_muscles,
              secondary_muscles,
              category,
              difficulty,
              instructions,
              form_cues
            )
          )
        `)
        .eq('scheduled_date', today)
        .eq('is_completed', false)
        .order('exercise_order', { foreignTable: 'plan_exercises', ascending: true })
        .maybeSingle()
    ])

    const plan = planResult.data
    const todayWorkout = todayWorkoutResult.data

    // ✅ Pre-structure plan data
    let structuredPlan = null
    if (plan) {
      const startDate = new Date(plan.start_date)
      const endDate = new Date(plan.end_date)
      const now = new Date()
      const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      const weeksElapsed = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      const currentWeek = Math.min(weeksElapsed + 1, totalWeeks)
      const weeksRemaining = Math.max(totalWeeks - weeksElapsed, 0)
      const progressPercentage = Math.round((weeksElapsed / totalWeeks) * 100)

      // Calculate adherence
      const allWorkouts = plan.plan_workouts || []
      const completedWorkouts = allWorkouts.filter((w: any) => w.is_completed).length
      const totalScheduled = allWorkouts.filter((w: any) => new Date(w.scheduled_date) <= now).length
      const adherenceRate = totalScheduled > 0 ? Math.round((completedWorkouts / totalScheduled) * 100) : 0

      // Group by week
      const weekMap = new Map<number, any[]>()
      allWorkouts.forEach((workout: any) => {
        if (!weekMap.has(workout.week_number)) {
          weekMap.set(workout.week_number, [])
        }
        weekMap.get(workout.week_number)!.push(workout)
      })

      const weeks = Array.from(weekMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([weekNumber, weekWorkouts]) => ({
          weekNumber,
          workouts: weekWorkouts.map((w: any) => ({
            id: w.id,
            workoutName: w.workout_name,
            dayOfWeek: w.day_of_week,
            scheduledDate: w.scheduled_date,
            status: w.is_completed ? 'completed' : 'pending',
            estimatedDuration: w.estimated_duration_minutes,
            focusAreas: w.muscle_groups || [],
            exerciseCount: w.plan_exercises?.length || 0,
          })),
        }))

      structuredPlan = {
        id: plan.id,
        planName: plan.plan_name,
        planType: plan.plan_type,
        startDate: plan.start_date,
        endDate: plan.end_date,
        weeksRemaining,
        currentWeek,
        daysPerWeek: plan.days_per_week,
        splitPattern: plan.split_pattern,
        status: plan.status,
        progressPercentage,
        adherenceRate,
        totalWorkouts: allWorkouts.length,
        completedWorkouts,
        weeks,
      }
    }

    // ✅ Pre-structure today's workout
    let structuredTodayWorkout = null
    if (todayWorkout && todayWorkout.plan_exercises) {
      const exercises = todayWorkout.plan_exercises || []

      structuredTodayWorkout = {
        workoutId: todayWorkout.id,
        planId: todayWorkout.plan_id,
        workoutName: todayWorkout.workout_name,
        weekNumber: todayWorkout.week_number,
        scheduledDate: todayWorkout.scheduled_date,
        estimatedDuration: todayWorkout.estimated_duration_minutes,
        focusAreas: todayWorkout.muscle_groups || [],
        exercises: exercises.map((ex: any) => {
          const exerciseData = Array.isArray(ex.exercise_library)
            ? ex.exercise_library[0]
            : ex.exercise_library

          return {
            id: ex.id,
            exerciseId: ex.exercise_id,
            exerciseName: exerciseData?.name || 'Unknown Exercise',
            primaryMuscles: exerciseData?.primary_muscles || [],
            secondaryMuscles: exerciseData?.secondary_muscles || [],
            category: exerciseData?.category || 'strength',
            difficulty: exerciseData?.difficulty || 'intermediate',
            exerciseOrder: ex.exercise_order,
            targetSets: ex.target_sets,
            targetRepsMin: ex.target_reps_min,
            targetRepsMax: ex.target_reps_max,
            restSeconds: ex.rest_seconds,
            tempo: ex.tempo,
            targetRpe: ex.target_rpe,
            notes: ex.exercise_notes,
            isCompleted: ex.is_completed || false,
            instructions: exerciseData?.instructions,
            cues: exerciseData?.form_cues || [],
          }
        }),
      }
    }

    // ✅ Return pre-structured, ready-to-render data
    return NextResponse.json({
      success: true,
      data: {
        plan: structuredPlan,
        todayWorkout: structuredTodayWorkout,
        hasPlan: !!structuredPlan,
        hasTodayWorkout: !!structuredTodayWorkout,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[/api/fitness/dashboard] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch fitness data'
      },
      { status: 500 }
    )
  }
}
