"use client"

import { useAppData } from "@/lib/contexts/app-data-context"
import { FitnessClient } from "./FitnessClient"
import { Skeleton } from "@/components/ui/skeleton-loaders"
import { FitnessErrorBoundary } from "@/components/fitness-error-boundary"
import { useEffect, useState } from "react"
import { Dumbbell } from "lucide-react"

/**
 * Wrapper component that handles all data loading for the fitness page.
 * This ensures FitnessClient only renders when data is fully available.
 * Version: 3.0.0 - Added error boundary and enhanced loading states
 */
export function FitnessClientWrapper() {
  const { appData, isLoading, error, refresh } = useAppData()
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Handle initial load timeout
  useEffect(() => {
    if (isInitialLoad && isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true)
      }, 10000) // 10 seconds timeout

      return () => clearTimeout(timer)
    }
  }, [isInitialLoad, isLoading])

  // Track when loading completes
  useEffect(() => {
    if (!isLoading && isInitialLoad) {
      setIsInitialLoad(false)
      setLoadingTimeout(false)
    }
  }, [isLoading, isInitialLoad])

  // Show enhanced loading state while data is being fetched
  if (isLoading && !loadingTimeout) {
    return (
      <FitnessErrorBoundary>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black">
          <div className="p-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 mb-6 animate-pulse">
            <Dumbbell className="w-12 h-12 text-cyan-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Fitness</h2>
          <p className="text-sm text-neutral-400">Preparing your workout space...</p>
          <div className="flex gap-2 mt-4">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </FitnessErrorBoundary>
    )
  }

  // Handle loading timeout
  if (loadingTimeout) {
    return (
      <FitnessErrorBoundary>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black px-4">
          <div className="max-w-md w-full text-center">
            <div className="p-4 rounded-full bg-yellow-500/10 mb-6 inline-block">
              <Dumbbell className="w-12 h-12 text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Taking Longer Than Expected</h2>
            <p className="text-sm text-neutral-400 mb-6">
              The fitness page is taking a while to load. This might be due to a slow connection.
            </p>
            <button
              onClick={() => {
                setLoadingTimeout(false)
                refresh()
              }}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-xl transition-colors"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </FitnessErrorBoundary>
    )
  }

  // Handle explicit errors
  if (error) {
    return (
      <FitnessErrorBoundary>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black px-4">
          <div className="max-w-md w-full text-center">
            <div className="p-4 rounded-full bg-red-500/10 mb-6 inline-block">
              <Dumbbell className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Fitness Data</h2>
            <p className="text-sm text-neutral-400 mb-2">
              {error || "We couldn't load your fitness data. Please try again."}
            </p>
            <button
              onClick={() => refresh()}
              className="mt-4 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </FitnessErrorBoundary>
    )
  }

  // Ensure appData exists before rendering
  if (!appData) {
    return (
      <FitnessErrorBoundary>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black px-4">
          <div className="max-w-md w-full text-center">
            <div className="p-4 rounded-full bg-neutral-800 mb-6 inline-block animate-pulse">
              <Dumbbell className="w-12 h-12 text-neutral-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Preparing Your Fitness Data</h2>
            <p className="text-sm text-neutral-400 mb-6">
              Setting up your personalized fitness experience...
            </p>
            <button
              onClick={() => refresh()}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-xl transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </FitnessErrorBoundary>
    )
  }

  // Only render FitnessClient when data is fully loaded
  // Wrap in error boundary to catch any runtime errors
  return (
    <FitnessErrorBoundary>
      <FitnessClient />
    </FitnessErrorBoundary>
  )
}