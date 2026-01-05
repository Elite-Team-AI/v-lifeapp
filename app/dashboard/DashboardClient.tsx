"use client"

import { useRouter } from "next/navigation"
import { ArrowRight, Zap, User, Settings, Sparkles, Target } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card, CardContent } from "@/components/ui/card"
import { BottomNav } from "@/components/bottom-nav"
import { CircularProgress } from "@/components/ui/circular-progress"
import { AmbientBackground } from "@/components/ambient-background"
import { VitalFlowDailyHabits } from "@/components/vitalflow-daily-habits"
import { useState, lazy, Suspense, useEffect, useMemo, memo } from "react"
import { motion } from "framer-motion"
import { useTimezoneSync } from "@/lib/hooks/use-timezone"
import { useAppData } from "@/lib/contexts/app-data-context"
import type { ProfileFormData } from "@/lib/types"

// Lazy load modals - they're only needed when opened
const UpdateProfileModal = lazy(() => import("@/app/update-profile-modal").then(m => ({ default: m.UpdateProfileModal })))
const WeeklyReflectionModal = lazy(() => import("@/app/weekly-reflection-modal").then(m => ({ default: m.WeeklyReflectionModal })))

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
} as const

function DashboardClient() {
  const router = useRouter()
  
  // Get cached app data from global context (includes daily insight, vitalflow, etc.)
  const { appData, isLoading: appDataLoading, refresh } = useAppData()
  
  // Sync user's browser timezone with profile
  useTimezoneSync()
  
  // UI states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isWeeklyReflectionModalOpen, setIsWeeklyReflectionModalOpen] = useState(false)
  
  // Derive user data from cached app data
  const userName = useMemo(() => {
    if (!appData?.profile?.name) return "there"
    return appData.profile.name.split(" ")[0]
  }, [appData?.profile?.name])
  
  const progress = useMemo(() => {
    return appData?.weeklyProgress ?? 0
  }, [appData?.weeklyProgress])
  
  const profileData = useMemo<ProfileFormData>(() => {
    if (!appData?.profile) {
      return {
        name: "",
        age: "",
        gender: "",
        heightFeet: "",
        heightInches: "",
        weight: "",
        goalWeight: "",
        primaryGoal: "",
        activityLevel: 3,
        gymAccess: "",
        selectedGym: "",
        customEquipment: "",
        allergies: [],
        customRestrictions: [],
        trainingStyle: "",
        availableTimeMinutes: 45,
        trainingDaysPerWeek: 4,
        timezone: "America/New_York",
      }
    }
    
    const profile = appData.profile
    return {
      name: profile.name || "",
      age: profile.age?.toString() || "",
      gender: profile.gender || "",
      heightFeet: profile.height_feet?.toString() || "",
      heightInches: profile.height_inches?.toString() || "",
      weight: profile.weight?.toString() || "",
      goalWeight: profile.goal_weight?.toString() || "",
      primaryGoal: profile.primary_goal || "",
      activityLevel: profile.activity_level || 3,
      gymAccess: profile.gym_access || "",
      selectedGym: profile.selected_gym || "",
      customEquipment: profile.custom_equipment || "",
      allergies: profile.allergies || [],
      customRestrictions: profile.custom_restrictions || [],
      trainingStyle: profile.training_style || "",
      availableTimeMinutes: profile.available_time_minutes || 45,
      trainingDaysPerWeek: profile.training_days_per_week || 4,
      timezone: profile.timezone || "America/New_York",
    }
  }, [appData?.profile])

  const handleProfileUpdate = async (newProfile: Partial<ProfileFormData>) => {
    // Profile was updated, trigger a refresh of app data to reflect the changes
    await refresh()
  }

  // Daily insight from batched app data (no separate fetch needed)
  const dailyInsight = appData?.dailyInsight || "Start small and build momentum. Complete one habit today!"

  // Check if we should prompt for weekly reflection (from batched app data)
  // Uses sessionStorage to prevent re-showing the modal on repeated logins/navigations
  useEffect(() => {
    if (appData?.shouldPromptWeeklyReflection) {
      // Calculate current week start (Monday) for session tracking
      const getWeekStart = () => {
        const d = new Date()
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        return new Date(d.setDate(diff)).toISOString().split("T")[0]
      }
      
      const REFLECTION_SHOWN_KEY = "v-life-weekly-reflection-shown"
      const weekStart = getWeekStart()
      const shownForWeek = sessionStorage.getItem(REFLECTION_SHOWN_KEY)
      
      // Skip if already shown this session for this week
      if (shownForWeek === weekStart) return
      
      // Delay the prompt slightly to avoid overwhelming the user on page load
      const timer = setTimeout(() => {
        sessionStorage.setItem(REFLECTION_SHOWN_KEY, weekStart)
        setIsWeeklyReflectionModalOpen(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [appData?.shouldPromptWeeklyReflection])

  // Show loading state while app data is being fetched
  if (appDataLoading && !appData) {
    return (
      <div className="min-h-screen pb-nav-safe relative flex items-center justify-center">
        <AmbientBackground />
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="text-foreground/70">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-nav-safe relative">
      <AmbientBackground />
      
      <motion.div 
        className="container max-w-md px-4 py-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Hi, <span className="gradient-text">{userName || "there"}</span> 👋
              </h1>
              <p className="text-muted-foreground mt-1">Let&apos;s crush your goals today</p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <ButtonGlow variant="outline-glow" size="icon" onClick={() => router.push("/settings")} className="h-10 w-10">
                <Settings className="h-5 w-5" />
              </ButtonGlow>
            </motion.div>
          </div>
        </motion.div>

        {/* Progress Card - Now with Circular Progress */}
        <motion.div className="mb-6" variants={itemVariants}>
          <Card className="glass-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                {/* Circular Progress */}
                <CircularProgress value={progress} size={100} strokeWidth={8} label="weekly" />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-5 w-5 text-accent" />
                    <h2 className="text-lg font-bold text-foreground">Weekly Progress</h2>
                  </div>
                  
                  <div className="flex gap-2">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                      <ButtonGlow
                        variant="outline-glow"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setIsProfileModalOpen(true)}
                      >
                        <User className="mr-1 h-3 w-3" /> Profile
                      </ButtonGlow>
                    </motion.div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* VitalFlow Daily Habits - AI-powered suggestions (with batched initial data) */}
        <motion.div className="mb-6" variants={itemVariants}>
          <VitalFlowDailyHabits initialSuggestions={appData?.vitalFlowSuggestions} />
        </motion.div>

        {/* AI Tip of the Day */}
        <motion.div className="mb-6" variants={itemVariants}>
          <Card className="glass-card overflow-hidden relative">
            {/* Decorative gradient accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/20 to-transparent rounded-bl-full" />
            
            <CardContent className="p-5 relative">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  AI Insight
                </h2>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Zap className="h-5 w-5 text-accent-warm" />
                </motion.div>
              </div>
              <p className="text-foreground/70 leading-relaxed">
                {dailyInsight}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA Button */}
        <motion.div variants={itemVariants}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <ButtonGlow variant="accent-glow" className="w-full h-14 text-base font-semibold" onClick={() => router.push("/fitness")}>
              Start Today&apos;s Workout <ArrowRight className="ml-2 h-5 w-5" />
            </ButtonGlow>
          </motion.div>
        </motion.div>
      </motion.div>

      <BottomNav />
      
      {/* Lazy-loaded modals with Suspense */}
      {isProfileModalOpen && (
        <Suspense fallback={null}>
          <UpdateProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            currentProfile={profileData}
            onUpdate={(profile) => handleProfileUpdate(profile)}
          />
        </Suspense>
      )}
      {isWeeklyReflectionModalOpen && (
        <Suspense fallback={null}>
          <WeeklyReflectionModal
            isOpen={isWeeklyReflectionModalOpen}
            onClose={() => setIsWeeklyReflectionModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  )
}

// Export memoized component to prevent unnecessary re-renders
export default memo(DashboardClient)

