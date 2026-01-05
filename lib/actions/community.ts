"use server"

import { createClient, getAuthUser, createServiceClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import type { TransformedPost, TransformedComment } from "@/lib/types"
import { DEFAULT_AVATAR } from "@/lib/stock-images"

// Helper to get user avatar with fallback
function getUserAvatar(avatarUrl: string | null | undefined): string {
  return avatarUrl || DEFAULT_AVATAR
}

interface PostReaction {
  id: string
  reaction_type: 'heart' | 'celebrate' | 'support' | 'fire'
  user_id: string
}

interface PostWithRelations {
  id: string
  user_id: string
  title: string
  content: string
  image_url: string | null
  category: string
  likes_count: number
  comments_count: number
  created_at: string
  profiles: { id: string; name: string | null; avatar_url: string | null } | null
  post_reactions: PostReaction[]
}

type ChallengeMetric = "workoutDays" | "nutritionDays" | "activeDays"

interface ChallengeDefinition {
  title: string
  description: string
  metric: ChallengeMetric
  target: number
}

interface ChallengeProgress {
  id: string
  title: string
  description: string
  participants: number
  daysLeft: number
  progress: number
  joined: boolean
  isDbChallenge: boolean
}

const MONTHLY_CHALLENGE_DEFS: Record<number, Omit<ChallengeDefinition, 'participants'>[]> = {
  0: [
    { title: "New Year Reset", description: "Crush 20 workouts to start the year strong", metric: "workoutDays", target: 20 },
    { title: "Fresh Start Nutrition", description: "Log your meals on 25 days this month", metric: "nutritionDays", target: 25 },
    { title: "Winter Consistency", description: "Stay active most days this month", metric: "activeDays", target: 22 },
  ],
  1: [
    { title: "Heart Health Hustle", description: "Cardio or lifts 16 days this month", metric: "workoutDays", target: 16 },
    { title: "Protein for the Heart", description: "Log protein-focused meals 20 days", metric: "nutritionDays", target: 20 },
    { title: "Love Your Core", description: "Move your body 18 days this month", metric: "activeDays", target: 18 },
  ],
  2: [
    { title: "Spring Kickoff", description: "Hit 15 workout days as daylight returns", metric: "workoutDays", target: 15 },
    { title: "Greens & Lean", description: "Log nutrition 22 days this month", metric: "nutritionDays", target: 22 },
    { title: "Mobility March", description: "Active on 20 days to stay limber", metric: "activeDays", target: 20 },
  ],
  3: [
    { title: "Spring Into Strength", description: "18 workout days to build momentum", metric: "workoutDays", target: 18 },
    { title: "Hydration Bloom", description: "Pair logged meals with hydration 20 days", metric: "nutritionDays", target: 20 },
    { title: "5K Prep", description: "Move on 20 days to prep for a 5K", metric: "activeDays", target: 20 },
  ],
  4: [
    { title: "Muscle May", description: "Progressive overload 18 workout days", metric: "workoutDays", target: 18 },
    { title: "Farmers Market Fuel", description: "Track meals 22 days with whole foods", metric: "nutritionDays", target: 22 },
    { title: "Consistency Bloom", description: "Active on 22 days this month", metric: "activeDays", target: 22 },
  ],
  5: [
    { title: "Summer Shred", description: "20 strong workout days pre-summer", metric: "workoutDays", target: 20 },
    { title: "Sunlit Meals", description: "Log nutrition 24 days this month", metric: "nutritionDays", target: 24 },
    { title: "Hydrate & Thrive", description: "Stay active and hydrated 22 days", metric: "activeDays", target: 22 },
  ],
  6: [
    { title: "Midyear Reboot", description: "Recommit with 18 workout days", metric: "workoutDays", target: 18 },
    { title: "BBQ Balance", description: "Log nutrition 22 days despite events", metric: "nutritionDays", target: 22 },
    { title: "Heatwave Hydration", description: "Active on 20 days to beat the heat", metric: "activeDays", target: 20 },
  ],
  7: [
    { title: "Back-on-Track August", description: "16 workout days, no missed Mondays", metric: "workoutDays", target: 16 },
    { title: "End-of-Summer Sprint", description: "Log meals 22 days before fall", metric: "nutritionDays", target: 22 },
    { title: "Travel Recovery", description: "Stay active 18 days even on the go", metric: "activeDays", target: 18 },
  ],
  8: [
    { title: "Fall Focus", description: "Dial 18 workout days with intent", metric: "workoutDays", target: 18 },
    { title: "Back-to-Routine", description: "Log nutrition 24 days to lock habits", metric: "nutritionDays", target: 24 },
    { title: "Protein Prep", description: "Active on 20 days to stay sharp", metric: "activeDays", target: 20 },
  ],
  9: [
    { title: "Fall Fitness Fest", description: "20 workout days before holidays", metric: "workoutDays", target: 20 },
    { title: "Pumpkin Power", description: "Log meals 22 days, keep sugars in check", metric: "nutritionDays", target: 22 },
    { title: "Spooky Sweat", description: "Stay active 20 days this month", metric: "activeDays", target: 20 },
  ],
  10: [
    { title: "Gratitude Grind", description: "Move 18 days before big meals hit", metric: "workoutDays", target: 18 },
    { title: "Maintain & Mingle", description: "Log 22 days to stay on target", metric: "nutritionDays", target: 22 },
    { title: "Turkey Trot Prep", description: "Active on 20 days to prep the trot", metric: "activeDays", target: 20 },
  ],
  11: [
    { title: "Holiday Hustle", description: "Keep 16 workout days through travel", metric: "workoutDays", target: 16 },
    { title: "12 Days of Movement", description: "Lock in 12 workout days before Christmas", metric: "workoutDays", target: 12 },
    { title: "Festive Fuel", description: "Log nutrition 20 days amid festivities", metric: "nutritionDays", target: 20 },
  ],
}

function startOfMonth(date: Date) {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfNextMonth(date: Date) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

function daysLeftInMonth(date: Date) {
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return Math.max(0, endOfMonth.getDate() - date.getDate() + 1)
}

function toDateKey(value: string | null | undefined) {
  if (!value) return null
  const ts = new Date(value)
  if (Number.isNaN(ts.getTime())) return null
  return ts.toISOString().split("T")[0]
}

function isWithinRange(value: string | null | undefined, start: number, end: number) {
  if (!value) return false
  const ts = new Date(value).getTime()
  return !Number.isNaN(ts) && ts >= start && ts < end
}

// Cached posts fetch - revalidates every 30 seconds
const getCachedPosts = unstable_cache(
  async (category?: string) => {
    // Use service client (doesn't require cookies) for cached queries
    const supabase = createServiceClient()

    let query = supabase
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
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50) // Limit posts for performance

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    const { data: posts, error } = await query

    if (error) throw error
    return posts as PostWithRelations[] | null
  },
  ["community-posts"],
  { revalidate: 30, tags: ["community-posts"] }
)

// Cached follows fetch
const getCachedFollows = unstable_cache(
  async (userId: string) => {
    const supabase = createServiceClient()
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId)
    return follows?.map((f) => f.following_id) || []
  },
  ["user-follows"],
  { revalidate: 60, tags: ["user-follows"] }
)

