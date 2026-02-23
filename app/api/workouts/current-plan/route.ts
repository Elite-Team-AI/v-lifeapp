import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createApiLogger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Get the user's current active workout plan
 *
 * GET /api/workouts/current-plan?userId=xxx
 */
export async function GET(request: NextRequest) {
  const log = createApiLogger(request)

  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      log.warn("Current plan request missing userId")
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    log.info("Fetching current workout plan", undefined, { userId })

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Fetch active plan
    const { data: plan, error: planError } = await supabase
      .from('user_workout_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (planError) {
      if (planError.code === 'PGRST116') {
        // No active plan found
        log.info("No active workout plan found", undefined, { userId })
        return NextResponse.json({
          hasActivePlan: false,
          plan: null
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
          }
        })
      }
      throw planError
    }

    // Fetch all workouts for this plan
    const { data: workouts, error: workoutsError } = await supabase
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
            target_muscles,
            instructions,
            video_url
          )
        )
      `)
      .eq('plan_id', plan.id)
      .order('week_number', { ascending: true })
      .order('day_of_week', { ascending: true })

    if (workoutsError) {
      throw workoutsError
    }

    // Group workouts by week
    const weeklyWorkouts = workouts.reduce((acc: any, workout: any) => {
      const weekNum = workout.week_number
      if (!acc[weekNum]) {
        acc[weekNum] = []
      }
      acc[weekNum].push(workout)
      return acc
    }, {})

    // Calculate progress metrics
    const totalWorkouts = workouts.length
    const completedWorkouts = workouts.filter((w: any) => w.is_completed).length
    const adherenceRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0

    // Use progression-based week tracking from database
    // User advances to next week only after completing all workouts in current week
    // This is managed automatically by the check_and_advance_week() trigger
    const currentWeek = plan.current_week || 1

    // Get next uncompleted workout (progression-based, not calendar-based)
    // This allows users to work through the plan at their own pace
    const nextWorkout = workouts.find((w: any) => !w.is_completed)

    log.info("Current workout plan fetched successfully", undefined, {
      userId,
      planId: plan.id,
      planName: plan.plan_name,
      currentWeek,
      totalWorkouts,
      completedWorkouts,
      adherenceRate,
      hasNextWorkout: !!nextWorkout
    })

    return NextResponse.json({
      hasActivePlan: true,
      plan: {
        id: plan.id,
        name: plan.plan_name,
        type: plan.plan_type,
        startDate: plan.start_date,
        endDate: plan.end_date,
        daysPerWeek: plan.days_per_week,
        splitPattern: plan.split_pattern,
        status: plan.status,
        rationale: plan.plan_rationale,
        currentWeek,
        totalWeeks: 4,
        progress: {
          totalWorkouts,
          completedWorkouts,
          adherenceRate,
          remainingWorkouts: totalWorkouts - completedWorkouts
        },
        weeklyWorkouts,
        todaysWorkout: nextWorkout || null
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    })

  } catch (error: any) {
    log.error('Error fetching current plan', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to fetch current plan',
        details: error.message
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    )
  }
}
