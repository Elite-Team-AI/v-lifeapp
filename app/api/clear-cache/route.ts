import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

/**
 * API Route: Clear Cache
 *
 * Clears various cached data to force fresh fetches from the database.
 * Useful after migrations or data updates.
 *
 * Usage: POST /api/clear-cache
 *
 * Optional body: { tags: ["community-posts", "profile", "user-habits"] }
 * If no tags provided, clears all major caches.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const tagsToRevalidate = body.tags || [
      "community-posts",
      "profile",
      "user-habits",
      "follows",
      "leaderboard"
    ]

    console.log(`[Cache Clear] Revalidating tags:`, tagsToRevalidate)

    for (const tag of tagsToRevalidate) {
      revalidateTag(tag, "max")
      console.log(`[Cache Clear] ✓ Revalidated: ${tag}`)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${tagsToRevalidate.length} cache tags`,
      tags: tagsToRevalidate,
    })
  } catch (error: unknown) {
    console.error("[Cache Clear] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to clear cache"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// Allow GET for easy browser testing
export async function GET() {
  return NextResponse.json({
    message: "Use POST to clear cache",
    example: {
      method: "POST",
      endpoint: "/api/clear-cache",
      body: {
        tags: ["community-posts"]
      }
    }
  })
}
