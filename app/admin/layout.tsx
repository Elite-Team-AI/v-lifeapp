"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, LayoutDashboard, Target, ArrowLeft, Users, Star } from "lucide-react"
import Link from "next/link"
import { ButtonGlow } from "@/components/ui/button-glow"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { checkIsAdmin } = await import("@/lib/actions/admin")
        const result = await checkIsAdmin()
        setIsAdmin(result.isAdmin)
        if (!result.isAdmin) {
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
        router.push("/dashboard")
      } finally {
        setIsLoading(false)
      }
    }
    checkAdmin()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-charcoal flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-charcoal flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/70 mb-4">You don't have admin privileges.</p>
          <ButtonGlow variant="accent-glow" onClick={() => router.push("/dashboard")}>
            Return to Dashboard
          </ButtonGlow>
        </div>
      </div>
    )
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/challenges", label: "Challenges", icon: Target },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/ratings", label: "Ratings", icon: Star },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-charcoal">
      {/* Admin Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/dashboard" className="text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              <span className="text-lg font-bold text-white">Admin</span>
            </div>
          </div>
          <nav className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="flex-shrink-0">
                <ButtonGlow variant="outline-glow" size="sm">
                  <item.icon className="h-4 w-4 mr-1" />
                  {item.label}
                </ButtonGlow>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}

