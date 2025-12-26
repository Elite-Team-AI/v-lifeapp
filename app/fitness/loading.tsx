import { BottomNav } from "@/components/bottom-nav"
import { WorkoutCardSkeleton, StatsCardSkeleton, Skeleton } from "@/components/ui/skeleton-loaders"

export default function FitnessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-charcoal pb-nav-safe">
      <div className="container max-w-md px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-40" />
          </div>
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>

        {/* CTA Button */}
        <Skeleton className="h-14 w-full rounded-md" />

        {/* Programming Context Card */}
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-black/50 p-3 text-center">
              <Skeleton className="h-3 w-16 mx-auto mb-2" />
              <Skeleton className="h-7 w-8 mx-auto" />
            </div>
          ))}
        </div>

        <StatsCardSkeleton />
        
        {/* Workout Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
          <WorkoutCardSkeleton />
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
