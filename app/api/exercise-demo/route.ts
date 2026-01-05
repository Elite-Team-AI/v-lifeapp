import { NextRequest, NextResponse } from "next/server"
import { searchExerciseByName } from "@/lib/exercisedb"

/**
 * GET /api/exercise-demo
 * 
 * Fetches exercise demonstration data from ExerciseDB API.
 * Keeps API key server-side for security.
 * 
 * Query params:
 * - name: Exercise name to search for
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const exerciseName = searchParams.get("name")

    if (!exerciseName) {
      return NextResponse.json(
        { error: "Exercise name is required" },
        { status: 400 }
      )
    }

    // Search for exercise in ExerciseDB
    const exercise = await searchExerciseByName(exerciseName)

    if (!exercise) {
      return NextResponse.json(
        { error: "Exercise not found", exercise: null },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      exercise,
    })
  } catch (error) {
    console.error("[Exercise Demo API] Error:", error)
    
    // Handle missing API key gracefully
    if (error instanceof Error && error.message.includes("RAPIDAPI_KEY")) {
      return NextResponse.json(
        { error: "ExerciseDB API not configured" },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch exercise data" },
      { status: 500 }
    )
  }
}

