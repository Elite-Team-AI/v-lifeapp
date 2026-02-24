import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/workouts/personal-records
 * Fetch personal records (PRs) for a user
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

    // Fetch personal records with exercise details
    const { data: prs, error } = await supabase
      .from('exercise_pr_history')
      .select(`
        id,
        user_id,
        exercise_id,
        pr_type,
        weight_lbs,
        reps,
        achieved_at,
        exercise_library (
          id,
          name,
          category
        )
      `)
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching personal records:', error)
      return NextResponse.json(
        { error: 'Failed to fetch personal records', details: error.message },
        { status: 500 }
      )
    }

    // Transform data for frontend
    const transformedPRs = prs?.map(pr => ({
      id: pr.id,
      exerciseName: pr.exercise_library?.name || 'Exercise',
      exerciseCategory: pr.exercise_library?.category,
      prType: pr.pr_type,
      weight: pr.weight_lbs,
      reps: pr.reps,
      achievedAt: pr.achieved_at,
      metric: pr.pr_type === 'max_weight' ? 'Max Weight' :
              pr.pr_type === 'max_reps' ? 'Max Reps' :
              pr.pr_type === 'max_volume' ? 'Max Volume' : pr.pr_type
    })) || []

    return NextResponse.json({
      success: true,
      records: transformedPRs
    })

  } catch (error) {
    console.error('Error in GET /api/workouts/personal-records:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
