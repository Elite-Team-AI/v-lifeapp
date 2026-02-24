import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

/**
 * POST /api/clear-community-cache
 * Clears the cached community posts data
 */
export async function POST() {
  try {
    // Revalidate the community posts cache
    revalidateTag('community-posts')

    return NextResponse.json({
      success: true,
      message: 'Community cache cleared successfully'
    })
  } catch (error: any) {
    console.error('Error clearing community cache:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache', details: error.message },
      { status: 500 }
    )
  }
}
