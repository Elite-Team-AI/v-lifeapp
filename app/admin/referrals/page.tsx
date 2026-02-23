"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Input } from "@/components/ui/input"
import { Gift, Users, TrendingUp, Search, Check, X, Clock, Mail, Phone, User, Crown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ReferralData {
  id: string
  user_id: string
  user_name: string | null
  user_email: string | null
  referral_code: string
  credits_balance: number
  total_referrals: number
  total_credits_earned: number
  share_count: number
  successful_signups: number
  is_affiliate: boolean | null
}

interface AffiliateApplication {
  id: string
  name: string
  email: string
  phone: string
  status: string
  created_at: string
  reviewed_at: string | null
}

export default function AdminReferrals() {
  const { toast } = useToast()
  const [referrals, setReferrals] = useState<ReferralData[]>([])
  const [applications, setApplications] = useState<AffiliateApplication[]>([])
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(true)
  const [isLoadingApplications, setIsLoadingApplications] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null)

  useEffect(() => {
    loadReferrals()
    loadApplications()
  }, [])

  const loadReferrals = async () => {
    setIsLoadingReferrals(true)
    try {
      const { getAdminReferrals } = await import("@/lib/actions/admin")
      const result = await getAdminReferrals()
      if (result.referrals) {
        setReferrals(result.referrals)
      }
    } catch (error) {
      console.error("Error loading referrals:", error)
      toast({
        title: "Error",
        description: "Failed to load referral data",
        variant: "destructive",
      })
    } finally {
      setIsLoadingReferrals(false)
    }
  }

  const loadApplications = async () => {
    setIsLoadingApplications(true)
    try {
      const { getAdminAffiliateApplications } = await import("@/lib/actions/admin")
      const result = await getAdminAffiliateApplications()
      if (result.applications) {
        setApplications(result.applications)
      }
    } catch (error) {
      console.error("Error loading applications:", error)
      toast({
        title: "Error",
        description: "Failed to load affiliate applications",
        variant: "destructive",
      })
    } finally {
      setIsLoadingApplications(false)
    }
  }

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    newStatus: "pending" | "approved" | "rejected"
  ) => {
    setUpdatingAppId(applicationId)
    try {
      const { updateAffiliateApplicationStatus } = await import("@/lib/actions/admin")
      const result = await updateAffiliateApplicationStatus(applicationId, newStatus)

      if (result.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId
              ? { ...app, status: newStatus, reviewed_at: new Date().toISOString() }
              : app
          )
        )

        const statusLabels = {
          pending: "Pending",
          approved: "Approved",
          rejected: "Rejected",
        }

        toast({
          title: "Status Updated",
          description: `Application marked as ${statusLabels[newStatus]}.`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update application status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating application:", error)
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      })
    } finally {
      setUpdatingAppId(null)
    }
  }

  const filteredReferrals = referrals.filter((ref) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      ref.user_name?.toLowerCase().includes(query) ||
      ref.user_email?.toLowerCase().includes(query) ||
      ref.referral_code.toLowerCase().includes(query)
    )
  })

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      app.name.toLowerCase().includes(query) ||
      app.email.toLowerCase().includes(query) ||
      app.phone.includes(query)
    )
  })

  // Calculate stats
  const totalReferrals = referrals.reduce((sum, r) => sum + r.successful_signups, 0)
  const totalCreditsAwarded = referrals.reduce((sum, r) => sum + r.total_credits_earned, 0)
  const topReferrers = referrals.slice().sort((a, b) => b.successful_signups - a.successful_signups).slice(0, 5)
  const pendingApplications = applications.filter((app) => app.status === "pending").length
  const approvedApplications = applications.filter((app) => app.status === "approved").length

  if (isLoadingReferrals || isLoadingApplications) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Referrals & Affiliates</h1>
        <p className="text-white/70">Manage referral program and affiliate applications</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
        <Input
          placeholder="Search by name, email, or code..."
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
                <p className="text-2xl font-bold text-white">{referrals.length}</p>
                <p className="text-sm text-white/60">Active Referrers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{totalReferrals}</p>
                <p className="text-sm text-white/60">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Gift className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold text-white">{totalCreditsAwarded}</p>
                <p className="text-sm text-white/60">Credits Awarded</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">{pendingApplications}</p>
                <p className="text-sm text-white/60">Pending Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Referrers */}
      <Card className="border-white/10 bg-black/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Top Referrers
          </CardTitle>
          <CardDescription>Users with the most successful referrals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {topReferrers.length === 0 ? (
            <div className="text-center py-8 text-white/60">No referral data yet</div>
          ) : (
            topReferrers.map((ref, index) => (
              <div
                key={ref.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {ref.user_name || "Unknown User"}
                      </span>
                      {ref.is_affiliate && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Affiliate
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-white/50">{ref.user_email || "No email"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-accent">{ref.successful_signups}</div>
                  <p className="text-xs text-white/60">referrals</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* All Referrals Table */}
      <Card className="border-white/10 bg-black/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Gift className="h-5 w-5" />
            All Referrals
          </CardTitle>
          <CardDescription>Complete referral data for all users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="pb-3 px-4 text-xs font-medium text-white/60">User</th>
                  <th className="pb-3 px-4 text-xs font-medium text-white/60">Referral Code</th>
                  <th className="pb-3 px-4 text-xs font-medium text-white/60 text-center">Credits</th>
                  <th className="pb-3 px-4 text-xs font-medium text-white/60 text-center">Signups</th>
                  <th className="pb-3 px-4 text-xs font-medium text-white/60 text-center">Earned</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-white/60">
                      {searchQuery ? "No referrals match your search" : "No referral data yet"}
                    </td>
                  </tr>
                ) : (
                  filteredReferrals.map((ref) => (
                    <tr key={ref.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{ref.user_name || "Unknown User"}</span>
                            {ref.is_affiliate && (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Affiliate
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-white/50">{ref.user_email || "No email"}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-sm text-accent bg-accent/10 px-2 py-1 rounded">
                          {ref.referral_code}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium text-white">{ref.credits_balance}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium text-green-400">{ref.successful_signups}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium text-accent">{ref.total_credits_earned}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Affiliate Applications */}
      <Card className="border-white/10 bg-black/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            Affiliate Applications
          </CardTitle>
          <CardDescription>
            Review and manage affiliate program applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              <Clock className="h-3 w-3 mr-1" />
              Pending: {pendingApplications}
            </Badge>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Check className="h-3 w-3 mr-1" />
              Approved: {approvedApplications}
            </Badge>
          </div>

          <div className="space-y-3">
            {filteredApplications.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                {searchQuery ? "No applications match your search" : "No affiliate applications yet"}
              </div>
            ) : (
              filteredApplications.map((app) => {
                const statusColors = {
                  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
                  approved: "text-green-400 bg-green-500/10 border-green-500/30",
                  rejected: "text-red-400 bg-red-500/10 border-red-500/30",
                }
                const statusColor = statusColors[app.status as keyof typeof statusColors] || statusColors.pending

                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-white/40" />
                        <span className="font-medium text-white">{app.name}</span>
                        <Badge className={`text-xs border ${statusColor}`}>
                          {app.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                          {app.status === "approved" && <Check className="h-3 w-3 mr-1" />}
                          {app.status === "rejected" && <X className="h-3 w-3 mr-1" />}
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1 text-xs text-white/60">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {app.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {app.phone}
                        </div>
                        <div className="text-white/40 mt-1">
                          Applied {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <ButtonGlow
                          variant="accent-glow"
                          size="sm"
                          disabled={updatingAppId === app.id}
                        >
                          {updatingAppId === app.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            "Update Status"
                          )}
                        </ButtonGlow>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black/95 border-white/10">
                        <DropdownMenuItem
                          onClick={() => handleUpdateApplicationStatus(app.id, "pending")}
                          disabled={app.status === "pending"}
                          className="cursor-pointer"
                        >
                          <Clock className="h-4 w-4 mr-2 text-yellow-400" />
                          <span>Mark as Pending</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateApplicationStatus(app.id, "approved")}
                          disabled={app.status === "approved"}
                          className="cursor-pointer"
                        >
                          <Check className="h-4 w-4 mr-2 text-green-400" />
                          <span>Approve</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateApplicationStatus(app.id, "rejected")}
                          disabled={app.status === "rejected"}
                          className="cursor-pointer"
                        >
                          <X className="h-4 w-4 mr-2 text-red-400" />
                          <span>Reject</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
