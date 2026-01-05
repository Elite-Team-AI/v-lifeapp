"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, ChevronDown, Trash2, Plus, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FoodParseResult, ParsedFood } from "@/lib/actions/food-logging"

interface FoodParseConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  parseResult: FoodParseResult
  onConfirm: (foods: ParsedFood[], mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack") => Promise<void>
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const
type MealType = typeof MEAL_TYPES[number]

const MEAL_TYPE_ICONS: Record<MealType, string> = {
  Breakfast: "🌅",
  Lunch: "☀️",
  Dinner: "🌙",
  Snack: "🍎",
}

export function FoodParseConfirmModal({ 
  isOpen, 
  onClose, 
  parseResult, 
  onConfirm 
}: FoodParseConfirmModalProps) {
  const [foods, setFoods] = useState<ParsedFood[]>(parseResult.foods)
  const [mealType, setMealType] = useState<MealType>(
    parseResult.suggestedMealType as MealType
  )
  const [showMealTypeDropdown, setShowMealTypeDropdown] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleFoodUpdate = useCallback((index: number, field: keyof ParsedFood, value: string | number) => {
    setFoods((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: typeof value === "string" ? value : Number(value),
      }
      return updated
    })
  }, [])

  const handleRemoveFood = useCallback((index: number) => {
    setFoods((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleAddFood = useCallback(() => {
    setFoods((prev) => [
      ...prev,
      {
        name: "New item",
        quantity: 1,
        unit: "serving",
        calories: 100,
        protein: 5,
        carbs: 10,
        fat: 3,
        fiber: 2,
        sugar: 2,
        sodium: 100,
        confidence: 1,
      },
    ])
    setEditingIndex(foods.length)
  }, [foods.length])

  const handleSubmit = useCallback(async () => {
    if (foods.length === 0) return
    
    setIsSubmitting(true)
    try {
      await onConfirm(foods, mealType)
    } finally {
      setIsSubmitting(false)
    }
  }, [foods, mealType, onConfirm])

  // Calculate totals
  const totals = foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-24 sm:pb-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-charcoal shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold text-white">Review & Confirm</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-white/70" />
              </button>
            </div>

            {/* Meal Type Selector */}
            <div className="p-4 border-b border-white/10">
              <label className="block text-xs text-white/50 mb-2">Log as</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMealTypeDropdown(!showMealTypeDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{MEAL_TYPE_ICONS[mealType]}</span>
                    <span className="font-medium">{mealType}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-white/50" />
                </button>
                
                <AnimatePresence>
                  {showMealTypeDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute left-0 right-0 top-full mt-1 z-10 rounded-lg border border-white/10 bg-charcoal/95 backdrop-blur-sm shadow-lg overflow-hidden"
                    >
                      {MEAL_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setMealType(type)
                            setShowMealTypeDropdown(false)
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5",
                            mealType === type ? "text-accent" : "text-white/70"
                          )}
                        >
                          <span>{MEAL_TYPE_ICONS[type]}</span>
                          {type}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Food Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">
                  {foods.length} {foods.length === 1 ? "item" : "items"} detected
                </span>
                <button
                  type="button"
                  onClick={handleAddFood}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-accent hover:bg-accent/10 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add item
                </button>
              </div>

              <AnimatePresence mode="popLayout">
                {foods.map((food, index) => (
                  <motion.div
                    key={index}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="rounded-xl border border-white/10 bg-black/30 overflow-hidden"
                  >
                    {editingIndex === index ? (
                      // Edit mode
                      <div className="p-3 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="block text-[10px] text-white/50 mb-1">Name</label>
                            <input
                              type="text"
                              value={food.name}
                              onChange={(e) => handleFoodUpdate(index, "name", e.target.value)}
                              className="w-full px-2 py-1.5 text-xs rounded bg-white/5 border border-white/10 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-white/50 mb-1">Qty</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={food.quantity}
                              onChange={(e) => handleFoodUpdate(index, "quantity", parseFloat(e.target.value) || 1)}
                              className="w-full px-2 py-1.5 text-xs rounded bg-white/5 border border-white/10 text-white"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] text-white/50 mb-1">Cals</label>
                            <input
                              type="number"
                              min="0"
                              value={food.calories}
                              onChange={(e) => handleFoodUpdate(index, "calories", parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-xs rounded bg-white/5 border border-white/10 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-white/50 mb-1">Prot</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={food.protein}
                              onChange={(e) => handleFoodUpdate(index, "protein", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-xs rounded bg-white/5 border border-white/10 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-white/50 mb-1">Carbs</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={food.carbs}
                              onChange={(e) => handleFoodUpdate(index, "carbs", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-xs rounded bg-white/5 border border-white/10 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-white/50 mb-1">Fat</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={food.fat}
                              onChange={(e) => handleFoodUpdate(index, "fat", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-xs rounded bg-white/5 border border-white/10 text-white"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="w-full py-1.5 rounded bg-accent/20 text-accent text-xs font-medium hover:bg-accent/30"
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      // View mode
                      <div className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-white text-sm">{food.name}</p>
                            <p className="text-xs text-white/50">
                              {food.quantity} {food.unit}
                              {food.confidence < 0.8 && (
                                <span className="ml-1 text-yellow-400">(uncertain)</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingIndex(index)}
                              className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white"
                            >
                              <span className="text-xs">Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFood(index)}
                              className="p-1.5 rounded hover:bg-red-500/10 text-white/50 hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="text-orange-400">{food.calories} kcal</span>
                          <span className="text-red-400">{food.protein}g P</span>
                          <span className="text-blue-400">{food.carbs}g C</span>
                          <span className="text-green-400">{food.fat}g F</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {foods.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-white/50 text-sm">No items to log</p>
                  <button
                    type="button"
                    onClick={handleAddFood}
                    className="mt-2 text-accent text-sm"
                  >
                    Add manually
                  </button>
                </div>
              )}
            </div>

            {/* Footer with totals and confirm */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              {/* Totals */}
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-sm font-medium text-white/70">Total</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-orange-400 font-medium">{totals.calories} kcal</span>
                  <span className="text-red-400">{Math.round(totals.protein)}g P</span>
                  <span className="text-blue-400">{Math.round(totals.carbs)}g C</span>
                  <span className="text-green-400">{Math.round(totals.fat)}g F</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70 font-medium hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || foods.length === 0}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors",
                    foods.length > 0
                      ? "bg-accent text-black hover:bg-accent/90"
                      : "bg-white/5 text-white/30 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        ⏳
                      </motion.div>
                      Logging...
                    </span>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Log Food
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
