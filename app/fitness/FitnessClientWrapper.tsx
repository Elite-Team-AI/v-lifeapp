"use client"

import { useAppData } from "@/lib/contexts/app-data-context"
import { FitnessClient } from "./FitnessClient"
import { Skeleton } from "@/components/ui/skeleton-loaders"

/**
 * Wrapper component that handles all data loading for the fitness page.
 * This ensures FitnessClient only renders when data is fully available.
 * Version: 2.0.0 - Complete rewrite to fix appData loading issues
 */
export function FitnessClientWrapper() {
  const { appData, isLoading } = useAppData()

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black">
        <Skeleton className="w-12 h-12 rounded-full mb-4" />
        <Skeleton className="w-32 h-6 mb-2" />
        <Skeleton className="w-48 h-4" />
      </div>
    )
  }

  // Ensure appData exists before rendering
  if (!appData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black">
        <p className="text-white/60">Loading fitness data...</p>
      </div>
    )
  }

  // Only render FitnessClient when data is fully loaded
  return <FitnessClient />
}