import { redirect } from "next/navigation"
import { requireSuperAdmin } from "@/lib/utils/user-helpers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Crown, Settings, TrendingUp, Activity, Dumbbell, UtensilsCrossed, Heart, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { formatDistanceToNow } from "date-fns"

export default async function AdminPage() {
  // Protect this page - only super admins can access
  try {
    await requireSuperAdmin()
  } catch (error) {
    // Redirect to dashboard if not authorized
    redirect("/dashboard")
  }

  // Fetch comprehensive user data with engagement metrics
  const supabase = await createClient()

  // Get all users with their profile data and linked auth data
  const { data: users } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      user_role,
      created_at,
      updated_at
    `)
    .order("created_at", { ascending: false })

  // Get auth users for last sign in data
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers()

  // Get engagement metrics for each user
  const userIds = users?.map(u => u.id) || []

  const { data: workouts } = await supabase
    .from("workouts")
    .select("user_id")
    .in("user_id", userIds)

  const { data: meals } = await supabase
    .from("meals")
    .select("user_id")
    .in("user_id", userIds)

  const { data: habits } = await supabase
    .from("habits")
    .select("user_id")
    .in("user_id", userIds)

  const { data: posts } = await supabase
    .from("community_posts")
    .select("user_id")
    .in("user_id", userIds)

  // Calculate metrics per user
  const usersWithMetrics = users?.map(user => {
    const authUser = authUsers?.find(au => au.id === user.id)
    const workoutCount = workouts?.filter(w => w.user_id === user.id).length || 0
    const mealCount = meals?.filter(m => m.user_id === user.id).length || 0
    const habitCount = habits?.filter(h => h.user_id === user.id).length || 0
    const postCount = posts?.filter(p => p.user_id === user.id).length || 0
    const engagementScore = workoutCount + mealCount + habitCount + postCount

    return {
      ...user,
      last_sign_in: authUser?.last_sign_in_at,
      workouts: workoutCount,
      meals: mealCount,
      habits: habitCount,
      posts: postCount,
      engagement: engagementScore
    }
  }) || []

  // Calculate aggregate stats
  const totalUsers = users?.length || 0
  const superAdmins = users?.filter(u => u.user_role === 'super_admin').length || 0
  const chosenUsers = users?.filter(u => u.user_role === 'chosen').length || 0
  const regularUsers = users?.filter(u => u.user_role === 'user').length || 0

  // Active users (logged in within last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const activeUsers = usersWithMetrics.filter(u =>
    u.last_sign_in && new Date(u.last_sign_in) > sevenDaysAgo
  ).length

  // New users (created in last 7 days)
  const newUsers = users?.filter(u =>
    new Date(u.created_at) > sevenDaysAgo
  ).length || 0

  // Total feature usage
  const totalWorkouts = workouts?.length || 0
  const totalMeals = meals?.length || 0
  const totalHabits = habits?.length || 0
  const totalPosts = posts?.length || 0

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-white/60">Super Admin Control Panel</p>
          </div>
        </div>

        {/* User Stats */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            User Overview
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-accent/30 bg-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{totalUsers}</div>
                <p className="text-xs text-white/60">All registered users</p>
              </CardContent>
            </Card>

            <Card className="border-green-500/30 bg-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{activeUsers}</div>
                <p className="text-xs text-white/60">Last 7 days</p>
              </CardContent>
            </Card>

            <Card className="border-blue-500/30 bg-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Users</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">{newUsers}</div>
                <p className="text-xs text-white/60">Last 7 days</p>
              </CardContent>
            </Card>

            <Card className="border-purple-500/30 bg-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
                <Shield className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">{superAdmins}</div>
                <p className="text-xs text-white/60">Full admin access</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Role Distribution */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            Role Distribution
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-yellow-500/30 bg-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">The Chosen</CardTitle>
                <Crown className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">{chosenUsers}</div>
                <p className="text-xs text-white/60">Free access users</p>
              </CardContent>
            </Card>

            <Card className="border-blue-500/30 bg-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">{regularUsers}</div>
                <p className="text-xs text-white/60">Paid access</p>
              </CardContent>
            </Card>

            <Card className="border-purple-500/30 bg-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
                <Shield className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">{superAdmins}</div>
                <p className="text-xs text-white/60">Admin privileges</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feature Usage Stats */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            Platform Engagement
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-orange-500/30 bg-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workouts Logged</CardTitle>
                <Dumbbell className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-400">{totalWorkouts}</div>
                <p className="text-xs text-white/60">Total sessions</p>
              </CardContent>
            </Card>

            <Card className="border-green-500/30 bg-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meals Logged</CardTitle>
                <UtensilsCrossed className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{totalMeals}</div>
                <p className="text-xs text-white/60">Total meals</p>
              </CardContent>
            </Card>

            <Card className="border-blue-500/30 bg-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Habits Tracked</CardTitle>
                <Calendar className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">{totalHabits}</div>
                <p className="text-xs text-white/60">Total habits</p>
              </CardContent>
            </Card>

            <Card className="border-pink-500/30 bg-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Community Posts</CardTitle>
                <Heart className="h-4 w-4 text-pink-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-pink-400">{totalPosts}</div>
                <p className="text-xs text-white/60">Total posts</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed User Table */}
        <Card className="border-accent/30 bg-black/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Details
            </CardTitle>
            <CardDescription>
              Comprehensive view of all users with engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="pb-3 px-4 text-xs font-medium text-white/60">Email</th>
                    <th className="pb-3 px-4 text-xs font-medium text-white/60">Name</th>
                    <th className="pb-3 px-4 text-xs font-medium text-white/60">Role</th>
                    <th className="pb-3 px-4 text-xs font-medium text-white/60">Joined</th>
                    <th className="pb-3 px-4 text-xs font-medium text-white/60">Last Active</th>
                    <th className="pb-3 px-4 text-xs font-medium text-white/60 text-center">Workouts</th>
                    <th className="pb-3 px-4 text-xs font-medium text-white/60 text-center">Meals</th>
                    <th className="pb-3 px-4 text-xs font-medium text-white/60 text-center">Habits</th>
                    <th className="pb-3 px-4 text-xs font-medium text-white/60 text-center">Posts</th>
                    <th className="pb-3 px-4 text-xs font-medium text-white/60 text-center">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {usersWithMetrics.map((user) => {
                    const roleColors = {
                      super_admin: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
                      chosen: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
                      user: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                    }
                    const roleColor = roleColors[user.user_role as keyof typeof roleColors] || roleColors.user

                    return (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-sm">{user.email}</td>
                        <td className="py-3 px-4 text-sm">{user.full_name || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${roleColor}`}>
                            {user.user_role === 'super_admin' && <Shield className="h-3 w-3 mr-1" />}
                            {user.user_role === 'chosen' && <Crown className="h-3 w-3 mr-1" />}
                            {user.user_role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-white/60">
                          {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </td>
                        <td className="py-3 px-4 text-sm text-white/60">
                          {user.last_sign_in
                            ? formatDistanceToNow(new Date(user.last_sign_in), { addSuffix: true })
                            : 'Never'
                          }
                        </td>
                        <td className="py-3 px-4 text-sm text-center">
                          <span className={user.workouts > 0 ? 'text-orange-400 font-medium' : 'text-white/40'}>
                            {user.workouts}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-center">
                          <span className={user.meals > 0 ? 'text-green-400 font-medium' : 'text-white/40'}>
                            {user.meals}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-center">
                          <span className={user.habits > 0 ? 'text-blue-400 font-medium' : 'text-white/40'}>
                            {user.habits}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-center">
                          <span className={user.posts > 0 ? 'text-pink-400 font-medium' : 'text-white/40'}>
                            {user.posts}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-center">
                          <span className={`font-bold ${
                            user.engagement > 50 ? 'text-green-400' :
                            user.engagement > 20 ? 'text-yellow-400' :
                            user.engagement > 0 ? 'text-orange-400' :
                            'text-white/40'
                          }`}>
                            {user.engagement}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* User Role Management Info */}
        <Card className="border-accent/30 bg-black/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              User Role Tiers
            </CardTitle>
            <CardDescription>
              Overview of the three-tier access system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
                <Users className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-400">User</h3>
                  <p className="text-sm text-white/70">
                    Standard paid access to all features. Full access to workouts, nutrition, community, and AI coaching.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                <Crown className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-400">The Chosen</h3>
                  <p className="text-sm text-white/70">
                    Free access to all user features. Same capabilities as paid users without subscription requirements.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-purple-500/30 bg-purple-500/5">
                <Shield className="h-5 w-5 text-purple-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-400">Super Admin</h3>
                  <p className="text-sm text-white/70">
                    Full access to all features plus this admin dashboard. Can view system statistics, manage user roles, and access administrative functions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
