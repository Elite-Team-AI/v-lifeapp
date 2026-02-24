import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/workouts/logs/[logId]
 * Fetch detailed workout log with all exercise data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ logId: string }> }
) {
  try {
    const { logId } = await params

    if (!logId) {
      return NextResponse.json(
        { error: 'logId is required' },
        { status: 400 }
      )
    }

    // Create service role client to bypass RLS for read performance
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Fetch workout log with plan workout details
    const { data: workoutLog, error: logError } = await supabase
      .from('workout_logs')
      .select(`
        id,
        user_id,
        plan_id,
        workout_id,
        workout_date,
        started_at,
        completed_at,
        actual_duration_minutes,
        perceived_difficulty,
        energy_level,
        enjoyment_rating,
        exercises_planned,
        exercises_completed,
        exercises_skipped,
        exercises_modified,
        total_volume_lbs,
        total_reps,
        total_sets,
        total_distance_miles,
        avg_heart_rate,
        max_heart_rate,
        calories_burned,
        completion_status,
        notes,
        felt_good,
        want_more_like_this,
        sleep_quality,
        stress_today,
        plan_workouts (
          id,
          workout_name,
          workout_type,
          muscle_groups,
          estimated_duration_minutes
        )
      `)
      .eq('id', logId)
      .single()

    if (logError) {
      console.error('Error fetching workout log:', logError)
      return NextResponse.json(
        { error: 'Failed to fetch workout log', details: logError.message },
        { status: 500 }
      )
    }

    if (!workoutLog) {
      return NextResponse.json(
        { error: 'Workout log not found' },
        { status: 404 }
      )
    }

    // Fetch exercise logs for this workout
    const { data: exerciseLogs, error: exercisesError } = await supabase
      .from('exercise_logs')
      .select(`
        id,
        exercise_id,
        exercise_type,
        sets_planned,
        sets_completed,
        set_data,
        total_reps,
        total_volume_lbs,
        avg_weight_lbs,
        max_weight_lbs,
        avg_reps,
        max_reps,
        distance_miles,
        duration_seconds,
        avg_pace_min_per_mile,
        calories_burned,
        avg_heart_rate,
        max_heart_rate,
        notes,
        rpe,
        form_quality,
        exercise_library (
          id,
          name,
          category,
          exercise_type,
          primary_muscles,
          equipment,
          difficulty
        )
      `)
      .eq('workout_log_id', logId)
      .order('id', { ascending: true })

    if (exercisesError) {
      console.error('Error fetching exercise logs:', exercisesError)
      return NextResponse.json(
        { error: 'Failed to fetch exercise logs', details: exercisesError.message },
        { status: 500 }
      )
    }

    // Transform data for frontend
    const transformedLog = {
      id: workoutLog.id,
      workoutName: workoutLog.plan_workouts?.workout_name || 'Workout',
      workoutType: workoutLog.plan_workouts?.workout_type,
      muscleGroups: workoutLog.plan_workouts?.muscle_groups || [],
      workoutDate: workoutLog.workout_date,
      startedAt: workoutLog.started_at,
      completedAt: workoutLog.completed_at,
      duration: workoutLog.actual_duration_minutes,
      estimatedDuration: workoutLog.plan_workouts?.estimated_duration_minutes,

      // Performance metrics
      perceivedDifficulty: workoutLog.perceived_difficulty,
      energyLevel: workoutLog.energy_level,
      enjoymentRating: workoutLog.enjoyment_rating,

      // Completion stats
      exercisesPlanned: workoutLog.exercises_planned,
      exercisesCompleted: workoutLog.exercises_completed,
      exercisesSkipped: workoutLog.exercises_skipped,
      exercisesModified: workoutLog.exercises_modified,

      // Volume metrics
      totalVolumeLbs: workoutLog.total_volume_lbs,
      totalReps: workoutLog.total_reps,
      totalSets: workoutLog.total_sets,

      // Cardio metrics
      totalDistanceMiles: workoutLog.total_distance_miles,
      avgHeartRate: workoutLog.avg_heart_rate,
      maxHeartRate: workoutLog.max_heart_rate,
      caloriesBurned: workoutLog.calories_burned,

      // Status and feedback
      completionStatus: workoutLog.completion_status,
      notes: workoutLog.notes,
      feltGood: workoutLog.felt_good,
      wantMoreLikeThis: workoutLog.want_more_like_this,

      // Environmental factors
      sleepQuality: workoutLog.sleep_quality,
      stressToday: workoutLog.stress_today,

      // Exercise details
      exercises: exerciseLogs?.map(ex => ({
        id: ex.id,
        exerciseName: ex.exercise_library?.name || 'Exercise',
        exerciseCategory: ex.exercise_library?.category,
        exerciseType: ex.exercise_type,
        primaryMuscles: ex.exercise_library?.primary_muscles || [],
        equipment: ex.exercise_library?.equipment || [],
        difficulty: ex.exercise_library?.difficulty,

        // Set data
        setsPlanned: ex.sets_planned,
        setsCompleted: ex.sets_completed,
        setData: ex.set_data, // Array of {weight, reps, rpe, completed}

        // Aggregated metrics
        totalReps: ex.total_reps,
        totalVolumeLbs: ex.total_volume_lbs,
        avgWeightLbs: ex.avg_weight_lbs,
        maxWeightLbs: ex.max_weight_lbs,
        avgReps: ex.avg_reps,
        maxReps: ex.max_reps,

        // Cardio metrics
        distanceMiles: ex.distance_miles,
        durationSeconds: ex.duration_seconds,
        avgPaceMinPerMile: ex.avg_pace_min_per_mile,
        caloriesBurned: ex.calories_burned,
        avgHeartRate: ex.avg_heart_rate,
        maxHeartRate: ex.max_heart_rate,

        // Performance feedback
        notes: ex.notes,
        rpe: ex.rpe,
        formQuality: ex.form_quality
      })) || []
    }

    return NextResponse.json({
      success: true,
      workoutLog: transformedLog
    })

  } catch (error) {
    console.error('Error in GET /api/workouts/logs/[logId]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