export async function getPosts(
  category?: string,
  sortBy?: "recent" | "popular" | "trending"
): Promise<{ posts?: TransformedPost[]; error?: string }> {
  const { user, error: authError } = await getAuthUser()

  if (authError || !user) {
    return { error: "Not authenticated" }
  }

  try {
    // Fetch posts and follows in parallel
    const [posts, followingIds] = await Promise.all([
      getCachedPosts(category),
      getCachedFollows(user.id)
    ])

    if (!posts) {
      return { posts: [] }
    }

    const followingSet = new Set(followingIds)

    // Transform posts
    const transformedPosts: TransformedPost[] = posts.map((post) => {
      const reactions = {
        heart: 0,
        celebrate: 0,
        support: 0,
        fire: 0,
      }

      let userReaction: 'heart' | 'celebrate' | 'support' | 'fire' | null = null

      post.post_reactions?.forEach((reaction) => {
        const type = reaction.reaction_type
        if (reactions[type] !== undefined) {
          reactions[type]++
        }
        if (reaction.user_id === user.id) {
          userReaction = type
        }
      })

      return {
        id: post.id,
        user: {
          id: post.user_id,
          name: post.profiles?.name || "vLife User",
          avatar: getUserAvatar(post.profiles?.avatar_url),
          isFollowing: followingSet.has(post.user_id),
        },
        title: post.title,
        content: post.content,
        image: post.image_url,
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        time: getTimeAgo(new Date(post.created_at)),
        category: post.category,
        reactions,
        userReaction,
      }
    })

    // Sort posts based on sortBy parameter
    if (sortBy === "popular") {
      transformedPosts.sort((a, b) => b.likes - a.likes)
    } else if (sortBy === "trending") {
      transformedPosts.sort((a, b) => {
        const aTotal = Object.values(a.reactions).reduce((sum, val) => sum + val, 0)
        const bTotal = Object.values(b.reactions).reduce((sum, val) => sum + val, 0)
        return bTotal - aTotal
      })
    }

    return { posts: transformedPosts }
  } catch (error) {
    console.error("Error fetching posts:", error)
    return { error: "Failed to load posts" }
  }
}

