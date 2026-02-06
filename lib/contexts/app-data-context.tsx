"use client"

/**
 * AppDataProvider - Global Data Context (OPTIMIZED)
 * 
 * Provides cached application data to all components, eliminating
 * redundant database queries on every navigation.
 * 
 * PERFORMANCE:
 * - No client-side auth check (server handles auth, returns 401 if needed)
 * - Single fetch for all data including daily insight, vitalflow, etc.
 * 
 * Features:
 * - Loads data once at app start
 * - Refreshes in background on tab focus
 * - Supports manual refresh
 * - Provides loading/error states
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import type { AppData, UseAppDataReturn } from "@/lib/types/app-data"
import { initRevenueCat } from "@/lib/services/revenuecat"

const AppDataContext = createContext<UseAppDataReturn | null>(null)

interface AppDataProviderProps {
  children: React.ReactNode
}

export function AppDataProvider({ children }: AppDataProviderProps) {
  const [appData, setAppData] = useState<AppData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchInProgressRef = useRef(false)
  const lastFetchRef = useRef<number>(0)

  // Minimum time between fetches (5 seconds) to prevent rapid refreshes
  const MIN_FETCH_INTERVAL = 5000

  const fetchAppData = useCallback(async (isBackgroundRefresh = false) => {
    // Prevent concurrent fetches
    if (fetchInProgressRef.current) {
      console.log("[AppDataProvider] Fetch already in progress, skipping")
      return
    }

    // Debounce rapid fetches
    const now = Date.now()
    if (now - lastFetchRef.current < MIN_FETCH_INTERVAL) {
      console.log("[AppDataProvider] Fetch debounced (too soon since last fetch)")
      return
    }

    fetchInProgressRef.current = true
    lastFetchRef.current = now

    if (isBackgroundRefresh) {
      setIsRefreshing(true)
      console.log("[AppDataProvider] 🔄 Starting background refresh...")
    } else {
      setIsLoading(true)
      console.log("[AppDataProvider] 🚀 Initial fetch starting...")
    }

    const startTime = performance.now()

    try {
      // Fetch app data - server handles auth and returns 401 if needed
      // No client-side auth check needed (eliminates redundant Supabase call)
      const response = await fetch("/api/app-data", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for auth
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Auth error, clear data
          setAppData(null)
          setError("Authentication required")
          console.log("[AppDataProvider] ❌ Authentication required (401)")
        } else {
          throw new Error(`Failed to fetch app data: ${response.status}`)
        }
      } else {
        const data: AppData = await response.json()
        setAppData(data)
        setError(null)

        // Initialize RevenueCat on first successful load
        if (!isBackgroundRefresh && data.profile?.id) {
          initRevenueCat(data.profile.id).catch((err) =>
            console.error("[AppDataProvider] RevenueCat init failed:", err)
          )
        }
        
        const endTime = performance.now()
        const duration = Math.round(endTime - startTime)
        console.log(
          `[AppDataProvider] ✅ Fetch completed in ${duration}ms`,
          isBackgroundRefresh ? "(background)" : "(initial)",
          `| Profile: ${data.profile?.name || "N/A"}`,
          `| Progress: ${data.weeklyProgress}%`,
          `| Habits: ${data.habits.length}`
        )
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load app data"
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)
      console.error(`[AppDataProvider] ❌ Error after ${duration}ms:`, err)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      fetchInProgressRef.current = false
    }
  }, [])

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchAppData(true)
  }, [fetchAppData])

  // Initial fetch on mount
  useEffect(() => {
    fetchAppData(false)
  }, [fetchAppData])

  // Background refresh on tab focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && appData) {
        // Refresh in background when user returns to tab
        console.log("[AppDataProvider] 👁️ Tab became visible, triggering background refresh")
        fetchAppData(true)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [fetchAppData, appData])

  // Optional: Periodic background refresh (every 5 minutes when tab is active)
  useEffect(() => {
    // Only set up interval if we have data and are not loading
    if (!appData || isLoading) {
      return
    }

    const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes
    console.log("[AppDataProvider] ⏱️ Periodic refresh interval set (5 minutes)")

    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        console.log("[AppDataProvider] ⏰ Periodic refresh triggered")
        fetchAppData(true)
      }
    }, REFRESH_INTERVAL)

    return () => {
      clearInterval(intervalId)
    }
  }, [fetchAppData, appData, isLoading])

  // Memoize context value to prevent unnecessary re-renders
  const value: UseAppDataReturn = React.useMemo(
    () => ({
      appData,
      isLoading,
      error,
      refresh,
      isRefreshing,
    }),
    [appData, isLoading, error, refresh, isRefreshing]
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

/**
 * Hook to access cached app data from any component
 */
export function useAppData(): UseAppDataReturn {
  const context = useContext(AppDataContext)
  
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider")
  }
  
  return context
}

