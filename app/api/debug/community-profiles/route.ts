import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/debug/community-profiles
 * Debug endpoint to check profile data in community posts
 */
export async function GET() {
  try {
    const supabase = createAdminClient()

    // Fetch recent posts with profile data
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        user_id,
        title,
        content,
        created_at,
        profiles:user_id (
          id,
          name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: error.message },
        { status: 500 }
      )
    }

    // Also fetch profile names directly
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .limit(10)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
    }

    return NextResponse.json({
      success: true,
      postsCount: posts?.length || 0,
      posts: posts?.map(post => ({
        postId: post.id,
        userId: post.user_id,
        title: post.title?.substring(0, 50),
        profileData: post.profiles,
        hasProfile: !!post.profiles,
        profileName: post.profiles?.name,
        nameIsNull: post.profiles?.name === null,
        nameIsEmpty: post.profiles?.name === ''
      })),
      sampleProfiles: profiles?.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        hasName: !!p.name,
        nameLength: p.name?.length || 0
      }))
    })
  } catch (error: any) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Internal error', details: error.message },
      { status: 500 }
    )
  }
}