export async function createPost(data: { 
  title: string
  content: string
  image?: string
  category: string 
}): Promise<{ success?: boolean; error?: string }> {
  const { user, error: authError } = await getAuthUser()

  if (authError || !user) {
    return { error: "Not authenticated" }
  }

  const supabase = await createClient()

  const { error } = await supabase.from("posts").insert({
    user_id: user.id,
    title: data.title,
    content: data.content,
    image_url: data.image,
    category: data.category,
    likes_count: 0,
    comments_count: 0,
  })

  if (error) {
    return { error: error.message }
  }

  revalidateTag("community-posts")
  return { success: true }
}

export async function toggleReaction(
  postId: string, 
  reactionType: "heart" | "celebrate" | "support" | "fire"
): Promise<{ success?: boolean; error?: string }> {
  const { user, error: authError } = await getAuthUser()

  if (authError || !user) {
    return { error: "Not authenticated" }
  }

  const supabase = await createClient()

  // Check if user already reacted to this post
  const { data: existingReaction } = await supabase
    .from("post_reactions")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single()

  if (existingReaction) {
    // If same reaction, remove it
    if (existingReaction.reaction_type === reactionType) {
      const { error } = await supabase
        .from("post_reactions")
        .delete()
        .eq("id", existingReaction.id)

      if (error) return { error: error.message }
    } else {
      // Update to new reaction
      const { error } = await supabase
        .from("post_reactions")
        .update({ reaction_type: reactionType })
        .eq("id", existingReaction.id)

      if (error) return { error: error.message }
    }
  } else {
    // Create new reaction
    const { error } = await supabase.from("post_reactions").insert({
      post_id: postId,
      user_id: user.id,
      reaction_type: reactionType,
    })

    if (error) return { error: error.message }
  }

  // Don't revalidate immediately - let optimistic updates handle it
  return { success: true }
}

export async function toggleFollow(userId: string): Promise<{ success?: boolean; error?: string }> {
  const { user, error: authError } = await getAuthUser()

  if (authError || !user) {
    return { error: "Not authenticated" }
  }

  const supabase = await createClient()

  // Check if already following
  const { data: existingFollow } = await supabase
    .from("follows")
    .select("*")
    .eq("follower_id", user.id)
    .eq("following_id", userId)
    .single()

  if (existingFollow) {
    // Unfollow
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("id", existingFollow.id)

    if (error) return { error: error.message }
  } else {
    // Follow
    const { error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: userId,
    })

    if (error) return { error: error.message }
  }

  revalidateTag("user-follows")
  return { success: true }
}

