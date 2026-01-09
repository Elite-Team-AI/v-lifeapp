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
    <div className="min-h-screen bg-gradient-to-b from-black to-charcoal pb-nav-safe">
      <div className="container max-w-md px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Welcome back</p>
            <h1 className="text-2xl font-bold text-white">Hey {userName || "there"} 👋</h1>
          </div>
          <ButtonGlow variant="outline-glow" size="icon" onClick={() => router.push("/settings")} className="h-9 w-9">
            <Settings className="h-4 w-4" />
          </ButtonGlow>
        </div>

        {/* AI Fitness Coach CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-2"
        >
          <ButtonGlow
            variant="accent-glow"
            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500"
            onClick={() => router.push("/ai-coach")}
          >
            🏋️ Access AI Fitness Coach
          </ButtonGlow>
          <p className="text-xs text-white/50 text-center px-4">
            Camera-based movement tracking for at-home workouts. Beginner-friendly, mobility-friendly, and great for all ages.
          </p>
        </motion.div>

        {/* Today's Programming Context */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-accent/20 bg-gradient-to-br from-accent/10 to-transparent">
            <CardContent className="p-4">
              {isLoading || !programmingContext ? (
                <div className="flex items-center justify-between">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-accent" />
                    </div>
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

        <motion.div
          className="grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-white/10 bg-black/50 text-center">
            <CardContent className="p-3">
              <p className="text-xs text-white/60">This Week</p>
              {isLoading ? (
                <Skeleton className="h-7 w-8 mx-auto mt-1" />
              ) : (
                <p className="text-xl font-bold text-white">{weeklyHighlights.workouts}</p>
              )}
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-black/50 text-center">
            <CardContent className="p-3">
              <p className="text-xs text-white/60">Volume</p>
              {isLoading ? (
                <Skeleton className="h-7 w-12 mx-auto mt-1" />
              ) : (
                <p className="text-xl font-bold text-white">{weeklyHighlights.volume}</p>
              )}
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-black/50 text-center">
            <CardContent className="p-3">
              <p className="text-xs text-white/60">Cardio</p>
              {isLoading ? (
                <Skeleton className="h-7 w-10 mx-auto mt-1" />
              ) : (
                <p className="text-xl font-bold text-white">{weeklyHighlights.cardioMinutes}m</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <Card className="border-white/10 bg-black/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-accent" />
              <p className="text-sm text-white/70">Monthly Overview</p>
            </div>
            {isLoading || !overview ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : (
              <div className="space-y-1 text-sm text-white/80">
                <p>Total workouts this month: {overview.totalWorkoutsThisMonth}</p>
                <p>Avg weekly sessions: {overview.avgWorkoutsPerWeek}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                Today&apos;s Workout
              </h2>
              <button
                onClick={() => setShowRestDayInfo(true)}
                className="p-1 rounded-full hover:bg-accent/10 transition-colors"
                aria-label="About rest days and workout splits"
              >
                <Info className="h-4 w-4 text-muted-foreground hover:text-accent" />
              </button>
            </div>
            <ButtonGlow variant="outline-glow" size="sm" onClick={() => router.push("/workout")}>
              View Plan
            </ButtonGlow>
          </div>
          
          {isLoading ? (
            <Card className="border-white/10 bg-black/60">
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
          ) : programmingContext?.isSunday ? (
            <Card className="border-white/10 bg-black/60">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
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
          ) : activeWorkout ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="border-white/10 bg-black/60 overflow-hidden">
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
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-accent font-semibold mb-1">Conditioning</p>
                      <p className="text-sm text-white/70">{activeWorkout.conditioningNotes}</p>
                    </div>
                  )}

                  <ButtonGlow variant="accent-glow" className="w-full" onClick={() => router.push("/workout")}>
                    Start Workout <ArrowRight className="ml-2 h-4 w-4" />
                  </ButtonGlow>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="border-white/10 bg-black/60">
              <CardContent className="p-4">
                <p className="text-sm text-white/60">Loading your AI-generated workout...</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="border-white/10 bg-black/50">
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
                  Workout change: {overview.workoutChange >= 0 ? "+" : ""}
                  {overview.workoutChange.toFixed(1)}%
                </li>
                <li>
                  Volume change: {overview.volumeChange >= 0 ? "+" : ""}
                  {overview.volumeChange.toFixed(1)}%
                </li>
                <li>
                  Cardio change: {overview.cardioChange >= 0 ? "+" : ""}
                  {overview.cardioChange.toFixed(1)}%
                </li>
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
      
      {/* Rest Day & Workout Split Info Modal */}
      <Dialog open={showRestDayInfo} onOpenChange={setShowRestDayInfo}>
        <DialogContent className="max-w-md bg-black/95 border-accent/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Workout Splits & Rest Days
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Understanding your weekly workout structure
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="font-semibold text-accent mb-1">📅 Weekly Split</p>
              <p className="text-white/70">
                Your workouts are designed to target different muscle groups each day, 
                allowing proper recovery while maximizing progress.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="font-semibold text-accent mb-1">🧘 Rest Days</p>
              <p className="text-white/70">
                Rest days are essential for muscle recovery and growth. Don&apos;t skip them – 
                your body builds muscle during rest, not during workouts.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="font-semibold text-accent mb-1">🚶 Active Recovery</p>
              <p className="text-white/70">
                On rest days, light activity like walking, stretching, or yoga helps 
                maintain blood flow and reduce soreness without stressing your muscles.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="font-semibold text-accent mb-1">⚡ What to Expect</p>
              <p className="text-white/70">
                A typical week includes training days and rest/recovery days. 
                The AI adjusts your split based on your goals and availability.
              </p>
            </div>
          </div>
          <ButtonGlow 
            variant="accent-glow" 
            className="w-full mt-2"
            onClick={() => setShowRestDayInfo(false)}
          >
            Got it!
          </ButtonGlow>
        </DialogContent>
      </Dialog>
    </div>
  )
}
