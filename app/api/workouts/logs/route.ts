import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/workouts/logs
 * Fetch workout history for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
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

    // Fetch workout logs with workout details
    const { data: logs, error } = await supabase
      .from('workout_logs')
      .select(`
        id,
        user_id,
        workout_id,
        started_at,
        completed_at,
        actual_duration_minutes,
        total_volume_lbs,
        perceived_difficulty,
        exercises_completed,
        plan_workouts (
          id,
          workout_name,
          target_muscles
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching workout logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch workout logs', details: error.message },
        { status: 500 }
      )
    }

    // Transform data for frontend
    const transformedLogs = logs?.map(log => ({
      id: log.id,
      workoutName: log.plan_workouts?.workout_name || 'Workout',
      completedAt: log.completed_at,
      duration: log.actual_duration_minutes,
      totalVolume: log.total_volume_lbs,
      averageRpe: log.perceived_difficulty,
      exercisesCompleted: log.exercises_completed,
      targetMuscles: log.plan_workouts?.target_muscles || []
    })) || []

    return NextResponse.json({
      success: true,
      logs: transformedLogs
    })

  } catch (error) {
    console.error('Error in GET /api/workouts/logs:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
