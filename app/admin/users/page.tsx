"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Shield, ShieldOff, Search, Users, Crown, UserCircle, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DEFAULT_AVATAR } from "@/lib/stock-images"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface User {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  is_admin: boolean
  user_role: string
  created_at: string
}

export default function AdminUsers() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const { getAdminUsers } = await import("@/lib/actions/admin")
      const result = await getAdminUsers()
      if (result.users) {
        setUsers(result.users)
      }
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRole = async (
    userId: string,
    userName: string | null,
    newRole: "user" | "chosen" | "super_admin"
  ) => {
    setTogglingUserId(userId)
    try {
      const { updateUserRole } = await import("@/lib/actions/admin")
      const result = await updateUserRole(userId, newRole)

      if (result.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, user_role: newRole, is_admin: newRole === "super_admin" }
              : u
          )
        )

        const roleLabels = {
          user: "Regular User",
          chosen: "The Chosen (Free Access)",
          super_admin: "Super Admin"
        }

        toast({
          title: "Role Updated",
          description: `${userName || "User"} is now a ${roleLabels[newRole]}.`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update user role",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      })
    } finally {
      setTogglingUserId(null)
    }
  }

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.id.toLowerCase().includes(query)
    )
  })

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
        <h1 className="text-2xl font-bold text-white">Manage Users</h1>
        <p className="text-white/70">View users and manage roles (User, Chosen, Super Admin)</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
        <Input
          placeholder="Search by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-black/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-sm text-white/60">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-black/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <UserCircle className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {users.filter((u) => u.user_role === "user").length}
                </p>
                <p className="text-sm text-white/60">Regular Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-black/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {users.filter((u) => u.user_role === "chosen").length}
                </p>
                <p className="text-sm text-white/60">The Chosen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-black/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {users.filter((u) => u.user_role === "super_admin").length}
                </p>
                <p className="text-sm text-white/60">Super Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="border-white/10 bg-black/50">
        <CardHeader>
          <CardTitle className="text-white">All Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              {searchQuery ? "No users match your search" : "No users found"}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={user.avatar_url || DEFAULT_AVATAR} alt={user.name || "User"} />
                    <AvatarFallback>
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {user.name || "Unnamed User"}
                      </span>
                      {user.user_role === "super_admin" && (
                        <Badge className="bg-purple-500/20 text-purple-400 text-xs border-purple-500/30">
                          <Shield className="h-3 w-3 mr-1" />
                          Super Admin
                        </Badge>
                      )}
                      {user.user_role === "chosen" && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 text-xs border-yellow-500/30">
                          <Crown className="h-3 w-3 mr-1" />
                          The Chosen
                        </Badge>
                      )}
                      {user.user_role === "user" && (
                        <Badge className="bg-blue-500/20 text-blue-400 text-xs border-blue-500/30">
                          <UserCircle className="h-3 w-3 mr-1" />
                          User
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-white/60">
                      {user.email || "No email"}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <ButtonGlow
                      variant="accent-glow"
                      size="sm"
                      disabled={togglingUserId === user.id}
                    >
                      {togglingUserId === user.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <>
                          Change Role
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </ButtonGlow>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-black/95 border-white/10">
                    <DropdownMenuItem
                      onClick={() => handleUpdateRole(user.id, user.name, "user")}
                      disabled={user.user_role === "user"}
                      className="cursor-pointer"
                    >
                      <UserCircle className="h-4 w-4 mr-2 text-blue-400" />
                      <span>Regular User</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleUpdateRole(user.id, user.name, "chosen")}
                      disabled={user.user_role === "chosen"}
                      className="cursor-pointer"
                    >
                      <Crown className="h-4 w-4 mr-2 text-yellow-400" />
                      <span>The Chosen (Free Access)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleUpdateRole(user.id, user.name, "super_admin")}
                      disabled={user.user_role === "super_admin"}
                      className="cursor-pointer"
                    >
                      <Shield className="h-4 w-4 mr-2 text-purple-400" />
                      <span>Super Admin</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

