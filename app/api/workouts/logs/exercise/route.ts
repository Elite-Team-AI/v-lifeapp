import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createApiLogger } from '@/lib/logger'
import { exerciseLogSchema, safeValidate } from '@/lib/api-validation'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Log an exercise during a workout session
 *
 * POST /api/workouts/logs/exercise
 *
 * Body:
 * - userId: string (required)
 * - workoutLogId: string (required)
 * - exerciseId: string (required)
 * - exerciseType: 'strength' | 'cardio' | 'flexibility' | 'bodyweight' | 'plyometric' | 'swimming' | 'sports'
 * - planExerciseId?: string (optional - links to planned exercise)
 *
 * STRENGTH DATA:
 * - sets: Array<{ reps: number, weight: number, rpe?: number }>
 *
 * CARDIO DATA:
 * - durationSeconds: number
 * - distanceMiles?: number
 * - avgHeartRate?: number
 * - caloriesBurned?: number
 *
 * SWIMMING DATA:
 * - swimStroke: string
 * - lapsCompleted: number
 * - poolLengthMeters?: number
 * - pacePer100mSeconds?: number
 *
 * FLEXIBILITY DATA:
 * - durationSeconds: number
 * - holdTimeSeconds?: number
 * - stretchIntensity?: number (1-10)
 *
 * COMMON:
 * - notes?: string
 * - formQuality?: number (1-5)
 * - difficultyAdjustment?: 'easier' | 'same' | 'harder'
 */
export async function POST(request: NextRequest) {
  const log = createApiLogger(request)

  try {
    const body = await request.json()

    // Validate request body
    const validation = safeValidate(exerciseLogSchema, body)
    if (!validation.success) {
      log.warn("Exercise logging request validation failed", undefined, {
        errors: validation.details.issues
      })
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.details.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    const {
      userId,
      workoutLogId,
      exerciseId,
      exerciseType,
      planExerciseId,
      // Strength
      sets,
      // Cardio
      durationSeconds,
      distanceMiles,
      avgHeartRate,
      caloriesBurned,
      pacePerMileSeconds,
      // Swimming
      swimStroke,
      lapsCompleted,
      poolLengthMeters,
      pacePer100mSeconds,
      // Flexibility
      holdTimeSeconds,
      stretchIntensity,
      // Common
      notes,
      formQuality,
      difficultyAdjustment,
      perceivedExertion
    } = validation.data

    log.info("Logging exercise", undefined, {
      userId,
      workoutLogId,
      exerciseId,
      exerciseType
    })

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify workout log exists and is in progress
    const { data: workoutLog, error: logError } = await supabase
      .from('workout_logs')
      .select('id, completion_status, user_id')
      .eq('id', workoutLogId)
      .eq('user_id', userId)
      .single()

    if (logError || !workoutLog) {
      log.warn("Workout log not found for exercise logging", undefined, {
        userId,
        workoutLogId,
        errorCode: logError?.code
      })
      return NextResponse.json(
        { error: 'Workout log not found' },
        { status: 404 }
      )
    }

    if (workoutLog.completion_status !== 'in_progress') {
      log.warn("Workout is not in progress", undefined, {
        userId,
        workoutLogId,
        status: workoutLog.completion_status
      })
      return NextResponse.json(
        { error: 'Workout is not in progress' },
        { status: 400 }
      )
    }

    // Prepare exercise log data based on type
    const exerciseLogData: any = {
      workout_log_id: workoutLogId,
      exercise_id: exerciseId,
      plan_exercise_id: planExerciseId || null,
      exercise_type: exerciseType,
      form_quality: formQuality || null,
      difficulty_adjustment: difficultyAdjustment || null,
      notes: notes || null
    }

    // Add type-specific data
    if (exerciseType === 'strength' || exerciseType === 'bodyweight' || exerciseType === 'plyometric') {
      if (!sets || !Array.isArray(sets) || sets.length === 0) {
        return NextResponse.json(
          { error: 'Sets data is required for strength exercises' },
          { status: 400 }
        )
      }

      // Store set data as arrays (matching original schema design)
      exerciseLogData.reps_per_set = sets.map(s => s.reps)
      exerciseLogData.weight_per_set = sets.map(s => s.weight || 0)
      exerciseLogData.rpe_per_set = sets.map(s => s.rpe || null)

      // Calculate sets completed
      exerciseLogData.sets_completed = sets.length
    }

    if (exerciseType === 'cardio') {
      if (!durationSeconds) {
        return NextResponse.json(
          { error: 'Duration is required for cardio exercises' },
          { status: 400 }
        )
      }

      exerciseLogData.duration_seconds = durationSeconds
      exerciseLogData.distance_miles = distanceMiles || null
      exerciseLogData.pace_per_mile_seconds = pacePerMileSeconds || null
      exerciseLogData.avg_heart_rate = avgHeartRate || null
      exerciseLogData.max_heart_rate = null // Could be added later
    }

    if (exerciseType === 'swimming') {
      if (!swimStroke || !lapsCompleted) {
        return NextResponse.json(
          { error: 'Swim stroke and laps completed are required for swimming exercises' },
          { status: 400 }
        )
      }

      exerciseLogData.swim_stroke = swimStroke
      exerciseLogData.laps_completed = lapsCompleted
      exerciseLogData.pool_length_meters = poolLengthMeters || 25 // Default to 25m

      // Calculate total distance
      if (poolLengthMeters) {
        exerciseLogData.distance_miles = (lapsCompleted * poolLengthMeters) / 1609.34 // Convert to miles
      }
    }

    if (exerciseType === 'flexibility') {
      if (!durationSeconds) {
        return NextResponse.json(
          { error: 'Duration is required for flexibility exercises' },
          { status: 400 }
        )
      }

      exerciseLogData.duration_seconds = durationSeconds
      // Note: Original schema uses hold_duration_seconds[] and holds_per_position[] arrays
      // Simple hold_time_seconds and stretch_intensity columns don't exist in current schema
    }

    // Add perceived exertion if provided
    if (perceivedExertion) {
      exerciseLogData.perceived_exertion = perceivedExertion
    }

    // Insert exercise log
    // Note: JavaScript arrays are automatically converted to PostgreSQL arrays
    // because the table now uses native array types (INTEGER[], NUMERIC[])
    const { data: exerciseLog, error: exerciseError } = await supabase
      .from('exercise_logs')
      .insert(exerciseLogData)
      .select()
      .single()

    if (exerciseError) {
      log.error('Error logging exercise', new Error(exerciseError.message), undefined, {
        userId,
        workoutLogId,
        exerciseId,
        exerciseType,
        errorCode: exerciseError.code,
        errorDetails: exerciseError
      })
      return NextResponse.json(
        { error: 'Failed to save exercise', details: exerciseError.message },
        { status: 500 }
      )
    }

    log.info("Exercise logged successfully", undefined, {
      userId,
      workoutLogId,
      exerciseId,
      exerciseType,
      exerciseLogId: exerciseLog.id
    })

    return NextResponse.json({
      success: true,
      exerciseLog,
      message: 'Exercise logged successfully'
    })

  } catch (error: any) {
    log.error('Error logging exercise', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to log exercise',
        details: error.message
      },
      { status: 500 }
    )
  }
}
