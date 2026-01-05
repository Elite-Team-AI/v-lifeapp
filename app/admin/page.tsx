"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, MessageSquare, Dumbbell } from "lucide-react"

interface AdminStats {
  totalUsers: number
  activeChallenges: number
  totalPosts: number
  totalWorkouts: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { getAdminStats } = await import("@/lib/actions/admin")
        const result = await getAdminStats()
        if (result.stats) {
          setStats(result.stats)
        }
      } catch (error) {
        console.error("Error loading admin stats:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  const statCards = [
    { 
      title: "Total Users", 
      value: stats?.totalUsers || 0, 
      icon: Users, 
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    },
    { 
      title: "Active Challenges", 
      value: stats?.activeChallenges || 0, 
      icon: Target, 
      color: "text-green-400",
      bgColor: "bg-green-500/20"
    },
    { 
      title: "Community Posts", 
      value: stats?.totalPosts || 0, 
      icon: MessageSquare, 
      color: "text-purple-400",
      bgColor: "bg-purple-500/20"
    },
    { 
      title: "Completed Workouts", 
      value: stats?.totalWorkouts || 0, 
      icon: Dumbbell, 
      color: "text-orange-400",
      bgColor: "bg-orange-500/20"
    },
  ]

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
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-white/70">Overview of your vLife platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-white/10 bg-black/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-white/10 bg-black/50">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-white/70">
            Use the navigation above to manage challenges and view platform data.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

