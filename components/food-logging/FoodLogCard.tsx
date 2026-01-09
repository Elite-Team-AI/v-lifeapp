"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Pencil, Trash2, Check, X, ChevronDown, 
  Flame, Drumstick, Wheat, Droplet, Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { FoodLogEntry } from "@/lib/actions/food-logging"

interface FoodLogCardProps {
  entry: FoodLogEntry
  onUpdate: (id: string, updates: Partial<FoodLogEntry>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  compact?: boolean
}

const MEAL_TYPES = ["Breakfast", "Snack (AM)", "Lunch", "Snack (PM)", "Dinner", "Late Snack"] as const

const MEAL_TYPE_ICONS: Record<string, string> = {
  Breakfast: "🌅",
  "Snack (AM)": "☕",
  Lunch: "☀️",
  "Snack (PM)": "🍪",
  Dinner: "🌙",
  "Late Snack": "🌜",
  Snack: "🍎", // fallback for legacy entries
}

const MEAL_TYPE_COLORS: Record<string, string> = {
  Breakfast: "text-orange-400",
  "Snack (AM)": "text-amber-400",
  Lunch: "text-yellow-400",
  "Snack (PM)": "text-lime-400",
  Dinner: "text-purple-400",
  "Late Snack": "text-indigo-400",
  Snack: "text-green-400", // fallback for legacy entries
}

export function FoodLogCard({ entry, onUpdate, onDelete, compact = false }: FoodLogCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editValues, setEditValues] = useState({
    name: entry.name,
    quantity: entry.quantity,
    unit: entry.unit,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    mealType: entry.mealType,
  })
  const [showMealTypeDropdown, setShowMealTypeDropdown] = useState(false)
  const { toast } = useToast()

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      await onUpdate(entry.id, {
        name: editValues.name,
        quantity: editValues.quantity,
        unit: editValues.unit,
        calories: editValues.calories,
        protein: editValues.protein,
        carbs: editValues.carbs,
        fat: editValues.fat,
        mealType: editValues.mealType,
      })
      setIsEditing(false)
      toast({
        title: "Updated",
        description: "Food entry updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update entry",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [entry.id, editValues, onUpdate, toast])

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      await onDelete(entry.id)
      toast({
        title: "Deleted",
        description: "Food entry removed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }, [entry.id, onDelete, toast])

  const handleCancel = useCallback(() => {
    setEditValues({
      name: entry.name,
      quantity: entry.quantity,
      unit: entry.unit,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      mealType: entry.mealType,
    })
    setIsEditing(false)
  }, [entry])

  const formattedTime = new Date(entry.loggedAt).toLocaleTimeString([], { 
    hour: "numeric", 
    minute: "2-digit" 
  })

  if (compact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-lg">{MEAL_TYPE_ICONS[entry.mealType]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{entry.name}</p>
            <p className="text-xs text-white/50">
              {entry.quantity} {entry.unit}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white/70">{entry.calories} kcal</span>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
          >
            <Pencil className="h-3 w-3 text-white/50" />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden",
        isDeleting && "opacity-50 pointer-events-none"
      )}
    >
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-4"
          >
            {/* Name & Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1">Food Name</label>
                <input
                  type="text"
                  value={editValues.name}
                  onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-white/50 mb-1">Qty</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={editValues.quantity}
                    onChange={(e) => setEditValues({ ...editValues, quantity: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-white/50 mb-1">Unit</label>
                  <input
                    type="text"
                    value={editValues.unit}
                    onChange={(e) => setEditValues({ ...editValues, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            {/* Meal Type */}
            <div className="relative">
              <label className="block text-xs text-white/50 mb-1">Meal Type</label>
              <button
                type="button"
                onClick={() => setShowMealTypeDropdown(!showMealTypeDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white"
              >
                <span className="flex items-center gap-2">
                  <span>{MEAL_TYPE_ICONS[editValues.mealType]}</span>
                  {editValues.mealType}
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
                          setEditValues({ ...editValues, mealType: type })
                          setShowMealTypeDropdown(false)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/5"
                      >
                        <span>{MEAL_TYPE_ICONS[type]}</span>
                        <span className={editValues.mealType === type ? "text-accent" : "text-white/70"}>
                          {type}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Nutrition */}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-xs text-white/50 mb-1">Calories</label>
                <input
                  type="number"
                  min="0"
                  value={editValues.calories}
                  onChange={(e) => setEditValues({ ...editValues, calories: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Protein</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={editValues.protein}
                  onChange={(e) => setEditValues({ ...editValues, protein: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Carbs</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={editValues.carbs}
                  onChange={(e) => setEditValues({ ...editValues, carbs: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Fat</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={editValues.fat}
                  onChange={(e) => setEditValues({ ...editValues, fat: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-accent text-black font-medium hover:bg-accent/90"
              >
                <Check className="h-4 w-4" />
                Save
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{MEAL_TYPE_ICONS[entry.mealType]}</span>
                <div>
                  <h3 className="font-medium text-white">{entry.name}</h3>
                  <p className="text-xs text-white/50">
                    {entry.quantity} {entry.unit}
                    {entry.isEdited && <span className="ml-1 text-accent">(edited)</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={cn("text-xs font-medium", MEAL_TYPE_COLORS[entry.mealType])}>
                  {entry.mealType}
                </span>
                <span className="text-xs text-white/30 ml-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formattedTime}
                </span>
              </div>
            </div>

            {/* Nutrition grid */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-orange-500/10">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                <div>
                  <p className="text-xs font-medium text-white">{entry.calories}</p>
                  <p className="text-[10px] text-white/50">kcal</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-500/10">
                <Drumstick className="h-3.5 w-3.5 text-red-400" />
                <div>
                  <p className="text-xs font-medium text-white">{entry.protein}g</p>
                  <p className="text-[10px] text-white/50">protein</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-500/10">
                <Wheat className="h-3.5 w-3.5 text-blue-400" />
                <div>
                  <p className="text-xs font-medium text-white">{entry.carbs}g</p>
                  <p className="text-[10px] text-white/50">carbs</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-green-500/10">
                <Droplet className="h-3.5 w-3.5 text-green-400" />
                <div>
                  <p className="text-xs font-medium text-white">{entry.fat}g</p>
                  <p className="text-[10px] text-white/50">fat</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
