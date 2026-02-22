"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, RotateCcw, Check } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card, CardContent } from "@/components/ui/card"

interface MealOption {
  id: string
  name: string
  calories: number
  description?: string | null
}

interface MealSwapModalProps {
  isOpen: boolean
  onClose: () => void
  mealType: string
  currentMeal: string
  alternatives: MealOption[]
  onSwap: (newMeal: MealOption) => Promise<void> | void
  loadingAlternatives?: boolean
}

export function MealSwapModal({
  isOpen,
  onClose,
  mealType,
  currentMeal,
  alternatives,
  onSwap,
  loadingAlternatives = false,
}: MealSwapModalProps) {
  const [selectedMeal, setSelectedMeal] = useState<MealOption | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSwap = async () => {
    if (selectedMeal) {
      setIsSaving(true)
      await onSwap(selectedMeal)
      setIsSaving(false)
      setSelectedMeal(null)
      onClose()
    }
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
                <div>
                  <h3 className="font-bold text-white">Swap {mealType}</h3>
                  <p className="text-xs text-accent">Currently: {currentMeal}</p>
                </div>
                <motion.button
                  onClick={onClose}
                  className="rounded-full p-2 hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  disabled={isSaving}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <X className="h-5 w-5 text-white/60" />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingAlternatives ? (
                  <div className="text-center text-sm text-white/60">Loading alternatives...</div>
                ) : (
                  alternatives.map((meal, index) => (
                    <motion.div
                      key={index}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all hover:border-accent/50 min-h-[72px] ${
                          selectedMeal?.id === meal.id ? "border-accent border-glow bg-accent/10" : "border-white/10 bg-black/30"
                        }`}
                        onClick={() => setSelectedMeal(meal)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className={`font-medium ${selectedMeal?.id === meal.id ? "text-accent" : "text-white"}`}>
                                {meal.name}
                              </h4>
                              <p className="text-sm text-white/60">{meal.calories} kcal</p>
                              {meal.description && <p className="text-xs text-white/50 mt-1">{meal.description}</p>}
                            </div>
                            {selectedMeal?.id === meal.id && <Check className="h-5 w-5 text-accent ml-2" />}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="border-t border-accent/20 p-4 flex gap-3 flex-shrink-0">
                <ButtonGlow variant="outline-glow" onClick={onClose} className="flex-1" disabled={isSaving}>
                  Cancel
                </ButtonGlow>
                <ButtonGlow
                  variant="accent-glow"
                  onClick={handleSwap}
                  disabled={!selectedMeal}
                  isLoading={isSaving}
                  loadingText="Swapping..."
                  className="flex-1"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Swap Meal
                </ButtonGlow>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
