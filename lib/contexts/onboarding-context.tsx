"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { OnboardingData } from "@/lib/types"

interface OnboardingContextType {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  clearData: () => void
}

const STORAGE_KEY = "v-life-onboarding"

const defaultData: OnboardingData = {
  // Profile data
  name: "",
  age: "",
  gender: "",
  heightFeet: "",
  heightInches: "",
  weight: "",
  goalWeight: "",
  gymAccess: "",
  selectedGym: "",
  customEquipment: "",
  activityLevel: 3,

  // Goals data
  primaryGoal: "",

  // Training preferences
  programType: "",
  customProgramType: "",
  availableTimeMinutes: 45,
  trainingDaysPerWeek: 4,

  // Preferences data
  allergies: [],
  customRestrictions: [],
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

function getStoredData(): OnboardingData {
  if (typeof window === "undefined") {
    console.log("[Onboarding] getStoredData: Running on server, returning defaultData")
    return defaultData
  }
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    console.log("[Onboarding] getStoredData: Retrieved from sessionStorage:", stored)
    if (stored) {
      const parsed = JSON.parse(stored)
      const merged = { ...defaultData, ...parsed }
      console.log("[Onboarding] getStoredData: Parsed and merged data:", merged)
      return merged
    }
    console.log("[Onboarding] getStoredData: No stored data found, using defaultData")
  } catch (e) {
    console.error("[Onboarding] Failed to parse stored data:", e)
  }
  return defaultData
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData)
  const [isHydrated, setIsHydrated] = useState(false)

  // Check if sessionStorage is available
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const testKey = "__test__"
        sessionStorage.setItem(testKey, "test")
        const testValue = sessionStorage.getItem(testKey)
        sessionStorage.removeItem(testKey)
        if (testValue === "test") {
          console.log("[Onboarding] sessionStorage is available and working")
        } else {
          console.error("[Onboarding] sessionStorage test failed - data can't be stored!")
        }
      } catch (e) {
        console.error("[Onboarding] sessionStorage is not available or is blocked:", e)
      }
    }
  }, [])

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    console.log("[Onboarding] Provider mounting, hydrating from sessionStorage...")
    const stored = getStoredData()
    console.log("[Onboarding] Hydrated data:", stored)
    setData(stored)
    setIsHydrated(true)
    console.log("[Onboarding] Hydration complete, isHydrated=true")
  }, [])

  const updateData = (updates: Partial<OnboardingData>) => {
    console.log("[Onboarding] updateData called with updates:", updates)
    setData((prev) => {
      console.log("[Onboarding] updateData - previous data:", prev)
      const newData = { ...prev, ...updates }
      console.log("[Onboarding] updateData - new merged data:", newData)
      // Persist to sessionStorage
      try {
        const jsonString = JSON.stringify(newData)
        sessionStorage.setItem(STORAGE_KEY, jsonString)
        console.log("[Onboarding] Successfully saved to sessionStorage:", jsonString)

        // Verify it was saved
        const verification = sessionStorage.getItem(STORAGE_KEY)
        console.log("[Onboarding] Verification read from sessionStorage:", verification)

        if (verification !== jsonString) {
          console.error("[Onboarding] DATA MISMATCH! Saved data doesn't match what was written!")
        }
      } catch (e) {
        console.error("[Onboarding] Failed to save data:", e)
      }
      return newData
    })
  }

  const clearData = () => {
    setData(defaultData)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error("[Onboarding] Failed to clear data:", e)
    }
  }

  // Don't render children until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    console.log("[Onboarding] Provider not yet hydrated, rendering null")
    return null
  }

  console.log("[Onboarding] Provider rendering with data:", data)

  return (
    <OnboardingContext.Provider value={{ data, updateData, clearData }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
