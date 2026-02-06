"use client"

import { useRouter } from "next/navigation"
import { ArrowRight, Settings, Dumbbell, Zap } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { BottomNav } from "@/components/bottom-nav"
import { AmbientBackground } from "@/components/ambient-background"
import { useState, lazy, Suspense, useEffect, useMemo, memo } from "react"
import { motion } from "framer-motion"
import { useTimezoneSync } from "@/lib/hooks/use-timezone"
import { useAppData } from "@/lib/contexts/app-data-context"
import type { ProfileFormData } from "@/lib/types"

// Gamification Components
import {
  LevelBadge,
  StreakFireRing,
  DailyMissions,
  PowerStats,
  AchievementCarousel,
  MotivationalBanner,
} from "@/components/gamification"

// Lazy load modals
const UpdateProfileModal = lazy(() => import("@/app/update-profile-modal").then(m => ({ default: m.UpdateProfileModal })))
const WeeklyReflectionModal = lazy(() => import("@/app/weekly-reflection-modal").then(m => ({ default: m.WeeklyReflectionModal })))
const ManageSubscriptionModal = lazy(() => import("@/app/manage-subscription-modal").then(m => ({ default: m.ManageSubscriptionModal })))

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

function DashboardClientV2() {
  const router = useRouter()
  
  const { appData, isLoading: appDataLoading, refresh } = useAppData()
  
  useTimezoneSync()
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isWeeklyReflectionModalOpen, setIsWeeklyReflectionModalOpen] = useState(false)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  
  // Derived data
  const userName = useMemo(() => {
    if (!appData?.profile?.name) return undefined
    return appData.profile.name.split(" ")[0]
  }, [appData?.profile?.name])
  
  const streakDays = useMemo(() => {
    return appData?.streakStats?.overallStreak ?? 0
  }, [appData?.streakStats?.overallStreak])

  const gamificationStats = useMemo(() => {
    return appData?.gamification ?? null
  }, [appData?.gamification])

  const vitalFlowMissions = useMemo(() => {
    return appData?.vitalFlowSuggestions ?? []
  }, [appData?.vitalFlowSuggestions])

  const completedMissionsCount = useMemo(() => {
    return vitalFlowMissions.filter(m => m.status === 'completed').length
  }, [vitalFlowMissions])

  // Power stats data
  const powerStatsData = useMemo(() => {
    const weeklyActivity = appData?.streakStats?.weeklyActivity ?? []
    const workoutDays = weeklyActivity.filter(d => d.active).length
    const previousWorkoutDays = Math.max(0, workoutDays - 1) // Simplified comparison
    
    const habitsCompleted = appData?.habits?.filter(h => h.completed).length ?? 0
    const totalHabits = appData?.habits?.length ?? 1
    const habitRate = totalHabits > 0 ? Math.round((habitsCompleted / totalHabits) * 100) : 0
    
    const weeklyProgress = appData?.weeklyProgress ?? 0

    return {
      workoutStreak: {
        current: workoutDays,
        previous: previousWorkoutDays,
        label: "This Week",
        suffix: " days"
      },
      nutritionScore: {
        current: weeklyProgress,
        previous: Math.max(0, weeklyProgress - 5),
        label: "Progress",
        suffix: "%"
      },
      habitCompletion: {
        current: habitRate,
        previous: Math.max(0, habitRate - 10),
        label: "Habits",
        suffix: "%"
      }
    }
  }, [appData?.streakStats?.weeklyActivity, appData?.habits, appData?.weeklyProgress])
  
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
        programType: "",
        customProgramType: "",
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
      programType: profile.training_style?.startsWith("other:") ? "other" : (profile.training_style || ""),
      customProgramType: profile.training_style?.startsWith("other:") ? profile.training_style.substring(6) : "",
      availableTimeMinutes: profile.available_time_minutes || 45,
      trainingDaysPerWeek: profile.training_days_per_week || 4,
      timezone: profile.timezone || "America/New_York",
    }
  }, [appData?.profile])

  const handleProfileUpdate = async () => {
    await refresh()
  }

  const handleMissionComplete = async () => {
    // Refresh to get updated XP
    await refresh()
  }

  // Check if we should prompt for weekly reflection
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
      
      const timer = setTimeout(() => {
        sessionStorage.setItem(REFLECTION_SHOWN_KEY, weekStart)
        setIsWeeklyReflectionModalOpen(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [appData?.shouldPromptWeeklyReflection])

  // Loading state
  if (appDataLoading && !appData) {
    return (
      <div className="min-h-screen pb-nav-safe relative flex items-center justify-center">
        <AmbientBackground />
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="text-foreground/70">Loading your arena...</p>
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
        {/* Header with Level Badge */}
        <motion.div className="mb-6" variants={itemVariants}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {gamificationStats && (
                <LevelBadge stats={gamificationStats} showXPProgress />
              )}
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <ButtonGlow 
                variant="outline-glow" 
                size="icon" 
                onClick={() => router.push("/settings")} 
                className="h-10 w-10"
              >
                <Settings className="h-5 w-5" />
              </ButtonGlow>
            </motion.div>
          </div>
        </motion.div>

        {/* Motivational Banner */}
        <motion.div className="mb-6" variants={itemVariants}>
          <MotivationalBanner
            userName={userName}
            streakDays={streakDays}
            missionsCompleted={completedMissionsCount}
            totalMissions={vitalFlowMissions.length}
            currentLevel={gamificationStats?.currentLevel ?? 1}
            todayXP={appData?.todayXP ?? 0}
          />
        </motion.div>

        {/* Streak Fire Ring - Centered */}
        <motion.div className="mb-6" variants={itemVariants}>
          <div className="flex justify-center">
            <StreakFireRing streakDays={streakDays} size="sm" />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div className="space-y-3 mb-6" variants={itemVariants}>
          {/* Primary CTA - Start Workout */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <ButtonGlow 
              variant="accent-glow" 
              className="w-full h-14 text-base font-semibold" 
              onClick={() => router.push("/fitness")}
            >
              <Dumbbell className="mr-2 h-5 w-5" />
              Start Today's Workout 
              <ArrowRight className="ml-2 h-5 w-5" />
            </ButtonGlow>
          </motion.div>

          {/* Secondary Actions Row */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <ButtonGlow 
                variant="outline-glow" 
                className="w-full h-12 text-sm"
                onClick={() => router.push("/nutrition")}
              >
                🥗 Nutrition
              </ButtonGlow>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <ButtonGlow 
                variant="outline-glow" 
                className="w-full h-12 text-sm"
                onClick={() => router.push("/vbot")}
              >
                🤖 VBot
              </ButtonGlow>
            </motion.div>
          </div>
        </motion.div>

        {/* Upgrade Banner - Free users only */}
        {appData?.subscription?.plan === "free" && (
          <motion.div className="mb-6" variants={itemVariants}>
            <motion.button
              className="w-full flex items-center gap-3 rounded-xl border border-accent/20 bg-gradient-to-r from-accent/10 to-accent/5 px-4 py-3 text-left"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsUpgradeModalOpen(true)}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20">
                <Zap className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Upgrade to Pro</p>
                <p className="text-xs text-white/50">Unlock AI coaching, unlimited plans & more</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-accent/60" />
            </motion.button>
          </motion.div>
        )}

        {/* Power Stats - Horizontal Row */}
        <motion.div className="mb-6" variants={itemVariants}>
          <PowerStats
            workoutStreak={powerStatsData.workoutStreak}
            nutritionScore={powerStatsData.nutritionScore}
            habitCompletion={powerStatsData.habitCompletion}
          />
        </motion.div>

        {/* Daily Missions */}
        <motion.div className="mb-6" variants={itemVariants}>
          <DailyMissions 
            missions={vitalFlowMissions as any}
            onMissionComplete={handleMissionComplete}
          />
        </motion.div>

        {/* Achievements Carousel */}
        {(appData?.allAchievements?.length ?? 0) > 0 && (
          <motion.div className="mb-6" variants={itemVariants}>
            <AchievementCarousel
              allAchievements={appData?.allAchievements ?? []}
              unlockedAchievements={appData?.unlockedAchievements ?? []}
            />
          </motion.div>
        )}
      </motion.div>

      <BottomNav />
      
      {/* Modals */}
      {isProfileModalOpen && (
        <Suspense fallback={null}>
          <UpdateProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            currentProfile={profileData}
            onUpdate={handleProfileUpdate}
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
      {isUpgradeModalOpen && (
        <Suspense fallback={null}>
          <ManageSubscriptionModal
            isOpen={isUpgradeModalOpen}
            onClose={() => setIsUpgradeModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  )
}

export default memo(DashboardClientV2)
