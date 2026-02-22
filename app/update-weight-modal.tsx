"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Scale, TrendingDown, TrendingUp, Minus } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { WeightEntry } from "@/lib/types"

interface UpdateWeightModalProps {
  isOpen: boolean
  onClose: () => void
  currentWeight: number | null
  recentEntries: WeightEntry[]
  onSuccess?: () => void
}

export function UpdateWeightModal({ isOpen, onClose, currentWeight, recentEntries, onSuccess }: UpdateWeightModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [weight, setWeight] = useState(currentWeight ? currentWeight.toString() : "")
  const [note, setNote] = useState("")
  const [unit, setUnit] = useState<"lbs" | "kg">("lbs")
  const [isPending, startTransition] = useTransition()

  // Pre-populate with latest weight when modal opens
  useEffect(() => {
    if (isOpen && currentWeight) {
      setWeight(currentWeight.toString())
    }
  }, [isOpen, currentWeight])

  const handleUpdate = () => {
    const weightValue = Number.parseFloat(weight)
    if (!weightValue || weightValue <= 0) {
      toast({
        title: "Add a valid weight",
        description: "Please enter a value greater than zero.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const normalized = unit === "kg" ? weightValue * 2.20462 : weightValue
      const { addWeightEntry } = await import("@/lib/actions/progress")
      const result = await addWeightEntry(Number(normalized.toFixed(1)), note.trim() || undefined)

      if (result.success) {
        toast({
          title: "Weight logged",
          description: "Nice work staying consistent.",
        })
        setNote("")
        onSuccess?.()
        router.refresh()
        onClose()
      } else {
        toast({
          title: "Unable to save",
          description: result.error || "Please try again.",
          variant: "destructive",
        })
      }
    })
  }

  const getWeightChange = () => {
    const newWeight = Number.parseFloat(weight)
    if (!newWeight || recentEntries.length === 0) return null

    const lastEntry = recentEntries[recentEntries.length - 1]
    const lastWeight = Number(lastEntry.weight)
    const displayed = unit === "kg" ? lastWeight / 2.20462 : lastWeight
    return newWeight - displayed
  }

  const weightChange = getWeightChange()

  const quickAdjustments = [-2, -1, -0.5, 0.5, 1, 2]

  const adjustWeight = (adjustment: number) => {
    const currentValue = Number.parseFloat(weight) || currentWeight || 0
    const newValue = Math.max(0, currentValue + adjustment)
    setWeight(newValue.toFixed(1))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 pb-modal-safe"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-accent/30 bg-black/90 backdrop-blur-lg flex flex-col max-h-[75vh]">
              <div className="flex items-center justify-between border-b border-accent/20 p-4 flex-shrink-0">
                <div className="flex items-center">
                  <Scale className="mr-3 h-6 w-6 text-accent" />
                  <div>
                    <h3 className="font-bold text-white">Update Weight</h3>
                    <p className="text-xs text-accent">Track your progress</p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="rounded-full p-2 hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <X className="h-5 w-5 text-white/60" />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Unit Toggle */}
                <div className="flex justify-center">
                  <div className="flex rounded-lg bg-black/30 p-1">
                    <motion.button
                      onClick={() => setUnit("lbs")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
                        unit === "lbs" ? "bg-accent text-black" : "text-white/70 hover:text-white"
                      }`}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      lbs
                    </motion.button>
                    <motion.button
                      onClick={() => setUnit("kg")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
                        unit === "kg" ? "bg-accent text-black" : "text-white/70 hover:text-white"
                      }`}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      kg
                    </motion.button>
                  </div>
                </div>

                {/* Weight Input */}
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-white">
                    Current Weight ({unit})
                  </Label>
                  <div className="relative">
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder={`Enter weight in ${unit}`}
                      className="text-center text-2xl font-bold pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">{unit}</span>
                  </div>
                </div>

                {/* Quick Adjustments */}
                <div className="space-y-2">
                  <Label className="text-white">Quick Adjustments</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {quickAdjustments.map((adj) => (
                      <motion.button
                        key={adj}
                        onClick={() => adjustWeight(adj)}
                        className={`flex items-center justify-center min-h-[44px] rounded-lg border transition-all text-sm font-medium ${
                          adj < 0
                            ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 active:bg-red-500/30"
                            : "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 active:bg-green-500/30"
                        }`}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        {adj > 0 ? "+" : ""}
                        {adj}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Weight Change Indicator */}
                {weightChange !== null && (
                  <Card
                    className={`border-white/10 ${
                      weightChange > 0 ? "bg-red-500/10" : weightChange < 0 ? "bg-green-500/10" : "bg-black/30"
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-center">
                        {weightChange > 0 ? (
                          <TrendingUp className="mr-2 h-5 w-5 text-red-400" />
                        ) : weightChange < 0 ? (
                          <TrendingDown className="mr-2 h-5 w-5 text-green-400" />
                        ) : (
                          <Minus className="mr-2 h-5 w-5 text-white/60" />
                        )}
                        <span
                          className={`font-medium ${
                            weightChange > 0 ? "text-red-400" : weightChange < 0 ? "text-green-400" : "text-white/60"
                          }`}
                        >
                          {weightChange > 0 ? "+" : ""}
                          {weightChange.toFixed(1)} {unit} from last entry
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Note Input */}
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-white">
                    Note (Optional)
                  </Label>
                  <Input
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="How are you feeling? Any observations..."
                    className="w-full"
                  />
                </div>

                {/* Recent Entries */}
                {recentEntries.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-white">Recent Entries</Label>
                    <Card className="border-white/10 bg-black/30">
                      <CardContent className="p-3">
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {recentEntries
                            .slice(-5)
                            .reverse()
                            .map((entry) => (
                              <div key={entry.id} className="flex items-center justify-between text-sm">
                                <span className="text-white/70">
                                  {new Date(entry.logged_at || entry.created_at || "").toLocaleDateString()}
                                </span>
                                <div className="flex items-center">
                                  <span className="text-white font-medium">
                                    {Number(entry.weight).toFixed(1)} {unit}
                                  </span>
                                  {entry.change !== null && entry.change !== undefined && (
                                    <span
                                      className={`ml-2 text-xs ${entry.change > 0 ? "text-red-400" : "text-green-400"}`}
                                    >
                                      ({entry.change > 0 ? "+" : ""}
                                      {Number(entry.change).toFixed(1)})
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              <div className="border-t border-accent/20 p-4 flex gap-3 flex-shrink-0">
                <ButtonGlow variant="outline-glow" onClick={onClose} className="flex-1" disabled={isPending}>
                  Cancel
                </ButtonGlow>
                <ButtonGlow
                  variant="accent-glow"
                  onClick={handleUpdate}
                  disabled={!weight || Number.parseFloat(weight) <= 0}
                  isLoading={isPending}
                  loadingText="Saving..."
                  className="flex-1"
                >
                  <Scale className="mr-2 h-4 w-4" />
                  Update Weight
                </ButtonGlow>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
