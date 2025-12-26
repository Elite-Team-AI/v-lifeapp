import { BottomNav } from "@/components/bottom-nav"
import { DashboardSkeleton } from "@/components/ui/skeleton-loaders"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-charcoal pb-nav-safe">
      <div className="container max-w-md px-4 py-6">
        <DashboardSkeleton />
      </div>
      <BottomNav />
    </div>
  )
}