export async function getComments(postId: string): Promise<{ comments?: TransformedComment[]; error?: string }> {
  const supabase = await createClient()

  const { data: comments, error } = await supabase
    .from("comments")
    .select(`
      *,
      profiles:user_id (
        id,
        name,
        avatar_url
      )
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(50) // Limit comments for performance

  if (error) {
    return { error: error.message }
  }

  const transformedComments: TransformedComment[] = (comments || []).map((comment) => ({
    id: comment.id,
    user: {
      name: comment.profiles?.name || "vLife User",
      avatar: getUserAvatar(comment.profiles?.avatar_url),
    },
    content: comment.content,
    time: getTimeAgo(new Date(comment.created_at)),
    likes: comment.likes_count || 0,
  }))

  return { comments: transformedComments }
}

export async function createComment(
  postId: string, 
  content: string
): Promise<{ success?: boolean; error?: string }> {
  const { user, error: authError } = await getAuthUser()

  if (authError || !user) {
    return { error: "Not authenticated" }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    content: content.trim(),
    likes_count: 0,
  })

  if (error) {
    return { error: error.message }
  }

  // Update comments count on post
  const { error: updateError } = await supabase.rpc("increment_comments_count", { post_id: postId })

  if (updateError) {
    // Non-critical error, just log it
    console.warn("Failed to increment comments count:", updateError.message)
  }

  return { success: true }
}

interface LeaderboardUser {
  name: string
  avatar: string
  posts: number
  likes: number
  rank: number
}

export async function getLeaderboard(): Promise<{ leaderboard?: LeaderboardUser[]; error?: string }> {
  const supabase = await createClient()

  // Get top users by post count and likes
  const { data: users, error } = await supabase
    .from("profiles")
    .select(`
      id,
      name,
      avatar_url,
      posts:posts(count),
      post_reactions:posts(post_reactions(count))
    `)
    .limit(10)

  if (error) {
    return { error: error.message }
  }

  interface UserWithCounts {
    id: string
    name: string | null
    avatar_url: string | null
    posts: { count: number }[]
    post_reactions: { post_reactions: { count: number }[] }[]
  }

  // Transform and sort by engagement
  const leaderboard: LeaderboardUser[] = (users as UserWithCounts[] || [])
    .map((user) => ({
      name: user.name || "vLife User",
      avatar: getUserAvatar(user.avatar_url),
      posts: user.posts?.[0]?.count || 0,
      likes: user.post_reactions?.reduce(
        (sum, post) => sum + (post.post_reactions?.[0]?.count || 0),
        0
      ) || 0,
      rank: 0,
    }))
    .sort((a, b) => b.likes + b.posts * 10 - (a.likes + a.posts * 10))
    .map((user, index) => ({ ...user, rank: index + 1 }))
    .slice(0, 5)

  return { leaderboard }
}

export async function getChallenges(): Promise<{ challenges?: ChallengeProgress[]; error?: string }> {
  const { user, error: authError } = await getAuthUser()
  if (authError || !user) {
    return { error: "Not authenticated" }
  }

  const supabase = await createClient()
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()

  const rangeStart = startOfMonth(now)
  const rangeEnd = startOfNextMonth(now)
  const rangeStartIso = rangeStart.toISOString()
  const rangeEndIso = rangeEnd.toISOString()
  const startMs = rangeStart.getTime()
  const endMs = rangeEnd.getTime()
  const totalDaysThisMonth = daysInMonth(now)
  const daysRemaining = daysLeftInMonth(now)
  const todayStr = now.toISOString().split('T')[0]

  // Fetch database challenges (active ones where end_date >= today)
  const { data: dbChallenges, error: dbChallengesError } = await supabase
    .from("challenges")
    .select("*")
    .gte("end_date", todayStr)
    .order("created_at", { ascending: false })

  // Fetch user's joined challenges
  const { data: joinedChallenges } = await supabase
    .from("challenge_participants")
    .select("challenge_id, progress")
    .eq("user_id", user.id)

  const joinedChallengeIds = new Set(joinedChallenges?.map(j => j.challenge_id) || [])
  const joinedProgressMap = new Map(joinedChallenges?.map(j => [j.challenge_id, j.progress]) || [])

  // Get active user count for this month (users who have logged anything)
  const { data: activeUsersData, error: activeUsersError } = await supabase
    .from("profiles")
    .select("id")
    .limit(1000)

  let approximateActiveUsers = 1 // At least the current user
  if (!activeUsersError && activeUsersData) {
    // Get a rough count of active users by checking recent activity
    const { count: mealCount } = await supabase
      .from("meal_logs")
      .select("user_id", { count: "exact", head: true })
      .gte("consumed_at", rangeStartIso)
      .lt("consumed_at", rangeEndIso)

    const { count: workoutCount } = await supabase
      .from("workouts")
      .select("user_id", { count: "exact", head: true })
      .eq("completed", true)
      .gte("created_at", rangeStartIso)
      .lt("created_at", rangeEndIso)

    // Estimate active users (rough calculation)
    approximateActiveUsers = Math.max(
      Math.floor(((mealCount || 0) + (workoutCount || 0)) / 10) || 1,
      1
    )
  }

  const { data: mealLogs, error: mealError } = await supabase
    .from("meal_logs")
    .select("consumed_at")
    .eq("user_id", user.id)
    .gte("consumed_at", rangeStartIso)
    .lt("consumed_at", rangeEndIso)
    .limit(500)

  if (mealError) {
    console.error("Error loading meal logs:", mealError)
    return { error: "Failed to load challenges" }
  }

  const { data: workouts, error: workoutError } = await supabase
    .from("workouts")
    .select("completed_at, scheduled_date, created_at, completed")
    .eq("user_id", user.id)
    .eq("completed", true)
    .order("completed_at", { ascending: false })
    .limit(400)

  if (workoutError) {
    console.error("Error loading workouts for challenges:", workoutError)
    return { error: "Failed to load challenges" }
  }

  const nutritionDays = new Set<string>()
  mealLogs?.forEach((log) => {
    if (isWithinRange(log.consumed_at, startMs, endMs)) {
      const key = toDateKey(log.consumed_at)
      if (key) nutritionDays.add(key)
    }
  })

  const workoutDays = new Set<string>()
  workouts?.forEach((workout) => {
    const dateValue = (workout as any).completed_at || (workout as any).scheduled_date || (workout as any).created_at
    if (isWithinRange(dateValue, startMs, endMs)) {
      const key = toDateKey(dateValue)
      if (key) workoutDays.add(key)
    }
  })

  const activeDays = new Set<string>([...nutritionDays, ...workoutDays])

  const metricValues: Record<ChallengeMetric, number> = {
    nutritionDays: nutritionDays.size,
    workoutDays: workoutDays.size,
    activeDays: activeDays.size,
  }

  // Transform database challenges into ChallengeProgress format
  const dbChallengesList: ChallengeProgress[] = (dbChallenges || []).map((challenge) => {
    const endDate = new Date(challenge.end_date)
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    const userProgress = joinedProgressMap.get(challenge.id) || 0
    const progressPercent = challenge.target_value > 0 
      ? Math.min(100, Math.round((userProgress / challenge.target_value) * 100)) 
      : 0

    return {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description || "",
      participants: challenge.participants_count || 0,
      daysLeft,
      progress: progressPercent,
      joined: joinedChallengeIds.has(challenge.id),
      isDbChallenge: true,
    }
  })

  const defs = MONTHLY_CHALLENGE_DEFS[month] || []
  const seasonalChallenges: ChallengeProgress[] = defs.map((challenge, index) => {
    const currentValue = metricValues[challenge.metric] || 0
    const progress = challenge.target > 0 ? Math.min(100, Math.round((currentValue / challenge.target) * 100)) : 0
    const seasonalId = `${year}-${month}-seasonal-${index}`
    return {
      ...challenge,
      id: seasonalId,
      participants: approximateActiveUsers,
      daysLeft: daysRemaining,
      progress,
      joined: true, // Monthly challenges are auto-joined
      isDbChallenge: false,
    }
  })

  const streakChallenges: ChallengeProgress[] = [
    {
      id: `${year}-${month}-streak-nutrition`,
      title: "Daily Nutrition Streak",
      description: "Log your nutrition every day this month.",
      participants: approximateActiveUsers,
      daysLeft: daysRemaining,
      progress:
        totalDaysThisMonth > 0 ? Math.min(100, Math.round((metricValues.nutritionDays / totalDaysThisMonth) * 100)) : 0,
      joined: true,
      isDbChallenge: false,
    },
    {
      id: `${year}-${month}-streak-workouts`,
      title: "Daily Workout Streak",
      description: "Complete a workout every day this month.",
      participants: approximateActiveUsers,
      daysLeft: daysRemaining,
      progress:
        totalDaysThisMonth > 0 ? Math.min(100, Math.round((metricValues.workoutDays / totalDaysThisMonth) * 100)) : 0,
      joined: true,
      isDbChallenge: false,
    },
  ]

  // DB challenges first, then monthly/streak challenges
  return { challenges: [...dbChallengesList, ...seasonalChallenges, ...streakChallenges] }
}

export async function joinChallenge(challengeId: string): Promise<{ success?: boolean; error?: string }> {
  const { user, error: authError } = await getAuthUser()
  if (authError || !user) {
    return { error: "Not authenticated" }
  }

  const supabase = await createClient()

  // Check if already joined
  const { data: existing } = await supabase
    .from("challenge_participants")
    .select("id")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    return { error: "Already joined this challenge" }
  }

  // Join the challenge
  const { error: joinError } = await supabase
    .from("challenge_participants")
    .insert({
      challenge_id: challengeId,
      user_id: user.id,
      progress: 0,
      completed: false,
    })

  if (joinError) {
    console.error("Error joining challenge:", joinError)
    return { error: "Failed to join challenge" }
  }

  // Increment participants count
  const { error: updateError } = await supabase.rpc("increment_challenge_participants", { 
    challenge_id_param: challengeId 
  })

  if (updateError) {
    // Non-critical, just log
    console.warn("Failed to update participants count:", updateError)
  }

  return { success: true }
}

export async function leaveChallenge(challengeId: string): Promise<{ success?: boolean; error?: string }> {
  const { user, error: authError } = await getAuthUser()
  if (authError || !user) {
    return { error: "Not authenticated" }
  }

  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from("challenge_participants")
    .delete()
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)

  if (deleteError) {
    console.error("Error leaving challenge:", deleteError)
    return { error: "Failed to leave challenge" }
  }

  // Decrement participants count
  const { error: updateError } = await supabase.rpc("decrement_challenge_participants", { 
    challenge_id_param: challengeId 
  })

  if (updateError) {
    console.warn("Failed to update participants count:", updateError)
  }

  return { success: true }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "Just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return `${Math.floor(seconds / 604800)}w ago`
}
