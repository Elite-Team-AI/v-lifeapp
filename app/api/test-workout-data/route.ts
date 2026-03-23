import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check all potential tables where workout data might be stored
    const [workoutsResult, workoutLogsResult, planWorkoutsResult] = await Promise.all([
      supabase
        .from("workouts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(10),

      supabase
        .from("plan_workouts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10)
    ])

    return NextResponse.json({
      success: true,
      tables: {
        workouts: {
          count: workoutsResult.data?.length || 0,
          data: workoutsResult.data,
          error: workoutsResult.error
        },
        workout_logs: {
          count: workoutLogsResult.data?.length || 0,
          data: workoutLogsResult.data,
          error: workoutLogsResult.error
        },
        plan_workouts: {
          count: planWorkoutsResult.data?.length || 0,
          data: planWorkoutsResult.data,
          error: planWorkoutsResult.error
        }
      }
    })
  } catch (err: any) {
    console.error("[test-workout-data] Error:", err)
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 })
  }
}
