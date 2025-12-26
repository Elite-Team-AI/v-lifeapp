"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { PlusCircle, LineChart, Weight, Camera, Pill } from "lucide-react"
import { Line, LineChart as RechartsLineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { BottomNav } from "@/components/bottom-nav"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card, CardContent } from "@/components/ui/card"
import { AddHabitModal } from "@/app/add-habit-modal"
import { UpdateWeightModal } from "@/app/update-weight-modal"
import { ProgressPhotoModal } from "@/app/progress-photo-modal"
import type { HabitWithStatus, ProgressPhoto, Supplement, WeightEntry } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface ToolsClientProps {
  weightEntries: WeightEntry[]
  progressPhotos: ProgressPhoto[]
  supplements: Supplement[]
  habits: HabitWithStatus[]
  initialSupplementId?: string | null
}

interface ProgressPhotoPreview {
  id: string
  date: string
  weight?: number | null
  note?: string | null
  type: string
  imageUrl: string
}

export function ToolsClient({ weightEntries, progressPhotos, supplements, habits, initialSupplementId = null }: ToolsClientProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [addHabitModalOpen, setAddHabitModalOpen] = useState(false)
  const [updateWeightModalOpen, setUpdateWeightModalOpen] = useState(false)
  const [progressPhotoModalOpen, setProgressPhotoModalOpen] = useState(false)

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
          note: photo.notes || null,
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-charcoal pb-nav-safe">
      <div className="container max-w-md px-4 py-6">
        <motion.div className="mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-2xl font-bold text-white">Tools</h1>
          <p className="text-white/70">Track your progress</p>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-white/10 bg-black/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Weight Trend</h2>
                <div className="flex items-center text-accent">
                  <LineChart className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">{currentWeight ? `${currentWeight} lbs` : "Add entry"}</span>
                </div>
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

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Habit Builder</h2>
            <ButtonGlow variant="outline-glow" size="sm" onClick={() => setAddHabitModalOpen(true)}>
              <PlusCircle className="mr-1 h-4 w-4" /> Add
            </ButtonGlow>
          </div>

          <div className="space-y-3">
            {habitList.length === 0 ? (
              <Card className="border-white/10 bg-black/50 backdrop-blur-sm p-4 text-center text-white/70">
                No habits yet. Add one to get started.
              </Card>
            ) : (
              habitList.map((habit) => (
                <Card key={habit.id} className="border-white/10 bg-black/50 backdrop-blur-sm">
                  <CardContent className="flex items-center justify-between p-3">
                    <div>
                      <span className="text-white font-medium">{habit.name}</span>
                      <p className="text-xs text-white/50 capitalize">{habit.category}</p>
                    </div>
                    <div className="rounded bg-accent/20 px-2 py-1 text-xs font-medium text-accent">
                      {habit.current_streak ?? 0} day streak
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          ref={supplementsSectionRef}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Supplements</h2>
            <Pill className="h-5 w-5 text-accent" />
          </div>

          {supplements.length === 0 ? (
            <Card className="border-white/10 bg-black/50 p-4 text-sm text-white/70">No supplement guidance yet.</Card>
          ) : (
            <div className="space-y-3">
              {supplements.map((supplement) => (
                <Card
                  key={supplement.id}
                  className={`border-white/10 bg-black/50 backdrop-blur-sm ${
                    supplement.featured ? "border-accent/30 bg-accent/5" : ""
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
                            <ButtonGlow
                              variant="outline-glow"
                              size="sm"
                              className="mt-3"
                              onClick={() => setExpandedSupplement(null)}
                            >
                              Show Less
                            </ButtonGlow>
                          </>
                        ) : (
                          <ButtonGlow
                            variant="outline-glow"
                            size="sm"
                            className="mt-2"
                            onClick={() => setExpandedSupplement(supplement.id)}
                          >
                            Learn More
                          </ButtonGlow>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Recent Weigh-Ins</h2>
          </div>
          <Card className="border-white/10 bg-black/50 backdrop-blur-sm">
            <CardContent className="p-0">
              {weightHistory.length === 0 ? (
                <div className="p-4 text-sm text-white/60">No entries logged yet.</div>
              ) : (
                <ul className="divide-y divide-white/5 text-sm text-white/80">
                  {weightHistory.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between px-4 py-3">
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
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Progress Photos</h2>
            <ButtonGlow variant="accent-glow" size="sm" onClick={() => setProgressPhotoModalOpen(true)}>
              <Camera className="mr-1 h-4 w-4" />
              Add
            </ButtonGlow>
          </div>

          {photoPreviews.length === 0 ? (
            <Card className="border-white/10 bg-black/50 backdrop-blur-sm p-4 text-white/70 text-sm">
              Capture your first photo to start the visual timeline.
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photoPreviews.slice(0, 6).map((photo) => (
                <div key={photo.id} className="rounded-lg overflow-hidden bg-black/40">
                  <img src={photo.imageUrl} alt="Progress photo" className="h-32 w-full object-cover" />
                  <div className="px-2 py-1 text-[11px] text-white/70">
                    <p>{photo.type}</p>
                    <p>{new Date(photo.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
        >
          <ButtonGlow variant="outline-glow" className="flex-1" onClick={() => setUpdateWeightModalOpen(true)}>
            <Weight className="mr-2 h-4 w-4" /> Update Weight
          </ButtonGlow>
          <ButtonGlow variant="accent-glow" className="flex-1" onClick={() => setProgressPhotoModalOpen(true)}>
            <Camera className="mr-2 h-4 w-4" /> Progress Photo
          </ButtonGlow>
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

