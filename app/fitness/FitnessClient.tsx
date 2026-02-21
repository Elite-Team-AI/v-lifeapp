"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Settings, Target, Dumbbell, Calendar, ArrowRight, Sparkles, Zap, Clock, Info } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useAppData } from "@/lib/contexts/app-data-context"
import { useFitnessData } from "@/hooks/use-fitness-data"
import { Skeleton } from "@/components/ui/skeleton-loaders"

export function FitnessClient() {
  const router = useRouter()
  const [showRestDayInfo, setShowRestDayInfo] = useState(false)
  
  // Get user name from cached app data (instant)
  const { appData } = useAppData()
  const userName = useMemo(() => {
    if (!appData?.profile?.name) return "there"
    return appData.profile.name.split(" ")[0]
  }, [appData?.profile?.name])

  // Fetch fitness-specific data client-side
  const { data, isLoading } = useFitnessData()

  const activeWorkout = data?.activeWorkout ?? null
  const overview = data?.overview
  const programmingContext = data?.programmingContext

  const weeklyHighlights = useMemo(() => {
    if (!overview) return { workouts: 0, volume: 0, cardioMinutes: 0 }
    const latestWeek = overview.weeklyWorkoutData.at(-1)
    return {
      workouts: latestWeek?.workouts || 0,
      volume: latestWeek ? Math.round(latestWeek.volume) : 0,
      cardioMinutes: latestWeek?.cardioMinutes || 0,
    }
  }, [overview])

  return (
    <div className="min-h-screen bg-black overflow-hidden pb-nav-safe">
      {/* Animated gradient background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px] animate-blob" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

      <div className="relative z-10 container max-w-md px-4 py-6 space-y-6">
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <motion.p
              className="text-white/60 text-sm leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Welcome back
            </motion.p>
            <motion.h1
              className="text-2xl font-bold tracking-tight font-heading bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Hey {userName || "there"} 👋
            </motion.h1>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <ButtonGlow variant="outline-glow" size="icon" onClick={() => router.push("/settings")} className="h-9 w-9">
              <Settings className="h-4 w-4" />
            </ButtonGlow>
          </motion.div>
        </motion.div>

        {/* AI Fitness Coach CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-2"
        >
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
              <ButtonGlow
                variant="accent-glow"
                className="w-full h-14 text-base font-semibold tracking-wide relative bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500"
                onClick={() => router.push("/ai-coach")}
              >
                🏋️ Access AI Fitness Coach
              </ButtonGlow>
            </div>
          </motion.div>
          <motion.p
            className="text-xs text-white/50 text-center px-4 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Camera-based movement tracking for at-home workouts. Beginner-friendly, mobility-friendly, and great for all ages.
          </motion.p>
        </motion.div>

        {/* Today's Programming Context */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <Card className="border-accent/30 backdrop-blur-xl bg-white/5 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
            <CardContent className="p-4">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent rounded-lg" />
              {isLoading || !programmingContext ? (
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ) : (
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center"
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Sparkles className="h-5 w-5 text-accent" />
                    </motion.div>
                    <div>
                      <p className="text-sm text-white/60">{programmingContext.dayName}</p>
                      <p className="text-white font-semibold">{programmingContext.emphasis}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40">Week Phase</p>
                    <p className="text-sm text-accent font-medium">{programmingContext.weekPhase}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <Card className="border-white/10 backdrop-blur-xl bg-white/5 text-center">
              <CardContent className="p-3">
                <p className="text-xs text-white/60 tracking-wide uppercase">This Week</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-8 mx-auto mt-1" />
                ) : (
                  <p className="text-xl font-bold tracking-tight bg-gradient-to-r from-accent to-yellow-300 bg-clip-text text-transparent">
                    {weeklyHighlights.workouts}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.75 }}
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <Card className="border-white/10 backdrop-blur-xl bg-white/5 text-center">
              <CardContent className="p-3">
                <p className="text-xs text-white/60 tracking-wide uppercase">Volume</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-12 mx-auto mt-1" />
                ) : (
                  <p className="text-xl font-bold tracking-tight bg-gradient-to-r from-accent to-yellow-300 bg-clip-text text-transparent">
                    {weeklyHighlights.volume}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <Card className="border-white/10 backdrop-blur-xl bg-white/5 text-center">
              <CardContent className="p-3">
                <p className="text-xs text-white/60 tracking-wide uppercase">Cardio</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-10 mx-auto mt-1" />
                ) : (
                  <p className="text-xl font-bold tracking-tight bg-gradient-to-r from-accent to-yellow-300 bg-clip-text text-transparent">
                    {weeklyHighlights.cardioMinutes}m
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <Card className="border-white/10 backdrop-blur-xl bg-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-accent" />
                <p className="text-sm text-white/70 font-medium tracking-wide">Monthly Overview</p>
              </div>
              {isLoading || !overview ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ) : (
                <div className="space-y-1 text-sm text-white/80 leading-relaxed">
                  <p>Total workouts this month: <span className="font-semibold tracking-wide text-accent">{overview.totalWorkoutsThisMonth}</span></p>
                  <p>Avg weekly sessions: <span className="font-semibold tracking-wide text-accent">{overview.avgWorkoutsPerWeek}</span></p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-3">
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                Today&apos;s Workout
              </h2>
              <motion.button
                onClick={() => setShowRestDayInfo(true)}
                className="p-1 rounded-full hover:bg-accent/10 transition-colors"
                aria-label="About rest days and workout splits"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Info className="h-4 w-4 text-muted-foreground hover:text-accent" />
              </motion.button>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ButtonGlow variant="outline-glow" size="sm" onClick={() => router.push("/workout")}>
                View Plan
              </ButtonGlow>
            </motion.div>
          </motion.div>
          
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.95 }}
            >
              <Card className="border-white/10 backdrop-blur-xl bg-white/5">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-6 w-48 rounded-lg" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-10 w-full rounded-md" />
                </CardContent>
              </Card>
            </motion.div>
          ) : programmingContext?.isSunday ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.95 }}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <Card className="border-green-500/30 backdrop-blur-xl bg-white/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                <CardContent className="p-4 space-y-3">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-lg" />
                  <div className="relative flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Target className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Rest & Recovery Day</p>
                      <p className="text-sm text-white/60">Take time to recover. Light stretching or a walk is optional.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : activeWorkout ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.95 }}
              whileHover={{ scale: 1.01, y: -2 }}
            >
              <Card className="border-white/10 backdrop-blur-xl bg-white/5 overflow-hidden">
                <CardContent className="p-4 space-y-4">
                  {/* Workout Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-white font-bold">{activeWorkout.name}</p>
                        <p className="text-xs text-white/50 capitalize">{activeWorkout.workoutType || "Strength"}</p>
                      </div>
                    </div>
                    {activeWorkout.durationMinutes && (
                      <div className="flex items-center gap-1 text-white/60 text-sm">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{activeWorkout.durationMinutes}m</span>
                      </div>
                    )}
                  </div>

                  {/* AI Badge */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg w-fit">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs text-accent font-medium">AI-Generated for {programmingContext?.dayName}</span>
                  </div>

                  {/* Exercises Preview */}
                  <div className="space-y-2">
                    {activeWorkout.exercises.slice(0, 4).map((exercise, index) => (
                      <motion.div
                        key={exercise.workoutExerciseId}
                        className="flex justify-between items-center py-2 border-b border-white/5 last:border-0"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <span className="text-sm text-white/80">{exercise.name}</span>
                        <span className="text-sm text-white/50 font-mono">
                          {exercise.sets} × {exercise.reps}
                        </span>
                      </motion.div>
                    ))}
                    {activeWorkout.exercises.length > 4 && (
                      <p className="text-xs text-white/40 text-center pt-1">
                        +{activeWorkout.exercises.length - 4} more exercises
                      </p>
                    )}
                  </div>

                  {/* Conditioning Notes */}
                  {activeWorkout.conditioningNotes && (
                    <div className="backdrop-blur-xl bg-white/5 rounded-lg p-3 border border-accent/20">
                      <p className="text-xs text-accent font-semibold mb-1">Conditioning</p>
                      <p className="text-sm text-white/70">{activeWorkout.conditioningNotes}</p>
                    </div>
                  )}

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                      <ButtonGlow variant="accent-glow" className="w-full relative" onClick={() => router.push("/workout")}>
                        Start Workout <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </ButtonGlow>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.95 }}
            >
              <Card className="border-white/10 backdrop-blur-xl bg-white/5">
                <CardContent className="p-4">
                  <p className="text-sm text-white/60">Loading your AI-generated workout...</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <Card className="border-white/10 backdrop-blur-xl bg-white/5">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                Recent Performance
              </h3>
              {isLoading || !overview ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ) : (
                <ul className="space-y-1 text-sm text-white/70">
                  <li>
                    Workout change: <span className={overview.workoutChange >= 0 ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                      {overview.workoutChange >= 0 ? "+" : ""}{overview.workoutChange.toFixed(1)}%
                    </span>
                  </li>
                  <li>
                    Volume change: <span className={overview.volumeChange >= 0 ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                      {overview.volumeChange >= 0 ? "+" : ""}{overview.volumeChange.toFixed(1)}%
                    </span>
                  </li>
                  <li>
                    Cardio change: <span className={overview.cardioChange >= 0 ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                      {overview.cardioChange >= 0 ? "+" : ""}{overview.cardioChange.toFixed(1)}%
                    </span>
                  </li>
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <BottomNav />
      
      {/* Rest Day & Workout Split Info Modal */}
      <Dialog open={showRestDayInfo} onOpenChange={setShowRestDayInfo}>
        <DialogContent className="max-w-md backdrop-blur-xl bg-black/95 border-accent/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              <span className="bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent">
                Workout Splits & Rest Days
              </span>
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Understanding your weekly workout structure
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <motion.div
              className="backdrop-blur-xl bg-white/5 border border-accent/20 rounded-lg p-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="font-semibold text-accent mb-1">📅 Weekly Split</p>
              <p className="text-white/70">
                Your workouts are designed to target different muscle groups each day,
                allowing proper recovery while maximizing progress.
              </p>
            </motion.div>
            <motion.div
              className="backdrop-blur-xl bg-white/5 border border-accent/20 rounded-lg p-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="font-semibold text-accent mb-1">🧘 Rest Days</p>
              <p className="text-white/70">
                Rest days are essential for muscle recovery and growth. Don&apos;t skip them –
                your body builds muscle during rest, not during workouts.
              </p>
            </motion.div>
            <motion.div
              className="backdrop-blur-xl bg-white/5 border border-accent/20 rounded-lg p-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="font-semibold text-accent mb-1">🚶 Active Recovery</p>
              <p className="text-white/70">
                On rest days, light activity like walking, stretching, or yoga helps
                maintain blood flow and reduce soreness without stressing your muscles.
              </p>
            </motion.div>
            <motion.div
              className="backdrop-blur-xl bg-white/5 border border-accent/20 rounded-lg p-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="font-semibold text-accent mb-1">⚡ What to Expect</p>
              <p className="text-white/70">
                A typical week includes training days and rest/recovery days.
                The AI adjusts your split based on your goals and availability.
              </p>
            </motion.div>
          </div>
          <motion.div
            className="mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
              <ButtonGlow
                variant="accent-glow"
                className="w-full relative"
                onClick={() => setShowRestDayInfo(false)}
              >
                Got it!
              </ButtonGlow>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
