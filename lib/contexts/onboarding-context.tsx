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
  trainingStyle: "",
  availableTimeMinutes: 45,
  trainingDaysPerWeek: 4,

  // Preferences data
  allergies: [],
  customRestrictions: [],
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

function getStoredData(): OnboardingData {
  if (typeof window === "undefined") return defaultData
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultData, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.error("[Onboarding] Failed to parse stored data:", e)
  }
  return defaultData
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    const stored = getStoredData()
    setData(stored)
    setIsHydrated(true)
  }, [])

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => {
      const newData = { ...prev, ...updates }
      // Persist to sessionStorage
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
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
    return null
  }

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
