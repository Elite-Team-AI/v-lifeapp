"use client"

import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Plus,
  Trophy,
  Dumbbell,
  Utensils,
  Settings,
  Search,
  TrendingUp,
  Clock,
  Flame,
  Users,
  Target,
  Medal,
  ThumbsUp,
  Sparkles,
  Send,
  UserPlus,
  UserCheck,
  Flag,
  Ban,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { PostImage } from "@/components/post-image"
import { BottomNav } from "@/components/bottom-nav"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DEFAULT_AVATAR } from "@/lib/stock-images"
import { useAppData } from "@/lib/contexts/app-data-context"
import { useToast } from "@/hooks/use-toast"

// Lazy load modals
const CreatePostModal = lazy(() => import("@/app/create-post-modal").then(m => ({ default: m.CreatePostModal })))
const ReportPostModal = lazy(() => import("@/app/report-post-modal").then(m => ({ default: m.ReportPostModal })))

interface Comment {
  id: number
  user: { name: string; avatar: string }
  content: string
  time: string
  likes: number
}

interface Post {
  id: number
  user: { id?: string; name: string; avatar: string; isFollowing?: boolean }
  title: string
  content: string
  image?: string
  likes: number
  comments: number
  commentsList?: Comment[]
  time: string
  category: string
  liked?: boolean
  reactions: {
    heart: number
    celebrate: number
    support: number
    fire: number
  }
  userReaction: "heart" | "celebrate" | "support" | "fire" | null
}

interface LeaderboardUser {
  name: string
  avatar: string
  posts: number
  likes: number
  rank: number
}

type Challenge = {
  id: string
  title: string
  description: string
  participants: number
  daysLeft: number
  progress: number
  joined: boolean
  isDbChallenge: boolean
}

