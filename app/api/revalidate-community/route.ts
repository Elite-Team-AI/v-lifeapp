import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Revalidate the community-posts cache tag
    revalidateTag("community-posts")

    return NextResponse.json({
      success: true,
      message: "Community posts cache cleared",
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error("Error revalidating cache:", error)
    return NextResponse.json(
      { error: "Failed to revalidate", details: error.message },
      { status: 500 }
    )
  }
}
