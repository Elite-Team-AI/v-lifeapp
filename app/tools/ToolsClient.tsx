"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { PlusCircle, LineChart, Weight, Camera, Pill, Dumbbell, Activity, TrendingUp, TrendingDown, ArrowLeftRight, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Line, LineChart as RechartsLineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Tooltip, Legend, AreaChart, Area } from "recharts"
import { BottomNav } from "@/components/bottom-nav"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card, CardContent } from "@/components/ui/card"
import { AddHabitModal } from "@/app/add-habit-modal"
import { UpdateWeightModal } from "@/app/update-weight-modal"
import { ProgressPhotoModal } from "@/app/progress-photo-modal"
import type { HabitWithStatus, ProgressPhoto, Supplement, WeightEntry } from "@/lib/types"
import type { WorkoutOverview } from "@/lib/actions/workouts"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface ToolsClientProps {
  weightEntries: WeightEntry[]
  progressPhotos: ProgressPhoto[]
  supplements: Supplement[]
  habits: HabitWithStatus[]
  initialSupplementId?: string | null
  workoutOverview?: WorkoutOverview
}

interface ProgressPhotoPreview {
  id: string
  date: string
  weight?: number | null
  note?: string | null
  type: string
  imageUrl: string
}

export function ToolsClient({ weightEntries, progressPhotos, supplements, habits, initialSupplementId = null, workoutOverview }: ToolsClientProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [addHabitModalOpen, setAddHabitModalOpen] = useState(false)
  const [updateWeightModalOpen, setUpdateWeightModalOpen] = useState(false)
  const [progressPhotoModalOpen, setProgressPhotoModalOpen] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedPhotosForCompare, setSelectedPhotosForCompare] = useState<[ProgressPhotoPreview | null, ProgressPhotoPreview | null]>([null, null])

  const [habitList, setHabitList] = useState<HabitWithStatus[]>(habits)
  const [photoPreviews, setPhotoPreviews] = useState<ProgressPhotoPreview[]>([])
  const [expandedSupplement, setExpandedSupplement] = useState<string | null>(initialSupplementId)
  const supplementsSectionRef = useRef<HTMLDivElement | null>(null)

  const currentWeight = weightEntries[weightEntries.length - 1]?.weight || null

  const chartData = useMemo(() => {
    if (weightEntries.length === 0) return []

    return weightEntries.map((entry) => ({
      date: new Date(entry.logged_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      weight: Number(entry.weight),
    }))
  }, [weightEntries])

  const weightHistory = weightEntries.slice(-5).reverse()

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    const loadSignedUrls = async () => {
      const previews: ProgressPhotoPreview[] = []
      for (const photo of progressPhotos) {
        let displayUrl = "/placeholder.svg"
        if (photo.image_url) {
          const { data: signed } = await supabase.storage.from("progress-photos").createSignedUrl(photo.image_url, 60 * 60 * 24)
          if (signed?.signedUrl) {
            displayUrl = signed.signedUrl
          }
        }
        previews.push({
          id: photo.id,
          date: photo.taken_at || photo.created_at || "",
          weight: (photo as any).weight || null,
          note: photo.note || null,
          type: (photo as any).photo_type || null,
          imageUrl: displayUrl,
        })
      }
      if (isMounted) {
        setPhotoPreviews(previews)
      }
    }

    loadSignedUrls()
    return () => {
      isMounted = false
    }
  }, [progressPhotos])

  useEffect(() => {
    if (initialSupplementId && supplements.some((s) => s.id === initialSupplementId)) {
      // Scroll the supplements section into view when arriving with a deep link.
      supplementsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      setExpandedSupplement(initialSupplementId)
    }
  }, [initialSupplementId, supplements])

  const handleAddHabit = async (habit: { name: string; category: string; frequency: string }) => {
    try {
      const { createHabit } = await import("@/lib/actions/habits")
      const result = await createHabit(habit.name, habit.category, habit.frequency)
      if (result.success && result.habit) {
        toast({
          title: "Habit added",
          description: `${habit.name} is now in your routine.`,
        })
        setHabitList((prev) => [...prev, result.habit!])
        router.refresh()
      } else {
        toast({
          title: "Unable to add habit",
          description: result.error || "Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[Tools] Failed to add habit:", error)
      toast({
        title: "Unable to add habit",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleWeightUpdated = () => {
    router.refresh()
  }

  const handlePhotoAdded = () => {
    router.refresh()
  }

  const handleSelectPhotoForCompare = (photo: ProgressPhotoPreview, slot: 0 | 1) => {
    setSelectedPhotosForCompare(prev => {
      const newSelection = [...prev] as [ProgressPhotoPreview | null, ProgressPhotoPreview | null]
      newSelection[slot] = photo
      return newSelection
    })
  }

  const clearCompareSelection = () => {
    setSelectedPhotosForCompare([null, null])
    setCompareMode(false)
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `${(volume / 1000).toFixed(0)}K`
    return volume.toFixed(0)
  }

  return (
    <div className="min-h-screen bg-black pb-nav-safe overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px] animate-blob" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

      <div className="relative z-10 container max-w-md px-4 py-6">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1
            className="text-3xl font-bold bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Tools
          </motion.h1>
          <motion.p
            className="text-white/70 mt-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Track your progress
          </motion.p>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.01, y: -2 }}
        >
          <Card className="border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <motion.h2
                  className="text-lg font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Weight Trend
                </motion.h2>
                <motion.div
                  className="flex items-center text-accent"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45 }}
                >
                  <LineChart className="h-5 w-5 mr-2 drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]" />
                  <span className="text-sm font-medium">{currentWeight ? `${currentWeight} lbs` : "Add entry"}</span>
                </motion.div>
              </div>

              {chartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="rgba(255,255,255,0.5)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        domain={["dataMin - 2", "dataMax + 2"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="hsl(var(--accent))"
                        strokeWidth={3}
                        dot={{
                          r: 4,
                          fill: "hsl(var(--accent))",
                          strokeWidth: 2,
                          stroke: "#000",
                        }}
                        activeDot={{
                          r: 6,
                          fill: "hsl(var(--accent))",
                          strokeWidth: 2,
                          stroke: "#000",
                        }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-white/60 text-sm">Add your first weigh-in to see trends.</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Workout Analytics Section */}
        {workoutOverview && workoutOverview.weeklyWorkoutData.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.01, y: -2 }}
          >
            <Card className="border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
              <CardContent className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <motion.h2
                    className="text-lg font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    Workout Analytics
                  </motion.h2>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.65, type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <Dumbbell className="h-5 w-5 text-accent drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
                  </motion.div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <motion.div
                    className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-3 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <p className="text-2xl font-bold text-accent drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">{workoutOverview.totalWorkoutsThisMonth}</p>
                    <p className="text-xs text-white/60">This Month</p>
                  </motion.div>
                  <motion.div
                    className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-3 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.75 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <p className="text-2xl font-bold text-white">{workoutOverview.avgWorkoutsPerWeek}</p>
                    <p className="text-xs text-white/60">Avg/Week</p>
                  </motion.div>
                  <motion.div
                    className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-3 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {workoutOverview.volumeChange > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : workoutOverview.volumeChange < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      ) : null}
                      <p className={`text-2xl font-bold ${workoutOverview.volumeChange > 0 ? 'text-green-400' : workoutOverview.volumeChange < 0 ? 'text-red-400' : 'text-white'}`}>
                        {workoutOverview.volumeChange > 0 ? '+' : ''}{workoutOverview.volumeChange.toFixed(0)}%
                      </p>
                    </div>
                    <p className="text-xs text-white/60">Volume</p>
                  </motion.div>
                </div>

                {/* Weekly Volume Chart */}
                <div className="mb-4">
                  <p className="text-sm text-white/70 mb-2">Weekly Volume (lbs lifted)</p>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={workoutOverview.weeklyWorkoutData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatVolume} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          labelStyle={{ color: '#fff' }}
                          formatter={(value: number) => [`${formatVolume(value)} lbs`, 'Volume']}
                        />
                        <Bar dataKey="volume" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Cardio Minutes Chart */}
                {workoutOverview.weeklyWorkoutData.some(w => w.cardioMinutes > 0) && (
                  <div>
                    <p className="text-sm text-white/70 mb-2">Cardio Minutes</p>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={workoutOverview.weeklyWorkoutData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            labelStyle={{ color: '#fff' }}
                            formatter={(value: number) => [`${value} min`, 'Cardio']}
                          />
                          <Area type="monotone" dataKey="cardioMinutes" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-white/60">Weekly change:</span>
                      <span className={workoutOverview.cardioChange > 0 ? 'text-green-400' : workoutOverview.cardioChange < 0 ? 'text-red-400' : 'text-white/60'}>
                        {workoutOverview.cardioChange > 0 ? '+' : ''}{workoutOverview.cardioChange.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <motion.h2
              className="text-lg font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              Habit Builder
            </motion.h2>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.95 }}
            >
              <ButtonGlow variant="outline-glow" size="sm" onClick={() => setAddHabitModalOpen(true)} className="backdrop-blur-xl">
                <PlusCircle className="mr-1 h-4 w-4" /> Add
              </ButtonGlow>
            </motion.div>
          </div>

          <div className="space-y-3">
            {habitList.length === 0 ? (
              <Card className="border-white/10 backdrop-blur-xl bg-white/5 p-4 text-center text-white/70">
                No habits yet. Add one to get started.
              </Card>
            ) : (
              habitList.map((habit, index) => (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 + index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="border-white/10 backdrop-blur-xl bg-white/5 hover:bg-white/10 hover:border-accent/30 hover:shadow-[0_0_15px_rgba(255,215,0,0.15)] transition-all">
                    <CardContent className="flex items-center justify-between p-3">
                      <div>
                        <span className="text-white font-medium">{habit.name}</span>
                        <p className="text-xs text-white/50 capitalize">{habit.category}</p>
                      </div>
                      <div className="rounded backdrop-blur-xl bg-accent/20 border border-accent/30 px-2 py-1 text-xs font-medium text-accent drop-shadow-[0_0_10px_rgba(255,215,0,0.2)]">
                        {habit.current_streak ?? 0} day streak
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          ref={supplementsSectionRef}
        >
          <div className="mb-3 flex items-center justify-between">
            <motion.h2
              className="text-lg font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.25 }}
            >
              Supplements
            </motion.h2>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 1.3, type: "spring", stiffness: 200, damping: 15 }}
            >
              <Pill className="h-5 w-5 text-accent drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
            </motion.div>
          </div>

          {supplements.length === 0 ? (
            <Card className="border-white/10 backdrop-blur-xl bg-white/5 p-4 text-sm text-white/70">No supplement guidance yet.</Card>
          ) : (
            <div className="space-y-3">
              {supplements.map((supplement, index) => (
                <motion.div
                  key={supplement.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.35 + index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <Card
                    className={`border-white/10 backdrop-blur-xl bg-white/5 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,215,0,0.15)] transition-all ${
                      supplement.featured ? "border-accent/30 bg-accent/5 shadow-[0_0_20px_rgba(255,215,0,0.2)]" : ""
                    }`}
                  >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <h3 className="font-medium text-white">{supplement.name}</h3>
                          {supplement.featured && (
                            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-black">Featured</span>
                          )}
                        </div>
                        <p className="mb-2 text-xs text-accent">{supplement.category}</p>
                        {expandedSupplement === supplement.id ? (
                          <>
                            <p className="text-xs text-white/70">{supplement.description}</p>
                            {supplement.benefits && supplement.benefits.length > 0 && (
                              <ul className="mt-2 space-y-1 text-xs text-white/60">
                                {supplement.benefits.map((benefit, idx) => (
                                  <li key={idx}>• {benefit}</li>
                                ))}
                              </ul>
                            )}
                            <div className="flex items-center gap-2 mt-3">
                              <ButtonGlow
                                variant="outline-glow"
                                size="sm"
                                onClick={() => setExpandedSupplement(null)}
                              >
                                Show Less
                              </ButtonGlow>
                              {supplement.product_url && (
                                <ButtonGlow
                                  variant="accent-glow"
                                  size="sm"
                                  onClick={() => window.open(supplement.product_url!, '_blank')}
                                >
                                  Shop Now
                                </ButtonGlow>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 mt-2">
                            <ButtonGlow
                              variant="outline-glow"
                              size="sm"
                              onClick={() => setExpandedSupplement(supplement.id)}
                            >
                              Learn More
                            </ButtonGlow>
                            {supplement.product_url && supplement.featured && (
                              <ButtonGlow
                                variant="accent-glow"
                                size="sm"
                                onClick={() => window.open(supplement.product_url!, '_blank')}
                              >
                                Shop Now
                              </ButtonGlow>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.5 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <motion.h2
              className="text-lg font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.55 }}
            >
              Recent Weigh-Ins
            </motion.h2>
          </div>
          <motion.div
            whileHover={{ scale: 1.01, y: -2 }}
          >
            <Card className="border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
              <CardContent className="p-0">
                {weightHistory.length === 0 ? (
                  <div className="p-4 text-sm text-white/60">No entries logged yet.</div>
                ) : (
                  <ul className="divide-y divide-white/10 text-sm text-white/80">
                    {weightHistory.map((entry, index) => (
                      <motion.li
                        key={entry.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.6 + index * 0.05 }}
                      >
                        <span>{new Date(entry.logged_at).toLocaleDateString()}</span>
                        <div className="text-right">
                          <p className="font-semibold">{Number(entry.weight).toFixed(1)} lbs</p>
                          {entry.change !== null && (
                            <p className={`text-xs ${entry.change > 0 ? "text-red-400" : "text-green-400"}`}>
                              {entry.change > 0 ? "+" : ""}
                              {entry.change?.toFixed(1)} lbs
                            </p>
                          )}
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.8 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <motion.h2
              className="text-lg font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.85 }}
            >
              Progress Photos
            </motion.h2>
            <div className="flex gap-2">
              {photoPreviews.length >= 2 && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.9 }}
                >
                  <ButtonGlow
                    variant="outline-glow"
                    size="sm"
                    onClick={() => setCompareMode(!compareMode)}
                    className={`backdrop-blur-xl ${compareMode ? "border-accent bg-accent/20 shadow-[0_0_15px_rgba(255,215,0,0.2)]" : ""}`}
                  >
                    <ArrowLeftRight className="mr-1 h-4 w-4" />
                    {compareMode ? "Cancel" : "Compare"}
                  </ButtonGlow>
                </motion.div>
              )}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.95 }}
              >
                <ButtonGlow variant="accent-glow" size="sm" onClick={() => setProgressPhotoModalOpen(true)}>
                  <Camera className="mr-1 h-4 w-4" />
                  Add
                </ButtonGlow>
              </motion.div>
            </div>
          </div>

          {compareMode && (
            <Card className="border-accent/30 backdrop-blur-xl bg-gradient-to-br from-accent/15 to-accent/5 shadow-[0_0_20px_rgba(255,215,0,0.15)] p-3 mb-3">
              <p className="text-sm text-white/80 mb-2">
                Select two photos to compare side-by-side
              </p>
              <div className="flex gap-2 text-xs">
                <span className={`px-2 py-1 rounded ${selectedPhotosForCompare[0] ? 'bg-accent text-black' : 'bg-white/10 text-white/60'}`}>
                  {selectedPhotosForCompare[0] ? `Before: ${new Date(selectedPhotosForCompare[0].date).toLocaleDateString()}` : 'Select "Before"'}
                </span>
                <span className={`px-2 py-1 rounded ${selectedPhotosForCompare[1] ? 'bg-accent text-black' : 'bg-white/10 text-white/60'}`}>
                  {selectedPhotosForCompare[1] ? `After: ${new Date(selectedPhotosForCompare[1].date).toLocaleDateString()}` : 'Select "After"'}
                </span>
              </div>
            </Card>
          )}

          {photoPreviews.length === 0 ? (
            <Card className="border-white/10 backdrop-blur-xl bg-white/5 p-4 text-white/70 text-sm">
              Capture your first photo to start the visual timeline.
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photoPreviews.slice(0, 6).map((photo, index) => (
                <motion.div
                  key={photo.id}
                  className={`rounded-lg overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 ${compareMode ? 'cursor-pointer hover:ring-2 hover:ring-accent' : ''} ${
                    selectedPhotosForCompare[0]?.id === photo.id || selectedPhotosForCompare[1]?.id === photo.id
                      ? 'ring-2 ring-accent shadow-[0_0_15px_rgba(255,215,0,0.3)]'
                      : ''
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2.0 + index * 0.05 }}
                  whileHover={{ scale: compareMode ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.95 }}
                >
                  onClick={() => {
                    if (compareMode) {
                      if (!selectedPhotosForCompare[0]) {
                        handleSelectPhotoForCompare(photo, 0)
                      } else if (!selectedPhotosForCompare[1] && photo.id !== selectedPhotosForCompare[0].id) {
                        handleSelectPhotoForCompare(photo, 1)
                      } else if (photo.id === selectedPhotosForCompare[0]?.id) {
                        setSelectedPhotosForCompare([null, selectedPhotosForCompare[1]])
                      } else if (photo.id === selectedPhotosForCompare[1]?.id) {
                        setSelectedPhotosForCompare([selectedPhotosForCompare[0], null])
                      }
                    }
                  }}
                >
                  <div className="relative">
                    <img src={photo.imageUrl} alt="Progress photo" className="h-32 w-full object-cover" />
                    {compareMode && (selectedPhotosForCompare[0]?.id === photo.id || selectedPhotosForCompare[1]?.id === photo.id) && (
                      <div className="absolute top-1 right-1 bg-accent text-black text-xs font-bold px-2 py-0.5 rounded">
                        {selectedPhotosForCompare[0]?.id === photo.id ? 'Before' : 'After'}
                      </div>
                    )}
                  </div>
                  <div className="px-2 py-1 text-[11px] text-white/70">
                    <p>{photo.type}</p>
                    <p>{new Date(photo.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View Comparison Button */}
          {compareMode && selectedPhotosForCompare[0] && selectedPhotosForCompare[1] && (
            <ButtonGlow
              variant="accent-glow"
              className="w-full mt-3"
              onClick={() => {
                // Open comparison modal - we'll show inline for now
              }}
            >
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              View Side-by-Side Comparison
            </ButtonGlow>
          )}
        </motion.div>

        {/* Side-by-Side Comparison View */}
        {compareMode && selectedPhotosForCompare[0] && selectedPhotosForCompare[1] && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.01, y: -2 }}
          >
            <Card className="border-accent/30 backdrop-blur-xl bg-gradient-to-br from-accent/10 to-accent/5 shadow-[0_0_30px_rgba(255,215,0,0.2)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-accent/20 p-3">
                <h3 className="font-bold bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent">Transformation Comparison</h3>
                <motion.button
                  onClick={clearCompareSelection}
                  className="rounded-full p-1 hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5 text-white/60" />
                </motion.button>
              </div>
              <CardContent className="p-0">
                <div className="grid grid-cols-2">
                  {/* Before Photo */}
                  <div className="border-r border-white/10">
                    <div className="aspect-[3/4] w-full">
                      <img
                        src={selectedPhotosForCompare[0].imageUrl}
                        alt="Before"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-3 text-center bg-black/30">
                      <p className="text-accent font-medium text-sm">Before</p>
                      <p className="text-white/70 text-xs">{new Date(selectedPhotosForCompare[0].date).toLocaleDateString()}</p>
                      {selectedPhotosForCompare[0].weight && (
                        <p className="text-white text-sm mt-1">{selectedPhotosForCompare[0].weight} lbs</p>
                      )}
                    </div>
                  </div>
                  {/* After Photo */}
                  <div>
                    <div className="aspect-[3/4] w-full">
                      <img
                        src={selectedPhotosForCompare[1].imageUrl}
                        alt="After"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-3 text-center bg-black/30">
                      <p className="text-green-400 font-medium text-sm">After</p>
                      <p className="text-white/70 text-xs">{new Date(selectedPhotosForCompare[1].date).toLocaleDateString()}</p>
                      {selectedPhotosForCompare[1].weight && (
                        <p className="text-white text-sm mt-1">{selectedPhotosForCompare[1].weight} lbs</p>
                      )}
                    </div>
                  </div>
                </div>
                {/* Weight Change Summary */}
                {selectedPhotosForCompare[0].weight && selectedPhotosForCompare[1].weight && (
                  <div className="border-t border-white/10 p-3 text-center">
                    <p className="text-white/70 text-xs mb-1">Weight Change</p>
                    <p className={`text-lg font-bold ${
                      selectedPhotosForCompare[1].weight < selectedPhotosForCompare[0].weight
                        ? 'text-green-400'
                        : selectedPhotosForCompare[1].weight > selectedPhotosForCompare[0].weight
                        ? 'text-red-400'
                        : 'text-white'
                    }`}>
                      {selectedPhotosForCompare[1].weight < selectedPhotosForCompare[0].weight ? '' : '+'}
                      {(selectedPhotosForCompare[1].weight - selectedPhotosForCompare[0].weight).toFixed(1)} lbs
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2.3 }}
        >
          <motion.div
            className="flex-1 relative group"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-xl blur-lg opacity-0 group-hover:opacity-75 transition-opacity duration-300" />
            <ButtonGlow variant="outline-glow" className="w-full backdrop-blur-xl relative" onClick={() => setUpdateWeightModalOpen(true)}>
              <Weight className="mr-2 h-4 w-4" /> Update Weight
            </ButtonGlow>
          </motion.div>
          <motion.div
            className="flex-1 relative group"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
            <ButtonGlow variant="accent-glow" className="w-full relative" onClick={() => setProgressPhotoModalOpen(true)}>
              <Camera className="mr-2 h-4 w-4" /> Progress Photo
            </ButtonGlow>
          </motion.div>
        </motion.div>

        <AddHabitModal isOpen={addHabitModalOpen} onClose={() => setAddHabitModalOpen(false)} onAdd={handleAddHabit} />
        <UpdateWeightModal
          isOpen={updateWeightModalOpen}
          onClose={() => setUpdateWeightModalOpen(false)}
          currentWeight={currentWeight || 0}
          onSuccess={handleWeightUpdated}
          recentEntries={weightEntries}
        />
        <ProgressPhotoModal
          isOpen={progressPhotoModalOpen}
          onClose={() => setProgressPhotoModalOpen(false)}
          onSuccess={handlePhotoAdded}
          recentPhotos={photoPreviews}
          currentWeight={currentWeight || undefined}
        />
      </div>

      <BottomNav />
    </div>
  )
}

