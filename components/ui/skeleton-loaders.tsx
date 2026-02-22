"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-white/10",
        "before:absolute before:inset-0",
        "before:-translate-x-full before:animate-shimmer",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      style={style}
    />
  )
}

// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Weekly Progress Card */}
      <div className="rounded-lg border border-white/10 bg-black/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 flex-1 rounded-md" />
        </div>
      </div>

      {/* Habits Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-black/50 p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-40" />
            </div>
          </div>
        ))}
      </div>

      {/* AI Tip Card */}
      <div className="rounded-lg border border-white/10 bg-black/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-5 w-5" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </div>

      {/* CTA Button */}
      <Skeleton className="h-12 w-full rounded-md" />
    </div>
  )
}

// Profile Skeleton
export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Habits List Skeleton
export function HabitsListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-black/50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-36" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Meals List Skeleton
export function MealsListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-black/50 overflow-hidden">
          <div className="flex">
            <Skeleton className="h-24 w-24" />
            <div className="flex-1 p-3 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Workout Card Skeleton
export function WorkoutCardSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-black/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="h-5 w-5" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Community Posts Skeleton
export function PostsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-black/50 p-4">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3 mt-1" />
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border border-white/10 bg-black/50 p-4">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center space-y-2">
            <Skeleton className="h-5 w-5 mx-auto rounded" />
            <Skeleton className="h-8 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Chart Skeleton
export function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-white/10 bg-black/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-5 w-5" />
      </div>
      <div className="h-[200px] flex items-end justify-between gap-2 px-4">
        {[40, 60, 35, 80, 55, 70, 45].map((height, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t-md" 
            style={{ height: `${height}%` }} 
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 px-4">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <Skeleton key={day} className="h-3 w-6" />
        ))}
      </div>
    </div>
  )
}

// Settings Section Skeleton
export function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-black/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-3 mt-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Streak Card Skeleton
export function StreakCardSkeleton() {
  return (
    <div className="rounded-lg border border-accent/30 bg-gradient-to-br from-accent/10 to-black/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-6 w-6" />
      </div>
      <div className="text-center mb-4">
        <Skeleton className="h-12 w-16 mx-auto" />
        <Skeleton className="h-4 w-24 mx-auto mt-2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-black/30 p-3 text-center">
          <Skeleton className="h-8 w-12 mx-auto" />
          <Skeleton className="h-3 w-20 mx-auto mt-1" />
        </div>
        <div className="rounded-lg bg-black/30 p-3 text-center">
          <Skeleton className="h-8 w-12 mx-auto" />
          <Skeleton className="h-3 w-20 mx-auto mt-1" />
        </div>
      </div>
    </div>
  )
}

