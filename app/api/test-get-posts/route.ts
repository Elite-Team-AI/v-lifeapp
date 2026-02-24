import { NextResponse } from "next/server"
import { getPosts } from "@/lib/actions/community"
import { getAuthUser } from "@/lib/supabase/server"

export async function GET() {
  try {
    // First check auth
    const { user, error: authError } = await getAuthUser()

    console.log('[test-get-posts] Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message
    })

    // Then call getPosts
    const result = await getPosts()

    console.log('[test-get-posts] getPosts result:', {
      hasError: !!result.error,
      error: result.error,
      postsCount: result.posts?.length,
      hasPosts: !!result.posts
    })

    return NextResponse.json({
      auth: {
        authenticated: !!user,
        userId: user?.id,
        error: authError?.message
      },
      getPostsResult: {
        error: result.error,
        postsCount: result.posts?.length,
        posts: result.posts?.slice(0, 3).map(p => ({
          id: p.id,
          title: p.title,
          userName: p.user?.name
        }))
      }
    })
  } catch (error: any) {
    console.error('[test-get-posts] Error:', error)
    return NextResponse.json(
      { error: 'Internal error', details: error.message },
      { status: 500 }
    )
  }
}
