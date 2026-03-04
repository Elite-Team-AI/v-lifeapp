import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createApiLogger } from '@/lib/utils/logger'
import { workoutLogStartSchema, safeValidate } from '@/lib/validations/api'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Start a workout session
 *
 * POST /api/workouts/logs/start
 *
 * Body:
 * - userId: string (required)
 * - workoutId: string (required) - ID from plan_workouts table
 */
export async function POST(request: NextRequest) {
  const log = createApiLogger(request)

  try {
    const body = await request.json()

    // Validate request body
    const validation = safeValidate(workoutLogStartSchema, body)
    if (!validation.success) {
      log.warn("Workout start request validation failed", undefined, {
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

    const { userId, workoutId } = validation.data

    log.info("Starting workout session", undefined, {
      userId,
      workoutId
    })

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 1. Fetch the planned workout with exercises
    const { data: plannedWorkout, error: workoutError } = await supabase
      .from('plan_workouts')
      .select(`
        *,
        plan_exercises (
          *,
          exercise:exercise_library (
            id,
            name,
            category,
            equipment,
            difficulty,
            primary_muscles,
            instructions,
            video_url,
            exercise_type
          )
        )
      `)
      .eq('id', workoutId)
      .single()

    if (workoutError || !plannedWorkout) {
      log.warn("Planned workout not found", undefined, {
        userId,
        workoutId,
        errorCode: workoutError?.code
      })
      return NextResponse.json(
        { error: 'Planned workout not found' },
        { status: 404 }
      )
    }

    // 2. Check if there's already an active workout log for this workout
    const { data: existingLog } = await supabase
      .from('workout_logs')
      .select('id, completion_status')
      .eq('workout_id', workoutId)
      .eq('user_id', userId)
      .eq('completion_status', 'in_progress')
      .single()

    if (existingLog) {
      // Return existing workout session with exercise logs
      log.info("Resuming existing workout session", undefined, {
        userId,
        workoutId,
        workoutLogId: existingLog.id
      })

      // Fetch existing exercise logs for this workout session
      const { data: existingExerciseLogs, error: logsError } = await supabase
        .from('exercise_logs')
        .select(`
          id,
          exercise_id,
          plan_exercise_id,
          exercise_type,
          sets_completed,
          reps_per_set,
          weight_per_set,
          rpe_per_set
        `)
        .eq('workout_log_id', existingLog.id)
        .order('id', { ascending: true })

      if (logsError) {
        log.warn("Failed to fetch exercise logs for resume", undefined, {
          userId,
          workoutLogId: existingLog.id,
          errorCode: logsError.code
        })
        // Continue without logs rather than failing completely
      }

      return NextResponse.json({
        success: true,
        workoutLogId: existingLog.id,
        isResume: true,
        workout: plannedWorkout,
        exerciseLogs: existingExerciseLogs || [],
        message: 'Resumed existing workout session'
      })
    }

    // 3. Create new workout log
    const startTime = new Date().toISOString()

    const { data: workoutLog, error: logError } = await supabase
      .from('workout_logs')
      .insert({
        user_id: userId,
        workout_id: workoutId,
        plan_id: plannedWorkout.plan_id,
        workout_date: new Date().toISOString().split('T')[0],
        started_at: startTime,
        completion_status: 'in_progress',
        planned_duration_minutes: plannedWorkout.estimated_duration_minutes || null
      })
      .select()
      .single()

    if (logError) {
      log.error('Error creating workout log', new Error(logError.message), undefined, {
        userId,
        workoutId,
        errorCode: logError.code
      })
      return NextResponse.json(
        { error: 'Failed to create workout log', details: logError.message },
        { status: 500 }
      )
    }

    log.info("Workout session started successfully", undefined, {
      userId,
      workoutId,
      workoutLogId: workoutLog.id,
      workoutName: plannedWorkout.workout_name
    })

    return NextResponse.json({
      success: true,
      workoutLogId: workoutLog.id,
      isResume: false,
      workout: plannedWorkout,
      message: 'Workout session started'
    })

  } catch (error: any) {
    log.error('Error starting workout', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to start workout',
        details: error.message
      },
      { status: 500 }
    )
  }
}
