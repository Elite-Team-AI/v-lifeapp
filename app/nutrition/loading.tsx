import { BottomNav } from "@/components/bottom-nav"
import { MealsListSkeleton, Skeleton } from "@/components/ui/skeleton-loaders"

export default function NutritionLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-charcoal pb-nav-safe">
      <div className="container max-w-md px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        {/* Macros Card */}
        <div className="mb-6 rounded-lg border border-white/10 bg-black/50 p-4">
          <Skeleton className="h-6 w-36 mb-3" />
          <Skeleton className="h-3 w-32 mb-4" />
          
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Meals */}
        <div className="mb-6">
          <Skeleton className="h-6 w-32 mb-3" />
          <MealsListSkeleton />
        </div>

        {/* Tomorrow's Plan */}
        <div className="mb-6">
          <Skeleton className="h-6 w-40 mb-3" />
          <MealsListSkeleton />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 flex-1 rounded-md" />
        </div>

        {/* Supplements Card */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
