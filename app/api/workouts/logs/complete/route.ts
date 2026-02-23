import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createApiLogger } from '@/lib/utils/logger'
import { workoutLogCompleteSchema, safeValidate } from '@/lib/validations/api'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Complete a workout session
 *
 * POST /api/workouts/logs/complete
 *
 * Body:
 * - userId: string (required)
 * - workoutLogId: string (required)
 * - notes?: string (optional) - Overall workout notes
 * - perceivedDifficulty?: number (1-10) - How hard the workout felt
 * - energyLevel?: number (1-10) - Energy level during workout
 */
export async function POST(request: NextRequest) {
  const log = createApiLogger(request)

  try {
    const body = await request.json()

    // Validate request body
    const validation = safeValidate(workoutLogCompleteSchema, body)
    if (!validation.success) {
      log.warn("Workout completion request validation failed", undefined, {
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
      notes,
      perceivedDifficulty,
      energyLevel
    } = validation.data

    log.info("Completing workout session", undefined, {
      userId,
      workoutLogId
    })

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 1. Fetch workout log with exercise logs
    const { data: workoutLog, error: logError } = await supabase
      .from('workout_logs')
      .select(`
        *,
        exercise_logs (*)
      `)
      .eq('id', workoutLogId)
      .eq('user_id', userId)
      .single()

    if (logError || !workoutLog) {
      log.warn("Workout log not found", undefined, {
        userId,
        workoutLogId,
        errorCode: logError?.code
      })
      return NextResponse.json(
        { error: 'Workout log not found' },
        { status: 404 }
      )
    }

    if (workoutLog.completion_status === 'completed') {
      log.warn("Workout already completed", undefined, {
        userId,
        workoutLogId
      })
      return NextResponse.json(
        { error: 'Workout already completed' },
        { status: 400 }
      )
    }

    // 2. Calculate workout stats
    const endTime = new Date()
    const startTime = new Date(workoutLog.started_at)
    const actualDurationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

    // Calculate total exercises and sets
    const totalExercises = workoutLog.exercise_logs?.length || 0
    const totalSetsCompleted = workoutLog.exercise_logs?.reduce((sum: number, log: any) => {
      return sum + (log.sets_completed || 0)
    }, 0) || 0

    // Calculate total volume (for strength exercises)
    const totalVolumeLbs = workoutLog.exercise_logs?.reduce((sum: number, log: any) => {
      return sum + (log.total_volume_lbs || 0)
    }, 0) || 0

    // Calculate average RPE
    const rpeValues = workoutLog.exercise_logs
      ?.filter((log: any) => log.avg_rpe)
      .map((log: any) => log.avg_rpe) || []
    const avgRPE = rpeValues.length > 0
      ? rpeValues.reduce((sum: number, rpe: number) => sum + rpe, 0) / rpeValues.length
      : null

    // 3. Update workout log
    const { data: updatedLog, error: updateError } = await supabase
      .from('workout_logs')
      .update({
        completion_status: 'completed',
        actual_duration_minutes: actualDurationMinutes,
        exercises_completed: totalExercises,
        total_sets: totalSetsCompleted,
        total_volume_lbs: totalVolumeLbs,
        notes: notes || workoutLog.notes,
        perceived_difficulty: perceivedDifficulty || null,
        energy_level: energyLevel || null,
        completed_at: endTime.toISOString()
      })
      .eq('id', workoutLogId)
      .select()
      .single()

    if (updateError) {
      log.error('Error updating workout log', new Error(updateError.message), undefined, {
        userId,
        workoutLogId,
        errorCode: updateError.code
      })
      return NextResponse.json(
        { error: 'Failed to complete workout', details: updateError.message },
        { status: 500 }
      )
    }

    // 4. Mark the planned workout as completed
    if (workoutLog.workout_id) {
      await supabase
        .from('plan_workouts')
        .update({
          is_completed: true,
          completed_date: new Date().toISOString().split('T')[0],
          actual_duration_minutes: actualDurationMinutes
        })
        .eq('id', workoutLog.workout_id)
    }

    // 5. Check if any PRs were set (trigger will handle this automatically)
    // The check_and_record_prs trigger runs after exercise_logs insert

    // 6. Return summary
    log.info("Workout completed successfully", undefined, {
      userId,
      workoutLogId: updatedLog.id,
      duration: actualDurationMinutes,
      totalExercises,
      totalSets: totalSetsCompleted,
      totalVolume: totalVolumeLbs
    })

    return NextResponse.json({
      success: true,
      summary: {
        workoutLogId: updatedLog.id,
        duration: actualDurationMinutes,
        totalExercises,
        totalSets: totalSetsCompleted,
        totalVolume: totalVolumeLbs,
        perceivedDifficulty,
        energyLevel,
        completedAt: updatedLog.completed_at
      },
      message: 'Workout completed successfully'
    })

  } catch (error: any) {
    log.error('Error completing workout', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to complete workout',
        details: error.message
      },
      { status: 500 }
    )
  }
}
