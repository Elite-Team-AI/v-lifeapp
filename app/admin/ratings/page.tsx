"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Star, Search, MessageSquare, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DEFAULT_AVATAR } from "@/lib/stock-images"

interface Rating {
  id: string
  user_id: string
  rating: number
  feedback: string | null
  created_at: string
  user_name: string | null
  user_avatar: string | null
}

interface RatingStats {
  totalRatings: number
  averageRating: number
  ratingDistribution: Record<number, number>
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-white/20"
          }`}
        />
      ))}
    </div>
  )
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-8 text-white/70">{label}</span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-white/50">{count}</span>
    </div>
  )
}

export default function AdminRatings() {
  const { toast } = useToast()
  const [ratings, setRatings] = useState<Rating[]>([])
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRating, setFilterRating] = useState<number | null>(null)

  useEffect(() => {
    loadRatings()
  }, [])

  const loadRatings = async () => {
    setIsLoading(true)
    try {
      const { getAdminRatings } = await import("@/lib/actions/admin")
      const result = await getAdminRatings()
      if (result.ratings) {
        setRatings(result.ratings)
      }
      if (result.stats) {
        setStats(result.stats)
      }
    } catch (error) {
      console.error("Error loading ratings:", error)
      toast({
        title: "Error",
        description: "Failed to load ratings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRatings = ratings.filter((rating) => {
    // Filter by rating star
    if (filterRating !== null && rating.rating !== filterRating) {
      return false
    }
    // Filter by search query
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      rating.user_name?.toLowerCase().includes(query) ||
      rating.feedback?.toLowerCase().includes(query) ||
      rating.user_id.toLowerCase().includes(query)
    )
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">App Ratings & Feedback</h1>
        <p className="text-white/70">View all user ratings and feedback for V-Life</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-black/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {stats?.averageRating.toFixed(1) || "0.0"}
                </p>
                <p className="text-sm text-white/60">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-black/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {stats?.totalRatings || 0}
                </p>
                <p className="text-sm text-white/60">Total Ratings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-black/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {ratings.filter((r) => r.feedback).length}
                </p>
                <p className="text-sm text-white/60">With Feedback</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-black/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {stats?.ratingDistribution[5] || 0}
                </p>
                <p className="text-sm text-white/60">5-Star Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      {stats && stats.totalRatings > 0 && (
        <Card className="border-white/10 bg-black/50">
          <CardHeader>
            <CardTitle className="text-white">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <RatingBar
                key={star}
                label={`${star}★`}
                count={stats.ratingDistribution[star] || 0}
                total={stats.totalRatings}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <Input
            placeholder="Search by name or feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterRating(null)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              filterRating === null
                ? "bg-accent text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => setFilterRating(filterRating === star ? null : star)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                filterRating === star
                  ? "bg-accent text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {star}★
            </button>
          ))}
        </div>
      </div>

      {/* Ratings List */}
      <Card className="border-white/10 bg-black/50">
        <CardHeader>
          <CardTitle className="text-white">
            All Ratings ({filteredRatings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredRatings.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              {searchQuery || filterRating !== null
                ? "No ratings match your filters"
                : "No ratings yet"}
            </div>
          ) : (
            filteredRatings.map((rating) => (
              <div
                key={rating.id}
                className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarImage
                        src={rating.user_avatar || DEFAULT_AVATAR}
                        alt={rating.user_name || "User"}
                      />
                      <AvatarFallback>
                        {rating.user_name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">
                          {rating.user_name || "Anonymous User"}
                        </span>
                        <StarRating rating={rating.rating} />
                      </div>
                      {rating.feedback ? (
                        <p className="text-white/70 text-sm whitespace-pre-wrap break-words">
                          {rating.feedback}
                        </p>
                      ) : (
                        <p className="text-white/40 text-sm italic">No feedback provided</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-white/40 whitespace-nowrap">
                    {formatDate(rating.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
