import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log('[test-posts-direct] Starting direct posts fetch test...')

    const supabase = createAdminClient()

    console.log('[test-posts-direct] Admin client created successfully')

    const { data: posts, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          avatar_url
        ),
        post_reactions (
          id,
          reaction_type,
          user_id
        ),
        comments (
          id,
          content,
          created_at,
          profiles:user_id (
            id,
            name,
            avatar_url
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error('[test-posts-direct] Database error:', error)
      return NextResponse.json({
        success: false,
        error: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }
      }, { status: 500 })
    }

    console.log('[test-posts-direct] Successfully fetched posts:', posts?.length || 0)

    return NextResponse.json({
      success: true,
      postsCount: posts?.length || 0,
      posts: posts || [],
      samplePost: posts?.[0] || null
    })
  } catch (err: any) {
    console.error('[test-posts-direct] Unexpected error:', err)
    return NextResponse.json({
      success: false,
      error: {
        message: err.message,
        stack: err.stack
      }
    }, { status: 500 })
  }
}
