"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { FoodLogCard } from "./FoodLogCard"
import { FoodLoggerInput } from "./FoodLoggerInput"
import { FoodParseConfirmModal } from "./FoodParseConfirmModal"
import type { FoodLogEntry, FoodParseResult, DailyFoodSummary, ParsedFood } from "@/lib/actions/food-logging"
import { Progress } from "@/components/ui/progress"

interface FoodLogHistoryProps {
  initialDate?: string
  macroTargets?: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  className?: string
}

const MEAL_ORDER = ["Breakfast", "Snack (AM)", "Lunch", "Snack (PM)", "Dinner", "Late Snack"] as const

export function FoodLogHistory({ 
  initialDate, 
  macroTargets = { calories: 2200, protein: 160, carbs: 220, fat: 70 },
  className 
}: FoodLogHistoryProps) {
  const [selectedDate, setSelectedDate] = useState(
    initialDate || new Date().toISOString().split("T")[0]
  )
  const [logs, setLogs] = useState<FoodLogEntry[]>([])
  const [summary, setSummary] = useState<DailyFoodSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingParseResult, setPendingParseResult] = useState<FoodParseResult | null>(null)
  const [pendingInput, setPendingInput] = useState<{ text: string; type: "text" | "voice" | "image" } | null>(null)

  // Fetch logs for selected date using client-side Supabase
  // (avoids Next.js server action serialization which blocks behind slow meal plan AI calls)
  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("food_logs")
        .select("*")
        .eq("logged_date", selectedDate)
        .order("logged_at", { ascending: true })

      if (error) {
        console.error("[FoodLogHistory] Query error:", error)
        setLogs([])
        setSummary(null)
        return
      }

      const entries: FoodLogEntry[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        quantity: Number(row.quantity) || 1,
        unit: row.unit || "serving",
        calories: Number(row.calories) || 0,
        protein: Number(row.protein) || 0,
        carbs: Number(row.carbs) || 0,
        fat: Number(row.fat) || 0,
        fiber: Number(row.fiber) || 0,
        sugar: Number(row.sugar) || 0,
        sodium: Number(row.sodium) || 0,
        mealType: row.meal_type,
        loggedDate: row.logged_date,
        loggedAt: row.logged_at,
        originalInput: row.original_input,
        inputType: row.input_type || "text",
        imageUrl: row.image_url,
        aiConfidence: row.ai_confidence ? Number(row.ai_confidence) : null,
        isEdited: Boolean(row.is_edited),
      }))

      setLogs(entries)

      // Build summary
      if (entries.length > 0) {
        const mealBreakdown = { Breakfast: 0, Lunch: 0, Dinner: 0, Snack: 0 }
        let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0
        for (const log of entries) {
          totalCalories += log.calories
          totalProtein += log.protein
          totalCarbs += log.carbs
          totalFat += log.fat
          if (log.mealType in mealBreakdown) {
            (mealBreakdown as any)[log.mealType] += log.calories
          }
        }
        setSummary({
          date: selectedDate,
          totalCalories,
          totalProtein: Math.round(totalProtein * 10) / 10,
          totalCarbs: Math.round(totalCarbs * 10) / 10,
          totalFat: Math.round(totalFat * 10) / 10,
          entries,
          mealBreakdown,
        })
      } else {
        setSummary(null)
      }
    } catch (error) {
      console.error("[FoodLogHistory] Fetch error:", error)
      setLogs([])
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Date navigation
  const goToPreviousDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    setSelectedDate(date.toISOString().split("T")[0])
  }

  const goToNextDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    setSelectedDate(date.toISOString().split("T")[0])
  }

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0])
  }

  // Check if selected date is today
  const isToday = selectedDate === new Date().toISOString().split("T")[0]
  const isFuture = new Date(selectedDate) > new Date(new Date().toISOString().split("T")[0])

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (dateStr === today.toISOString().split("T")[0]) return "Today"
    if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday"
    if (dateStr === tomorrow.toISOString().split("T")[0]) return "Tomorrow"
    
    return date.toLocaleDateString(undefined, { 
      weekday: "short", 
      month: "short", 
      day: "numeric" 
    })
  }

  // Handle parsed food result
  const handleParseComplete = useCallback((result: FoodParseResult, input: string, inputType: "text" | "voice" | "image") => {
    console.log("[FoodLogHistory] handleParseComplete called:", {
      success: result.success,
      foodsCount: result.foods?.length || 0,
      hasFoods: !!result.foods && result.foods.length > 0
    })
    
    if (!result.foods || result.foods.length === 0) {
      console.error("[FoodLogHistory] No foods in result:", result)
      return
    }
    
    setPendingParseResult(result)
    setPendingInput({ text: input, type: inputType })
    setShowConfirmModal(true)
  }, [])

  // Confirm and log food
  const handleConfirmLog = useCallback(async (
    foods: ParsedFood[],
    mealType: "Breakfast" | "Snack (AM)" | "Lunch" | "Snack (PM)" | "Dinner" | "Late Snack"
  ) => {
    if (!pendingInput) return

    try {
      const { logFood } = await import("@/lib/actions/food-logging")
      await logFood(
        foods,
        mealType,
        pendingInput.text,
        pendingInput.type,
        selectedDate
      )
      
      setShowConfirmModal(false)
      setPendingParseResult(null)
      setPendingInput(null)
      
      // Refresh logs
      await fetchLogs()
    } catch (error) {
      console.error("[FoodLogHistory] Log error:", error)
    }
  }, [pendingInput, selectedDate, fetchLogs])

  // Update entry
  const handleUpdateEntry = useCallback(async (id: string, updates: Partial<FoodLogEntry>) => {
    const { updateFoodLog } = await import("@/lib/actions/food-logging")
    await updateFoodLog(id, updates)
    await fetchLogs()
  }, [fetchLogs])

  // Delete entry
  const handleDeleteEntry = useCallback(async (id: string) => {
    const { deleteFoodLog } = await import("@/lib/actions/food-logging")
    await deleteFoodLog(id)
    await fetchLogs()
  }, [fetchLogs])

  // Group logs by meal type
  const logsByMeal = MEAL_ORDER.reduce((acc, mealType) => {
    acc[mealType] = logs.filter((log) => log.mealType === mealType)
    return acc
  }, {} as Record<string, FoodLogEntry[]>)

  // Calculate progress percentages
  const calorieProgress = summary ? (summary.totalCalories / macroTargets.calories) * 100 : 0
  const proteinProgress = summary ? (summary.totalProtein / macroTargets.protein) * 100 : 0
  const carbsProgress = summary ? (summary.totalCarbs / macroTargets.carbs) * 100 : 0
  const fatProgress = summary ? (summary.totalFat / macroTargets.fat) * 100 : 0

  return (
    <div className={cn("space-y-4", className)}>
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousDay}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-white/70" />
        </button>
        
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-accent" />
          <span className={cn(
            "text-lg font-semibold",
            isToday ? "text-accent" : isFuture ? "text-blue-400" : "text-white"
          )}>
            {formatDate(selectedDate)}
          </span>
          {!isToday && (
            <button
              type="button"
              onClick={goToToday}
              className="ml-2 px-2 py-0.5 rounded-full text-xs bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
            >
              Today
            </button>
          )}
        </div>
        
        <button
          type="button"
          onClick={goToNextDay}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-white/70" />
        </button>
      </div>

      {/* Food Logger Input */}
      <FoodLoggerInput
        selectedDate={selectedDate}
        onParseComplete={handleParseComplete}
      />

      {/* Daily Summary */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-4"
        >
          <h3 className="text-sm font-medium text-white/70 mb-3">Daily Progress</h3>
          
          <div className="space-y-3">
            {/* Calories */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-white/70">Calories</span>
                <span className="text-white">
                  {summary.totalCalories} / {macroTargets.calories} kcal
                </span>
              </div>
              <Progress 
                value={Math.min(100, calorieProgress)} 
                className="h-2 bg-white/10"
                indicatorClassName={calorieProgress > 100 ? "bg-red-500" : "bg-accent"}
              />
            </div>

            {/* Macros grid */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/50">Protein</span>
                  <span className="text-white">{summary.totalProtein}g</span>
                </div>
                <Progress 
                  value={Math.min(100, proteinProgress)} 
                  className="h-1.5 bg-white/10"
                  indicatorClassName="bg-red-400"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/50">Carbs</span>
                  <span className="text-white">{summary.totalCarbs}g</span>
                </div>
                <Progress 
                  value={Math.min(100, carbsProgress)} 
                  className="h-1.5 bg-white/10"
                  indicatorClassName="bg-blue-400"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/50">Fat</span>
                  <span className="text-white">{summary.totalFat}g</span>
                </div>
                <Progress 
                  value={Math.min(100, fatProgress)} 
                  className="h-1.5 bg-white/10"
                  indicatorClassName="bg-green-400"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Food Logs by Meal */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-3">🍽️</div>
          <h3 className="text-lg font-medium text-white mb-1">No food logged</h3>
          <p className="text-sm text-white/50 max-w-xs">
            {isFuture 
              ? "Plan ahead by logging what you'll eat" 
              : "Start tracking what you eat using the input above"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {MEAL_ORDER.map((mealType) => {
            const mealLogs = logsByMeal[mealType]
            if (mealLogs.length === 0) return null

            const mealCalories = mealLogs.reduce((sum, log) => sum + log.calories, 0)

            return (
              <motion.div
                key={mealType}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-medium text-white/70">{mealType}</h3>
                  <span className="text-xs text-white/50">{mealCalories} kcal</span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {mealLogs.map((log) => (
                      <FoodLogCard
                        key={log.id}
                        entry={log}
                        onUpdate={handleUpdateEntry}
                        onDelete={handleDeleteEntry}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && pendingParseResult && (
        <FoodParseConfirmModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false)
            setPendingParseResult(null)
            setPendingInput(null)
          }}
          parseResult={pendingParseResult}
          onConfirm={handleConfirmLog}
        />
      )}
    </div>
  )
}
