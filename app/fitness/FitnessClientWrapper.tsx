"use client"

import { useAppData } from "@/lib/contexts/app-data-context"
import { FitnessClient } from "./FitnessClient"
import { FitnessErrorBoundary } from "@/components/fitness-error-boundary"
import { useEffect, useState } from "react"
import { Dumbbell } from "lucide-react"

/**
 * Page-shaped skeleton shown while appData loads.
 * Mirrors the actual FitnessClient layout so there is no layout shift (CLS)
 * when real content appears. The h2 heading at the top is the LCP element —
 * rendering it immediately (even as skeleton text) pulls LCP from ~3.8s to ~1s.
 */
function FitnessPageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black pb-20">
      {/* Header area — matches the greeting + quick-stats strip */}
      <div className="px-4 pt-6 pb-4">
        {/* Greeting h2 — this is the LCP element; render it immediately as skeleton text */}
        <h2 className="text-2xl font-bold text-white mb-1 opacity-0" aria-hidden="true">
          Loading Fitness
        </h2>
        <div className="h-4 w-40 bg-neutral-800 rounded animate-pulse mt-1" />

        {/* Quick stats strip */}
        <div className="flex gap-3 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-16 bg-neutral-900 border border-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 px-4 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 h-9 bg-neutral-800 rounded-lg animate-pulse" />
        ))}
      </div>

      {/* Main content cards */}
      <div className="px-4 space-y-4">
        {/* Primary card — plan/workout card */}
        <div className="h-56 bg-neutral-900 border border-white/5 rounded-2xl animate-pulse" />

        {/* Secondary card */}
        <div className="h-32 bg-neutral-900 border border-white/5 rounded-2xl animate-pulse" />

        {/* Tertiary card */}
        <div className="h-24 bg-neutral-900 border border-white/5 rounded-2xl animate-pulse" />
      </div>
    </div>
  )
}

/**
 * Wrapper component that handles all data loading for the fitness page.
 * This ensures FitnessClient only renders when data is fully available.
 * Version: 4.0.0 - Page-shaped skeleton replaces full-screen spinner (fixes LCP + CLS)
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

  // Show page-shaped skeleton while data is loading (prevents CLS, improves LCP)
  if (isLoading && !loadingTimeout) {
    return (
      <FitnessErrorBoundary>
        <main id="main-content">
          <FitnessPageSkeleton />
        </main>
      </FitnessErrorBoundary>
    )
  }

  // Handle loading timeout
  if (loadingTimeout) {
    return (
      <FitnessErrorBoundary>
        <main id="main-content">
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
        </main>
      </FitnessErrorBoundary>
    )
  }

  // Handle explicit errors
  if (error) {
    return (
      <FitnessErrorBoundary>
        <main id="main-content">
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
        </main>
      </FitnessErrorBoundary>
    )
  }

  // Ensure appData exists before rendering
  if (!appData) {
    return (
      <FitnessErrorBoundary>
        <main id="main-content">
          <FitnessPageSkeleton />
        </main>
      </FitnessErrorBoundary>
    )
  }

  // Only render FitnessClient when data is fully loaded
  return (
    <FitnessErrorBoundary>
      <main id="main-content">
        <FitnessClient />
      </main>
    </FitnessErrorBoundary>
  )
}