export default function Community() {
  const router = useRouter()
  const { toast } = useToast()

  // Get user name from cached app data
  const { appData } = useAppData()
  const currentUserName = useMemo(() => {
    return appData?.profile?.name || "User"
  }, [appData?.profile?.name])
  
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "trending">("recent")
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showChallenges, setShowChallenges] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [commentText, setCommentText] = useState("")
  const [posts, setPosts] = useState<Post[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(false)
  const [reportModalPost, setReportModalPost] = useState<Post | null>(null)

  useEffect(() => {
    loadPosts()
  }, [selectedCategory, sortBy])

  useEffect(() => {
    if (showLeaderboard) {
      loadLeaderboard()
    }
  }, [showLeaderboard])

  // User name is now loaded from global AppDataProvider - no need to fetch

  useEffect(() => {
    if (selectedPost) {
      loadComments(selectedPost.id)
    }
  }, [selectedPost])

  useEffect(() => {
    if (showChallenges) {
      loadChallenges()
    }
  }, [showChallenges])

  const loadCurrentUser = async () => {
    // Profile is now loaded from global AppDataProvider
    // This function is kept for compatibility but can be removed
    // The userName is now set directly from appData in the component
  }

  const loadPosts = async () => {
    setIsLoading(true)
    try {
      const { getPosts } = await import("@/lib/actions/community")
      const result = await getPosts(selectedCategory, sortBy)

      if (result.error) {
        console.error("Error from getPosts:", result.error)
        toast({
          title: "Error loading posts",
          description: result.error,
          variant: "destructive"
        })
      }

      if (result.posts) {
        setPosts(result.posts as any)
      }
    } catch (error) {
      console.error("Error loading posts:", error)
      toast({
        title: "Error",
        description: "Failed to load community posts",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadLeaderboard = async () => {
    try {
      const { getLeaderboard } = await import("@/lib/actions/community")
      const result = await getLeaderboard()
      if (result.leaderboard) {
        setLeaderboard(result.leaderboard as any)
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error)
    }
  }

  const loadChallenges = async () => {
    setIsLoadingChallenges(true)
    try {
      const { getChallenges } = await import("@/lib/actions/community")
      const result = await getChallenges()
      if (result.challenges) {
        setChallenges(result.challenges as any)
      }
    } catch (error) {
      console.error("Error loading challenges:", error)
    } finally {
      setIsLoadingChallenges(false)
    }
  }

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const { joinChallenge } = await import("@/lib/actions/community")
      const result = await joinChallenge(challengeId)
      
      if (result.success) {
        // Optimistically update UI
        setChallenges((prev) =>
          prev.map((c) =>
            c.id === challengeId
              ? { ...c, joined: true, participants: c.participants + 1 }
              : c
          )
        )
        toast({
          title: "Challenge Joined!",
          description: "You've joined the challenge. Good luck!",
        })
      } else {
        toast({
          title: "Could not join",
          description: result.error || "Already joined or error occurred.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error joining challenge:", error)
      toast({
        title: "Error",
        description: "Failed to join challenge. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLeaveChallenge = async (challengeId: string) => {
    try {
      const { leaveChallenge } = await import("@/lib/actions/community")
      const result = await leaveChallenge(challengeId)
      
      if (result.success) {
        setChallenges((prev) =>
          prev.map((c) =>
            c.id === challengeId
              ? { ...c, joined: false, participants: Math.max(0, c.participants - 1) }
              : c
          )
        )
        toast({
          title: "Left Challenge",
          description: "You've left the challenge.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Could not leave challenge.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error leaving challenge:", error)
    }
  }

  const loadComments = async (postId: number) => {
    try {
      const { getComments } = await import("@/lib/actions/community")
      const result = await getComments(postId.toString())
      if (result.comments) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  commentsList: result.comments as any,
                }
              : post,
          ),
        )
      }
    } catch (error) {
      console.error("Error loading comments:", error)
    }
  }

  const currentUser = {
    name: currentUserName,
    avatar: appData?.profile?.avatar_url || DEFAULT_AVATAR,
  }

  const categories = [
    { id: "all", name: "All", icon: Users },
    { id: "achievement", name: "Achievements", icon: Trophy },
    { id: "workout", name: "Workouts", icon: Dumbbell },
    { id: "nutrition", name: "Nutrition", icon: Utensils },
  ]

  const filteredAndSortedPosts = posts.filter((post) => {
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleCreatePost = async (newPost: { title: string; content: string; image?: string; category: string }) => {
    try {
      const { createPost } = await import("@/lib/actions/community")
      const result = await createPost(newPost)
      if (result.success && result.post) {
        // Optimistically add the new post to the UI immediately
        setPosts((prevPosts) => [result.post!, ...prevPosts])

        // Refresh posts in background to ensure consistency
        setTimeout(() => loadPosts(), 500)

        toast({
          title: "Post created!",
          description: "Your post has been shared with the community.",
        })
      } else {
        console.error("Error creating post:", result.error)
        toast({
          title: "Failed to create post",
          description: result.error || "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Failed to create post",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReaction = async (postId: number, reactionType: "heart" | "celebrate" | "support" | "fire") => {
    try {
      const { toggleReaction } = await import("@/lib/actions/community")
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            const reactions = { ...post.reactions }
            const currentReaction = post.userReaction

            if (currentReaction && reactions[currentReaction] !== undefined) {
              reactions[currentReaction] = Math.max(0, (reactions[currentReaction] ?? 0) - 1)
            }

            if (currentReaction === reactionType) {
              return { ...post, reactions, userReaction: null }
            } else {
              reactions[reactionType] = (reactions[reactionType] ?? 0) + 1
              return { ...post, reactions, userReaction: reactionType }
            }
          }
          return post
        }),
      )

      await toggleReaction(postId.toString(), reactionType)
    } catch (error) {
      console.error("Error toggling reaction:", error)
      await loadPosts()
    }
  }

  const toggleFollow = async (postId: number) => {
    const post = posts.find((p) => p.id === postId)
    if (!post) return

    try {
      const { toggleFollow: toggleFollowAction } = await import("@/lib/actions/community")
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                user: { ...p.user, isFollowing: !p.user.isFollowing },
              }
            : p,
        ),
      )

      await toggleFollowAction(post.user.id || "")
    } catch (error) {
      console.error("Error toggling follow:", error)
      await loadPosts()
    }
  }

  const handleBlockUser = useCallback(async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to block ${userName}? Their posts will be hidden from your feed.`)) {
      return
    }

    try {
      const { blockUser } = await import("@/lib/actions/community")
      const result = await blockUser(userId)

      if (result.success) {
        // Remove blocked user's posts from the feed immediately
        setPosts((prevPosts) => prevPosts.filter((p) => p.user.id !== userId))
        toast({
          title: "User blocked",
          description: `${userName} has been blocked. You won't see their posts anymore.`,
        })
      } else {
        toast({
          title: "Unable to block user",
          description: result.error || "Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error blocking user:", error)
      toast({
        title: "Error",
        description: "Failed to block user. Please try again.",
        variant: "destructive",
      })
    }
  }, [toast])

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return

    try {
      const { createComment } = await import("@/lib/actions/community")
      const result = await createComment(selectedPost.id.toString(), commentText.trim())

      if (result.success) {
        await loadComments(selectedPost.id)
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === selectedPost.id
              ? {
                  ...post,
                  comments: post.comments + 1,
                }
              : post,
          ),
        )
        setCommentText("")
        setSelectedPost(null) // Auto-close dialog after successful comment
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "achievement":
        return <Trophy className="h-3 w-3 text-yellow-400" />
      case "workout":
        return <Dumbbell className="h-3 w-3 text-red-400" />
      case "nutrition":
        return <Utensils className="h-3 w-3 text-green-400" />
      default:
        return null
    }
  }

  const reactionIcons = {
    heart: { icon: Heart, color: "text-red-400", label: "Love" },
    celebrate: { icon: Sparkles, color: "text-yellow-400", label: "Celebrate" },
    support: { icon: ThumbsUp, color: "text-blue-400", label: "Support" },
    fire: { icon: Flame, color: "text-orange-400", label: "Fire" },
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden pb-nav-safe">
      {/* Animated gradient background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px] animate-blob" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

      <div className="relative z-10 container max-w-md px-4 py-6">
        <motion.div
          className="mb-6 space-y-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                className="text-2xl font-bold tracking-tight font-heading bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                Community
              </motion.h1>
              <motion.p
                className="text-white/70 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Connect with other members
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
            <ButtonGlow variant="outline-glow" size="icon" onClick={() => router.push("/settings")} className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </ButtonGlow>
            </motion.div>
          </div>

          {/* Search Bar */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <Input
              placeholder="Search posts, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 backdrop-blur-xl bg-white/5 border-white/10 focus:border-accent/50 focus:bg-white/10 transition-all duration-300"
            />
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <motion.div
              className="flex-1"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <ButtonGlow variant="outline-glow" size="sm" onClick={() => setShowLeaderboard(true)} className="w-full backdrop-blur-xl font-medium tracking-wide">
                <Medal className="mr-2 h-4 w-4" />
                Leaderboard
              </ButtonGlow>
            </motion.div>
            <motion.div
              className="flex-1"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <ButtonGlow variant="outline-glow" size="sm" onClick={() => setShowChallenges(true)} className="w-full backdrop-blur-xl font-medium tracking-wide">
                <Target className="mr-2 h-4 w-4" />
                Challenges
              </ButtonGlow>
            </motion.div>
          </motion.div>

          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="grid w-full grid-cols-4 backdrop-blur-xl bg-white/5 border border-white/10">
                {categories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                    <cat.icon className="mr-1 h-3 w-3" />
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </motion.div>

          {/* Sort Options */}
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <ButtonGlow
                variant={sortBy === "recent" ? "accent-glow" : "outline-glow"}
                size="sm"
                onClick={() => setSortBy("recent")}
                className="backdrop-blur-xl tracking-wide"
              >
                <Clock className="mr-1 h-3 w-3" />
                Recent
              </ButtonGlow>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <ButtonGlow
                variant={sortBy === "popular" ? "accent-glow" : "outline-glow"}
                size="sm"
                onClick={() => setSortBy("popular")}
                className="backdrop-blur-xl tracking-wide"
              >
                <Heart className="mr-1 h-3 w-3" />
                Popular
              </ButtonGlow>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <ButtonGlow
                variant={sortBy === "trending" ? "accent-glow" : "outline-glow"}
                size="sm"
                onClick={() => setSortBy("trending")}
                className="backdrop-blur-xl tracking-wide"
              >
                <TrendingUp className="mr-1 h-3 w-3" />
                Trending
              </ButtonGlow>
            </motion.div>
          </motion.div>
        </motion.div>

        {isLoading ? (
          <motion.div
            className="flex items-center justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredAndSortedPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.8 + index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <Card className="overflow-hidden border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_15px_rgba(255,215,0,0.05)]">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center flex-1">
                        <Avatar className="h-10 w-10 border border-white/10">
                          <AvatarImage src={post.user.avatar || "/placeholder.svg"} alt={post.user.name} />
                          <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center">
                            <h3 className="font-medium text-white mr-2">{post.user.name}</h3>
                            {getCategoryIcon(post.category)}
                          </div>
                          <p className="text-xs text-white/60">{post.time}</p>
                        </div>
                        <ButtonGlow
                          variant={post.user.isFollowing ? "outline-glow" : "accent-glow"}
                          size="sm"
                          onClick={() => toggleFollow(post.id)}
                          className="ml-2"
                        >
                          {post.user.isFollowing ? (
                            <>
                              <UserCheck className="mr-1 h-3 w-3" />
                              Following
                            </>
                          ) : (
                            <>
                              <UserPlus className="mr-1 h-3 w-3" />
                              Follow
                            </>
                          )}
                        </ButtonGlow>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="rounded-full p-1 hover:bg-white/10 ml-2">
                            <MoreVertical className="h-5 w-5 text-white/60" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-black/90 border-white/10">
                          <DropdownMenuItem className="text-white/80">Share Post</DropdownMenuItem>
                          <DropdownMenuItem className="text-white/80">Save Post</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400"
                            onClick={() => setReportModalPost(post)}
                          >
                            <Flag className="mr-2 h-4 w-4" />
                            Report Post
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400"
                            onClick={() => handleBlockUser(post.user.id || "", post.user.name)}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Block User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="px-4 pb-2">
                      <h2 className="mb-1 font-bold text-white">{post.title}</h2>
                      {post.content && <p className="text-sm text-white/80">{post.content}</p>}
                    </div>

                    {post.image && (
                      <div className="mt-2">
                        <PostImage src={post.image!} alt="Post content" className="w-full" />
                      </div>
                    )}

                    {/* Reactions Bar */}
                    <div className="px-4 py-2 flex items-center gap-1 border-t border-white/10">
                      {Object.entries(reactionIcons).map(([key, { icon: Icon, color }]) => {
                        const count = post.reactions?.[key as keyof typeof post.reactions] || 0
                        const isActive = post.userReaction === key
                        return (
                          <button
                            key={key}
                            onClick={() => handleReaction(post.id, key as any)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all ${
                              isActive ? `${color} bg-white/10` : "text-white/60 hover:bg-white/5"
                            }`}
                          >
                            <Icon className={`h-4 w-4 ${isActive ? "" : ""}`} />
                            {count > 0 && <span className="text-xs">{count}</span>}
                          </button>
                        )
                      })}
                    </div>

                    {/* Comment Preview Section */}
                    {post.commentsList && post.commentsList.length > 0 && (
                      <div className="px-4 py-2 border-t border-white/5">
                        {post.commentsList.slice(0, 2).map((comment) => (
                          <div key={comment.id} className="flex gap-2 py-1.5">
                            <span className="text-sm font-medium text-white/80">{comment.user.name}</span>
                            <span className="text-sm text-white/60 line-clamp-1 flex-1">{comment.content}</span>
                          </div>
                        ))}
                        {post.comments > 2 && (
                          <button
                            onClick={() => setSelectedPost(post)}
                            className="text-xs text-white/40 hover:text-accent mt-1"
                          >
                            View all {post.comments} comments
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-white/10 p-4">
                      <div className="flex items-center space-x-6">
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="flex items-center text-white/60 hover:text-accent transition-all"
                        >
                          <MessageCircle className="mr-1 h-5 w-5" />
                          <span className="text-sm">{post.comments}</span>
                        </button>
                      </div>
                      <button className="text-white/60 hover:text-accent">
                        <Share2 className="h-5 w-5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filteredAndSortedPosts.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <motion.div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full backdrop-blur-xl bg-accent/20 border border-accent/30 mx-auto"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
            >
              <Search className="h-8 w-8 text-accent" />
            </motion.div>
            <motion.h3
              className="text-lg font-bold tracking-tight font-heading bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              No posts yet
            </motion.h3>
            <motion.p
              className="text-white/70 mb-4 leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              Be the first to share your fitness journey!
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <ButtonGlow variant="accent-glow" onClick={() => setCreatePostModalOpen(true)} className="tracking-wide">
                <Plus className="mr-2 h-4 w-4" />
                Create Post
              </ButtonGlow>
            </motion.div>
          </motion.div>
        )}
      </div>

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="flex flex-col backdrop-blur-xl bg-black/95 border-accent/30 shadow-[0_0_30px_rgba(255,215,0,0.2)]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="tracking-tight font-heading bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Comments</DialogTitle>
            <DialogDescription className="text-white/70 leading-relaxed">{selectedPost?.comments || 0} comments</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {selectedPost?.commentsList?.map((comment, index) => (
              <motion.div
                key={comment.id}
                className="flex gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Avatar className="h-8 w-8 border border-white/10">
                  <AvatarImage src={comment.user.avatar || "/placeholder.svg"} alt={comment.user.name} />
                  <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-white">{comment.user.name}</h4>
                    <p className="text-sm text-white/80 mt-1">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-1 px-3">
                    <span className="text-xs text-white/50">{comment.time}</span>
                    <button className="text-xs text-white/50 hover:text-accent transition-colors">Like</button>
                    <button className="text-xs text-white/50 hover:text-accent transition-colors">Reply</button>
                  </div>
                </div>
              </motion.div>
            ))}
            {(!selectedPost?.commentsList || selectedPost.commentsList.length === 0) && (
              <motion.div
                className="text-center py-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                >
                  <MessageCircle className="h-12 w-12 text-white/20 mx-auto mb-2" />
                </motion.div>
                <p className="text-white/50 text-sm">No comments yet. Be the first!</p>
              </motion.div>
            )}
          </div>
          <div className="flex gap-2 pt-4 border-t border-white/10 flex-shrink-0">
            <Input
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              className="flex-1 text-white backdrop-blur-xl bg-white/5 border-white/10 placeholder:text-white/40 focus:border-accent/50 focus:bg-white/10 transition-all"
            />
            <ButtonGlow variant="accent-glow" size="icon" onClick={handleAddComment} disabled={!commentText.trim()}>
              <Send className="h-4 w-4" />
            </ButtonGlow>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="flex flex-col backdrop-blur-xl bg-black/95 border-accent/30 shadow-[0_0_30px_rgba(255,215,0,0.2)]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="tracking-tight font-heading bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto] flex items-center">
              <Medal className="mr-2 h-5 w-5 text-yellow-400" />
              Community Leaderboard
            </DialogTitle>
            <DialogDescription className="text-white/70 leading-relaxed">Top contributors this month</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {leaderboard.map((user, index) => (
              <motion.div
                key={user.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 4 }}
              >
                <Card className="border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_15px_rgba(255,215,0,0.05)]">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent font-bold border border-accent/30">
                      {user.rank}
                    </div>
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{user.name}</h4>
                      <p className="text-xs text-white/60">
                        {user.posts} posts • {user.likes} likes
                      </p>
                    </div>
                    {user.rank <= 3 && (
                      <Trophy
                        className={`h-5 w-5 ${
                          user.rank === 1 ? "text-yellow-400" : user.rank === 2 ? "text-gray-400" : "text-orange-400"
                        }`}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChallenges} onOpenChange={setShowChallenges}>
        <DialogContent className="flex flex-col backdrop-blur-xl bg-black/95 border-accent/30 shadow-[0_0_30px_rgba(255,215,0,0.2)]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="tracking-tight font-heading bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto] flex items-center">
              <Target className="mr-2 h-5 w-5 text-accent" />
              Active Challenges
            </DialogTitle>
            <DialogDescription className="text-white/70 leading-relaxed">
              Join community challenges and compete with others
            </DialogDescription>
          </DialogHeader>
          {isLoadingChallenges ? (
            <motion.div
              className="flex items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </motion.div>
          ) : (
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {challenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <Card className="border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_15px_rgba(255,215,0,0.05)]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-white mb-1">{challenge.title}</h4>
                          <p className="text-sm text-white/70">{challenge.description}</p>
                        </div>
                        <Badge variant="outline" className="border-accent/50 text-accent backdrop-blur-xl bg-accent/10">
                          {challenge.daysLeft}d left
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-white/60">
                          <span>{challenge.participants} participants</span>
                          <span className="text-accent font-medium">{challenge.progress}% complete</span>
                        </div>
                        <div className="h-2 backdrop-blur-xl bg-white/10 rounded-full overflow-hidden border border-white/5">
                          <motion.div
                            className="h-full bg-gradient-to-r from-accent to-accent/50"
                            initial={{ width: 0 }}
                            animate={{ width: `${challenge.progress}%` }}
                            transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
                          />
                        </div>
                      </div>
                      {challenge.joined ? (
                        <ButtonGlow
                          variant="outline-glow"
                          size="sm"
                          className="w-full mt-3 backdrop-blur-xl"
                          onClick={() => handleLeaveChallenge(challenge.id)}
                        >
                          Leave Challenge
                        </ButtonGlow>
                      ) : (
                        <ButtonGlow
                          variant="accent-glow"
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => handleJoinChallenge(challenge.id)}
                        >
                          Join Challenge
                        </ButtonGlow>
                      )}
                      {!challenge.isDbChallenge && (
                        <p className="mt-2 text-center text-[10px] text-white/40">
                          Progress tracked from your activity
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {challenges.length === 0 && (
                <motion.div
                  className="text-center text-white/60 py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  No challenges found for this month.
                </motion.div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Create Post Button */}
      <motion.div
        className="fixed bottom-20 right-4 z-50"
        initial={{ opacity: 0, scale: 0, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1, y: -4 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
          <ButtonGlow
            variant="accent-glow"
            size="icon"
            className="h-14 w-14 rounded-full relative"
            onClick={() => setCreatePostModalOpen(true)}
          >
            <Plus className="h-6 w-6" />
          </ButtonGlow>
        </div>
      </motion.div>

      {createPostModalOpen && (
        <Suspense fallback={null}>
          <CreatePostModal
            isOpen={createPostModalOpen}
            onClose={() => setCreatePostModalOpen(false)}
            onCreatePost={handleCreatePost}
            userName={currentUser.name}
            userAvatar={currentUser.avatar}
          />
        </Suspense>
      )}

      {reportModalPost && (
        <Suspense fallback={null}>
          <ReportPostModal
            isOpen={!!reportModalPost}
            onClose={() => setReportModalPost(null)}
            postId={reportModalPost.id.toString()}
            postTitle={reportModalPost.title}
          />
        </Suspense>
      )}

      <BottomNav />
    </div>
  )
}
