"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { RefreshCw, ShoppingCart, ChevronRight, RotateCcw, Settings, UtensilsCrossed, ClipboardList, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card, CardContent } from "@/components/ui/card"
import { BottomNav } from "@/components/bottom-nav"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { MealSwapModal } from "@/app/meal-swap-modal"
import { VitalFlowSupplementModal } from "@/app/vitalflow-supplement-modal"
import { useToast } from "@/hooks/use-toast"
import { useNutritionData, invalidateNutritionCache } from "@/hooks/use-nutrition-data"
import { Skeleton, MealsListSkeleton } from "@/components/ui/skeleton-loaders"
import { FoodLogHistory } from "@/components/food-logging"
import type { DailyMeal } from "@/lib/actions/nutrition"
import { cn } from "@/lib/utils"
import { hasAIConsent } from "@/components/ai-consent-dialog"

interface MealOption {
  id: string
  name: string
  calories: number
  description?: string | null
}

interface MealAlternative {
  id: string
  name: string
  calories: number
  description?: string | null
}

type NutritionTab = "log" | "plan"

export function NutritionClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<NutritionTab>("log")
  
  // Fetch nutrition data client-side
  const { data, isLoading, refresh } = useNutritionData()
  
  // Local state for meal plan (updated when data loads or after mutations)
  const [mealPlan, setMealPlan] = useState<DailyMeal[]>([])
  const [swapModalOpen, setSwapModalOpen] = useState(false)
  const [selectedMealForSwap, setSelectedMealForSwap] = useState<DailyMeal | null>(null)
  const [alternatives, setAlternatives] = useState<MealAlternative[]>([])
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatingMealId, setUpdatingMealId] = useState<string | null>(null)
  const [isVitalFlowModalOpen, setIsVitalFlowModalOpen] = useState(false)

  // Sync meal plan with fetched data
  useEffect(() => {
    if (data?.meals) {
      setMealPlan(data.meals)
    }
  }, [data?.meals])

  const handleRefreshPlan = async () => {
    if (isRefreshing) return

    if (!hasAIConsent()) {
      toast({
        title: "AI consent required",
        description: "Enable AI data sharing in Settings > Privacy & Data to generate AI meal plans.",
        variant: "destructive",
      })
      return
    }

    setIsRefreshing(true)

    try {
      const { regenerateMealPlan } = await import("@/lib/actions/nutrition")
      const result = await regenerateMealPlan()
      if (!result.success) {
        throw new Error(result.error || "Failed to regenerate plan")
      }
      toast({
        title: "Plan refreshed",
        description: "Your meal plan has been updated with fresh suggestions!",
      })
      // Invalidate cache and refresh data
      invalidateNutritionCache()
      await refresh()
    } catch (err) {
      console.error("[Nutrition] Failed to regenerate plan:", err)
      toast({
        title: "Unable to refresh",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const eatenTotals = useMemo(() => {
    if (mealPlan.length === 0 && data?.totals) {
      return data.totals
    }

    return mealPlan.reduce(
      (acc, meal) => {
        if (meal.isEaten) {
          acc.calories += meal.calories
          acc.protein += meal.protein
          acc.carbs += meal.carbs
          acc.fat += meal.fat
        }
        return acc
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
  }, [mealPlan, data?.totals])

  const macrosWithCurrent = useMemo(() => {
    const macros = data?.macros
    if (!macros) {
      return {
        calories: { current: 0, target: 2200 },
        protein: { current: 0, target: 160, unit: "g" },
        carbs: { current: 0, target: 220, unit: "g" },
        fat: { current: 0, target: 70, unit: "g" },
      }
    }
    return {
      calories: { ...macros.calories, current: eatenTotals.calories },
      protein: { ...macros.protein, current: eatenTotals.protein },
      carbs: { ...macros.carbs, current: eatenTotals.carbs },
      fat: { ...macros.fat, current: eatenTotals.fat },
    }
  }, [data?.macros, eatenTotals])

  const handleToggleEaten = async (meal: DailyMeal, nextValue: boolean) => {
    const previousValue = meal.isEaten
    setUpdatingMealId(meal.logId)
    setMealPlan((prev) => prev.map((m) => (m.logId === meal.logId ? { ...m, isEaten: nextValue } : m)))

    try {
      const { toggleMealEaten } = await import("@/lib/actions/nutrition")
      const result = await toggleMealEaten(meal.logId, nextValue)
      if (!result.success) {
        throw new Error(result.error || "Unable to update meal status")
      }
    } catch (err) {
      console.error("[Nutrition] Failed to toggle meal eaten state:", err)
      setMealPlan((prev) => prev.map((m) => (m.logId === meal.logId ? { ...m, isEaten: previousValue } : m)))
      toast({
        title: "Could not update meal",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingMealId(null)
    }
  }

  const openSwapModal = async (meal: DailyMeal) => {
    setSelectedMealForSwap(meal)
    setIsLoadingAlternatives(true)
    setSwapModalOpen(true)
    try {
      const { getMealAlternatives } = await import("@/lib/actions/nutrition")
      const options = await getMealAlternatives(meal.type, meal.mealId)
      setAlternatives(options)
    } catch (error) {
      console.error("[Nutrition] Failed to load alternatives:", error)
      toast({
        title: "Unable to load alternatives",
        description: "Please try again.",
        variant: "destructive",
      })
      setSwapModalOpen(false)
    } finally {
      setIsLoadingAlternatives(false)
    }
  }

  const handleMealSwap = async (newMeal: MealOption) => {
    if (!selectedMealForSwap) return
    try {
      const { swapMeal } = await import("@/lib/actions/nutrition")
      const result = await swapMeal(selectedMealForSwap.logId, newMeal.id)
      if (!result.success) {
        throw new Error(result.error || "Unable to swap meal")
      }
      toast({
        title: "Meal updated",
        description: `${selectedMealForSwap.type} has been refreshed.`,
      })
      // Invalidate cache and refresh data
      invalidateNutritionCache()
      await refresh()
      setSwapModalOpen(false)
    } catch (error) {
      console.error("[Nutrition] Failed to swap meal:", error)
      toast({
        title: "Unable to swap meal",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    }
  }

  const supplements = data?.supplements ?? []
  const tomorrowMeals = data?.tomorrowMeals ?? []

  // Get macro targets for food log
  const macroTargets = useMemo(() => ({
    calories: data?.macros?.calories?.target || 2200,
    protein: data?.macros?.protein?.target || 160,
    carbs: data?.macros?.carbs?.target || 220,
    fat: data?.macros?.fat?.target || 70,
  }), [data?.macros])

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-charcoal pb-nav-safe">
      <div className="container max-w-md px-4 py-6">
        <motion.div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Nutrition</h1>
              <p className="text-white/70">Track & plan your meals</p>
            </div>
            <Link href="/tools">
              <ButtonGlow variant="outline-glow" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </ButtonGlow>
            </Link>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-200 delay-50">
          <div className="flex rounded-xl bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("log")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === "log"
                  ? "bg-accent text-black"
                  : "text-white/60 hover:text-white"
              )}
            >
              <UtensilsCrossed className="h-4 w-4" />
              Food Log
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("plan")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === "plan"
                  ? "bg-accent text-black"
                  : "text-white/60 hover:text-white"
              )}
            >
              <ClipboardList className="h-4 w-4" />
              Meal Plan
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === "log" ? (
            <motion.div
              key="log"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <FoodLogHistory macroTargets={macroTargets} />
            </motion.div>
          ) : (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
        <motion.div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-200 delay-75">
          <Card className="border-white/10 bg-black/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white">Macros Summary</h2>
                <a href="/health-sources" className="text-[10px] text-accent/70 hover:text-accent transition-colors">
                  View sources
                </a>
              </div>
              <p className="mb-3 text-xs text-white/60">Based on eaten meals. Targets derived from ISSN and AMDR guidelines.</p>

              {isLoading ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="h-1.5 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-white/70">Calories</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="text-white/40 hover:text-white/60 transition-colors">
                                <Info className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px] text-center">
                              <p className="text-xs">Based on your goal weight and primary goal (ISSN/AMDR guidelines). Update in Profile Settings.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-white">
                        {macrosWithCurrent.calories.current} / {macrosWithCurrent.calories.target} kcal
                      </span>
                    </div>
                    <Progress
                      value={
                        (macrosWithCurrent.calories.current / (macrosWithCurrent.calories.target || 1)) *
                        100
                      }
                      className="h-2 bg-white/10"
                      indicatorClassName="bg-accent"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {(["protein", "carbs", "fat"] as const).map((macro) => (
                      <div key={macro} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="capitalize text-white/70">{macro}</span>
                          <span className="text-white">
                            {macrosWithCurrent[macro].current}
                            {macrosWithCurrent[macro].unit || ""}
                          </span>
                        </div>
                        <Progress
                          value={
                            (macrosWithCurrent[macro].current / (macrosWithCurrent[macro].target || 1)) *
                            100
                          }
                          className="h-1.5 bg-white/10"
                          indicatorClassName={
                            macro === "protein" ? "bg-accent" : macro === "carbs" ? "bg-blue-500" : "bg-green-500"
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-200 delay-100">
          <h2 className="mb-3 text-lg font-bold text-white">Today's Meals</h2>

          {isLoading ? (
            <MealsListSkeleton />
          ) : (
            <div className="space-y-3">
              {mealPlan.map((meal) => {
                const isUpdating = updatingMealId === meal.logId
                return (
                  <Card
                    key={meal.logId}
                    className={cn(
                      "overflow-hidden border-white/10 bg-black/50 backdrop-blur-sm transition-colors",
                      meal.isEaten && "border-accent/40 bg-black/40",
                    )}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        <div className="flex items-center justify-center px-3">
                          <Checkbox
                            checked={meal.isEaten}
                            onCheckedChange={(checked) => handleToggleEaten(meal, checked === true)}
                            disabled={isUpdating}
                            aria-label={`${meal.isEaten ? "Mark as not eaten" : "Mark as eaten"}: ${meal.name}`}
                            className="border-white/30 data-[state=checked]:border-accent data-[state=checked]:bg-accent/90"
                          />
                        </div>
                        <div
                          className={cn(
                            "h-24 w-24 flex-shrink-0 overflow-hidden bg-white/5 transition-opacity",
                            meal.isEaten && "opacity-70",
                          )}
                        >
                          <img
                            src={meal.image || "/placeholder.svg"}
                            alt={meal.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div
                          className={cn(
                            "flex flex-1 flex-col justify-between p-3 transition-opacity",
                            meal.isEaten && "opacity-70",
                          )}
                        >
                          <div>
                            <span className="text-xs font-medium text-accent">{meal.type}</span>
                            <h3 className="font-medium text-white">{meal.name}</h3>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white/70">{meal.calories} kcal</span>
                              {meal.isEaten ? (
                                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-semibold text-accent">
                                  Eaten
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openSwapModal(meal)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 transition-all hover:bg-accent/30 group"
                                title="Swap this meal"
                                type="button"
                                disabled={isUpdating}
                              >
                                <RotateCcw className="h-4 w-4 text-accent transition-transform duration-300 group-hover:rotate-180" />
                              </button>
                              <ChevronRight className="h-4 w-4 text-white/40" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Tomorrow's Plan section removed - simplified to single-day view */}

        <div className="flex gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-200 delay-150">
          <ButtonGlow
            variant="outline-glow"
            className="flex-1"
            onClick={handleRefreshPlan}
            disabled={isRefreshing || isLoading}
            type="button"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} /> {isRefreshing ? "Refreshing..." : "Refresh Plan"}
          </ButtonGlow>
          <Link href="/grocery-list" className="flex-1">
            <ButtonGlow variant="accent-glow" className="w-full" type="button">
              <ShoppingCart className="mr-2 h-4 w-4" /> Grocery List
            </ButtonGlow>
          </Link>
        </div>

        <motion.div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-200 delay-200">
          <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-transparent backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Recommended Supplements</h2>
                <span className="text-2xl">💊</span>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {supplements.length === 0 ? (
                    <p className="text-sm text-white/70">Supplement guidance coming soon.</p>
                  ) : (
                    supplements.map((supplement) => {
                      const isVitalFlow = supplement.name === "Vital Flow" || supplement.featured
                      
                      if (isVitalFlow) {
                        return (
                          <button
                            key={supplement.id}
                            type="button"
                            onClick={() => setIsVitalFlowModalOpen(true)}
                            className="flex w-full items-center justify-between rounded-lg bg-black/30 p-3 text-left transition-all hover:bg-black/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                          >
                            <div>
                              <p className="font-medium text-white">{supplement.name}</p>
                              <p className="text-xs text-white/60">{supplement.category}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-accent" aria-hidden />
                          </button>
                        )
                      }
                      
                      return (
                        <div
                          key={supplement.id}
                          className="flex w-full items-center justify-between rounded-lg bg-black/30 p-3"
                        >
                          <div>
                            <p className="font-medium text-white">{supplement.name}</p>
                            <p className="text-xs text-white/60">{supplement.category}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <MealSwapModal
          isOpen={swapModalOpen}
          onClose={() => setSwapModalOpen(false)}
          mealType={selectedMealForSwap?.type || ""}
          currentMeal={selectedMealForSwap?.name || ""}
          alternatives={alternatives}
          onSwap={handleMealSwap}
          loadingAlternatives={isLoadingAlternatives}
        />

        <VitalFlowSupplementModal
          isOpen={isVitalFlowModalOpen}
          onClose={() => setIsVitalFlowModalOpen(false)}
          purchaseUrl="https://vitalflowofficial.com/"
        />
      </div>

      <BottomNav />
    </div>
  )
}
