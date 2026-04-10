"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Calendar, Dumbbell, TrendingUp, CheckCircle2, Play, Sparkles, Loader2, RefreshCw, Info, ChevronDown, ChevronUp, Clock } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { motion, AnimatePresence } from "framer-motion"

interface PersonalizedWorkoutPlanProps {
  onStartWorkout?: (workout: any) => void
}

export function PersonalizedWorkoutPlan({ onStartWorkout }: PersonalizedWorkoutPlanProps) {
  const { user } = useAuth()
  const [currentPlan, setCurrentPlan] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingWeek, setGeneratingWeek] = useState<number | null>(null)
  const [error, setError] = useState<{ message: string; needsEquipment?: boolean } | null>(null)
  const [showRationale, setShowRationale] = useState(false)
  const [showUpcoming, setShowUpcoming] = useState(false)
  const [wakeLock, setWakeLock] = useState<any>(null)
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)
  const isGeneratingRef = useRef(false)

  useEffect(() => {
    if (user?.id) {
      fetchCurrentPlan()
    }
  }, [user])

  // Cleanup wake lock on component unmount
  useEffect(() => {
    return () => {
      if (wakeLock) {
        wakeLock.release().catch((err: any) => console.warn('Error releasing wake lock on unmount:', err))
      }
    }
  }, [wakeLock])

  const fetchCurrentPlan = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const timestamp = Date.now()
      const response = await fetch(`/api/workouts/current-plan?userId=${user?.id}&t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      })

      if (!response.ok) {
        let errorMessage = 'Failed to load workout plan'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (data.hasActivePlan) {
        setCurrentPlan(data.plan)
      } else {
        setCurrentPlan(null)
      }
    } catch (err: any) {
      console.error('Error fetching plan:', err)
      setError({ message: err.message || 'Failed to load workout plan' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePlan = async () => {
    if (isGeneratingRef.current) return
    isGeneratingRef.current = true

    let wakeLockInstance: any = null

    try {
      setIsGenerating(true)
      setError(null)

      // Request wake lock to keep screen awake during generation
      try {
        if ('wakeLock' in navigator) {
          wakeLockInstance = await (navigator as any).wakeLock.request('screen')
          setWakeLock(wakeLockInstance)
          console.log('Wake Lock activated - screen will stay on during generation')

          // Handle wake lock release (e.g., if user switches tabs)
          wakeLockInstance.addEventListener('release', () => {
            console.log('Wake Lock released')
          })
        } else {
          console.log('Wake Lock API not supported - user must keep screen on manually')
        }
      } catch (wakeLockError) {
        // Wake lock failed - continue anyway but log it
        console.warn('Failed to acquire wake lock:', wakeLockError)
      }

      const allWeeks: any[] = []
      let planMetadata: any = null

      // Helper: generate a single week with up to 2 retries
      const generateWeekWithRetry = async (weekNumber: number, retryCount = 0): Promise<any> => {
        const requestBody: any = {
          userId: user?.id,
          weekNumber
        }

        // For weeks 2-4, pass previous weeks as context
        if (weekNumber > 1 && allWeeks.length > 0) {
          requestBody.preferences = {
            previousWeeks: allWeeks
          }
        }

        const response = await fetch('/api/workouts/generate-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        // Check if response is ok before parsing JSON
        if (!response.ok) {
          let errorMessage = `Failed to generate week ${weekNumber}`
          let needsEquipment = false
          let isRetryable = true
          try {
            const data = await response.json()
            needsEquipment = data.needsEquipment || false

            // Handle validation errors (details is an array)
            if (data.details && Array.isArray(data.details)) {
              errorMessage = data.details.map((d: any) => d.message).join(', ')
            } else {
              errorMessage = data.error || data.message || errorMessage
            }

            // Don't retry equipment/profile errors — user needs to fix their settings
            if (needsEquipment || response.status === 400) {
              isRetryable = false
            }
          } catch {
            // If JSON parsing fails, use status text (could be a gateway timeout)
            errorMessage = response.status === 504
              ? 'The request timed out. Please try again.'
              : (response.statusText || errorMessage)
          }

          // Retry transient errors (AI failures, timeouts, 5xx)
          if (isRetryable && retryCount < 2) {
            console.warn(`Week ${weekNumber} failed (attempt ${retryCount + 1}), retrying...`, errorMessage)
            return generateWeekWithRetry(weekNumber, retryCount + 1)
          }

          const error: any = new Error(errorMessage)
          error.needsEquipment = needsEquipment
          throw error
        }

        return response.json()
      }

      // Generate each week sequentially
      for (let weekNumber = 1; weekNumber <= 4; weekNumber++) {
        setGeneratingWeek(weekNumber)

        const data = await generateWeekWithRetry(weekNumber)

        // Store week data
        if (data.weekData) {
          allWeeks.push(data.weekData)
        }

        // Store plan metadata from week 1
        if (weekNumber === 1 && data.planMetadata) {
          planMetadata = data.planMetadata
        }
      }

      // All 4 weeks generated successfully
      console.log('All 4 weeks generated:', { allWeeks, planMetadata })

      // Save the complete plan to database
      const savePlanResponse = await fetch('/api/workouts/save-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          planMetadata,
          weeks: allWeeks
        }),
      })

      if (!savePlanResponse.ok) {
        const errorData = await savePlanResponse.json()
        console.error('Save plan error:', errorData)
        // Use the user-friendly message from the API, or fall back to error
        throw new Error(errorData.message || errorData.error || 'Failed to save. Please try again.')
      }

      // Refresh the plan — wrap separately so save errors vs load errors are distinct
      try {
        await fetchCurrentPlan()
      } catch (loadErr: any) {
        console.error('Plan saved but failed to load it:', loadErr)
        // Plan was saved successfully — just refresh the page to show it
        setError({ message: 'Plan created! Please refresh the page to view it.' })
      }
    } catch (err: any) {
      console.error('Error generating plan:', err)
      setError({
        message: err.message || 'Failed to generate. Please try again.',
        needsEquipment: !!err.needsEquipment
      })
    } finally {
      setIsGenerating(false)
      setGeneratingWeek(null)
      isGeneratingRef.current = false

      // Release wake lock when generation completes
      if (wakeLockInstance) {
        try {
          await wakeLockInstance.release()
          setWakeLock(null)
        } catch (releaseError) {
          console.warn('Failed to release wake lock:', releaseError)
        }
      }
    }
  }

  const handleRegeneratePlan = () => {
    setShowRegenConfirm(true)
  }

  const confirmRegenerate = async () => {
    setShowRegenConfirm(false)
    await handleGeneratePlan()
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-[#FADF4A]/20 to-[#FADF4A]/5 backdrop-blur-md border-[#FADF4A]/30 p-7 rounded-3xl shadow-2xl">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-[#FADF4A] animate-spin" />
        </div>
      </Card>
    )
  }

  // No plan - show generation CTA
  if (!currentPlan) {
    return (
      <Card className="bg-gradient-to-br from-[#FADF4A]/20 to-[#FADF4A]/5 backdrop-blur-md border-[#FADF4A]/30 p-7 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-[#FADF4A] rounded-2xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-7 h-7 text-[#101938]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">AI-Powered Workout Plan</h2>
            <p className="text-[#FADF4A]/80 text-sm">Tailored to your goals & equipment</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#8FD1FF] mt-0.5 flex-shrink-0" />
            <p className="text-[#8FD1FF]/90 text-sm">4-week mesocycle with progressive overload</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#8FD1FF] mt-0.5 flex-shrink-0" />
            <p className="text-[#8FD1FF]/90 text-sm">Customized to your equipment and location</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#8FD1FF] mt-0.5 flex-shrink-0" />
            <p className="text-[#8FD1FF]/90 text-sm">Adapts based on your logged performance</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            {error.needsEquipment ? (
              <>
                <p className="text-red-200 text-sm mb-3">{error.message}</p>
                <a
                  href="/settings"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#8FD1FF]/20 hover:bg-[#8FD1FF]/30 text-[#8FD1FF] rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Go to Settings
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </>
            ) : (
              <p className="text-red-200 text-sm">{error.message}</p>
            )}
          </div>
        )}

        <Button
          className="w-full bg-[#FADF4A] hover:bg-[#FADF4A]/90 text-[#101938] rounded-2xl font-bold py-5 text-lg flex items-center justify-center gap-2 shadow-lg transition-all duration-200 active:scale-[0.98]"
          onClick={handleGeneratePlan}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {generatingWeek ? `Generating Week ${generatingWeek} of 4...` : 'Generating Your Plan...'}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate My Personalized Plan
            </>
          )}
        </Button>

        <p className="text-center text-[#8FD1FF]/60 text-xs mt-3">
          {isGenerating && generatingWeek ? (
            <>
              Creating week {generatingWeek} of your 4-week plan...
              <br />
              <span className="text-green-400">Your screen will stay on automatically</span>
            </>
          ) : (
            'Takes ~2 minutes to create your custom 4-week plan'
          )}
        </p>
      </Card>
    )
  }

  // Has active plan - show plan overview
  const today = new Date().toISOString().split('T')[0]
  const todaysWorkout = currentPlan.todaysWorkout

  return (
    <div className="space-y-4">
      {/* Current Plan Overview */}
      <Card className="bg-gradient-to-br from-[#8FD1FF]/20 to-[#8FD1FF]/5 backdrop-blur-md border-[#8FD1FF]/30 p-6 rounded-3xl shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-[#8FD1FF]" />
              <span className="text-[#8FD1FF]/80 text-sm font-medium">
                Week {currentPlan.currentWeek} of {currentPlan.totalWeeks}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{currentPlan.name}</h2>
            <p className="text-[#8FD1FF]/70 text-sm">
              {currentPlan.type.replace('_', ' ').toUpperCase()} • {currentPlan.daysPerWeek} days/week
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-medium">Progress</span>
            <span className="text-[#8FD1FF] text-sm font-bold">{currentPlan.progress.adherenceRate}%</span>
          </div>
          <div className="w-full h-2 bg-[#1D295B]/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8FD1FF] to-[#F676CD] rounded-full transition-all duration-500"
              style={{ width: `${currentPlan.progress.adherenceRate}%` }}
            />
          </div>
          <p className="text-[#8FD1FF]/60 text-xs mt-2">
            {currentPlan.progress.completedWorkouts} of {currentPlan.progress.totalWorkouts} workouts completed
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#1D295B]/50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-[#FADF4A]">{currentPlan.progress.completedWorkouts}</div>
            <div className="text-white text-xs">Completed</div>
          </div>
          <div className="bg-[#1D295B]/50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-[#8FD1FF]">{currentPlan.progress.remainingWorkouts}</div>
            <div className="text-white text-xs">Remaining</div>
          </div>
          <div className="bg-[#1D295B]/50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-[#F676CD]">{currentPlan.currentWeek}</div>
            <div className="text-white text-xs">Current Week</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            {error.needsEquipment ? (
              <>
                <p className="text-red-200 text-sm mb-3">{error.message}</p>
                <a
                  href="/settings"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#8FD1FF]/20 hover:bg-[#8FD1FF]/30 text-[#8FD1FF] rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Go to Settings
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </>
            ) : (
              <p className="text-red-200 text-sm">{error.message}</p>
            )}
          </div>
        )}

        {/* Regenerate Button */}
        <Button
          className="w-full bg-[#1D295B]/50 hover:bg-[#1D295B]/70 text-[#8FD1FF] border border-[#8FD1FF]/30 hover:border-[#8FD1FF]/50 rounded-xl font-medium py-3 text-sm flex items-center justify-center gap-2 transition-all duration-200"
          onClick={handleRegeneratePlan}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {generatingWeek ? `Generating Week ${generatingWeek} of 4...` : 'Regenerating Plan...'}
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Regenerate Plan
            </>
          )}
        </Button>
      </Card>

      {/* Plan Rationale Section */}
      {currentPlan.rationale && (
        <Card className="bg-gradient-to-br from-[#FADF4A]/20 to-[#FADF4A]/5 backdrop-blur-md border-[#FADF4A]/30 p-6 rounded-3xl shadow-2xl">
          <button
            onClick={() => setShowRationale(!showRationale)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FADF4A] rounded-xl flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-[#101938]" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">Why Your Plan Was Designed This Way</h3>
                <p className="text-[#FADF4A]/80 text-xs">Learn about your training modality and what to expect</p>
              </div>
            </div>
            {showRationale ? (
              <ChevronUp className="w-5 h-5 text-[#FADF4A]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#FADF4A]" />
            )}
          </button>

          {showRationale && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Why This Plan */}
              {currentPlan.rationale.whyThisPlan && (
                <div className="bg-[#1D295B]/50 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-[#FADF4A] mb-2">Why This Plan</h4>
                  <p className="text-white/90 text-sm leading-relaxed">{currentPlan.rationale.whyThisPlan}</p>
                </div>
              )}

              {/* Primary Modality Explanation */}
              {currentPlan.rationale.primaryModalityExplanation && (
                <div className="bg-[#1D295B]/50 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-[#FADF4A] mb-2">Your Training Modality</h4>
                  <p className="text-white/90 text-sm leading-relaxed">{currentPlan.rationale.primaryModalityExplanation}</p>
                </div>
              )}

              {/* What to Expect */}
              {currentPlan.rationale.whatToExpect && (
                <div className="bg-[#1D295B]/50 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-[#FADF4A] mb-3">What To Expect</h4>
                  <div className="space-y-3">
                    {currentPlan.rationale.whatToExpect.physiologicalAdaptations && (
                      <div>
                        <p className="text-[#8FD1FF] text-xs font-medium mb-1">Physical Changes:</p>
                        <p className="text-white/80 text-sm">{currentPlan.rationale.whatToExpect.physiologicalAdaptations}</p>
                      </div>
                    )}
                    {currentPlan.rationale.whatToExpect.performanceGains && (
                      <div>
                        <p className="text-[#8FD1FF] text-xs font-medium mb-1">Performance Gains:</p>
                        <p className="text-white/80 text-sm">{currentPlan.rationale.whatToExpect.performanceGains}</p>
                      </div>
                    )}
                    {currentPlan.rationale.whatToExpect.timeline && (
                      <div>
                        <p className="text-[#8FD1FF] text-xs font-medium mb-1">Timeline:</p>
                        <p className="text-white/80 text-sm">{currentPlan.rationale.whatToExpect.timeline}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Plan Structure */}
              {currentPlan.rationale.planStructure && (
                <div className="bg-[#1D295B]/50 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-[#FADF4A] mb-3">Plan Structure</h4>
                  <div className="space-y-2">
                    {currentPlan.rationale.planStructure.weekByWeek && (
                      <div>
                        <p className="text-[#8FD1FF] text-xs font-medium mb-1">4-Week Progression:</p>
                        <p className="text-white/80 text-sm">{currentPlan.rationale.planStructure.weekByWeek}</p>
                      </div>
                    )}
                    {currentPlan.rationale.planStructure.progressionStrategy && (
                      <div>
                        <p className="text-[#8FD1FF] text-xs font-medium mb-1">How We Progress:</p>
                        <p className="text-white/80 text-sm">{currentPlan.rationale.planStructure.progressionStrategy}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Personalization Factors */}
              {currentPlan.rationale.personalizationFactors && currentPlan.rationale.personalizationFactors.length > 0 && (
                <div className="bg-[#1D295B]/50 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-[#FADF4A] mb-2">Personalized For You</h4>
                  <ul className="space-y-1.5">
                    {currentPlan.rationale.personalizationFactors.map((factor: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#8FD1FF] mt-0.5 flex-shrink-0" />
                        <span className="text-white/80 text-sm">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Success Tips */}
              {currentPlan.rationale.successTips && currentPlan.rationale.successTips.length > 0 && (
                <div className="bg-gradient-to-r from-[#FADF4A]/20 to-[#FADF4A]/10 rounded-xl p-4 border border-[#FADF4A]/20">
                  <h4 className="text-sm font-bold text-[#FADF4A] mb-2">Tips for Success</h4>
                  <ul className="space-y-1.5">
                    {currentPlan.rationale.successTips.map((tip: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#FADF4A] mt-0.5 flex-shrink-0" />
                        <span className="text-white/90 text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* This Week's Workouts */}
      {currentPlan.weeklyWorkouts && currentPlan.weeklyWorkouts[currentPlan.currentWeek] ? (
        <div className="space-y-4">
          {/* Week Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FADF4A] to-[#F9C74F] rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-5 h-5 text-[#101938]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Week {currentPlan.currentWeek} Schedule</h3>
                <p className="text-[#8FD1FF]/70 text-sm">
                  {currentPlan.weeklyWorkouts[currentPlan.currentWeek].filter((w: any) => w.is_completed).length}/{currentPlan.weeklyWorkouts[currentPlan.currentWeek].length} completed
                </p>
              </div>
            </div>
          </div>

          {(() => {
            const weekWorkouts = currentPlan.weeklyWorkouts[currentPlan.currentWeek]
            const nextWorkoutIndex = weekWorkouts.findIndex((w: any) => !w.is_completed)
            const nextWorkout = nextWorkoutIndex >= 0 ? weekWorkouts[nextWorkoutIndex] : null
            const upcomingWorkouts = nextWorkout ? weekWorkouts.slice(nextWorkoutIndex + 1).filter((w: any) => !w.is_completed) : []
            const completedWorkouts = weekWorkouts.filter((w: any) => w.is_completed)

            const WorkoutCard = ({ workout, isNext = false, isCompleted = false }: { workout: any, isNext?: boolean, isCompleted?: boolean }) => (
              <Card
                className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                  isCompleted
                    ? 'bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30'
                    : isNext
                    ? 'bg-gradient-to-br from-[#FADF4A]/15 to-[#F9C74F]/5 border-[#FADF4A]/40 shadow-lg shadow-[#FADF4A]/10'
                    : 'bg-gradient-to-br from-[#1D295B]/40 to-[#101938]/20 border-[#1D295B]/40'
                }`}
              >
                {/* Accent Bar */}
                {isNext && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#FADF4A] to-[#F9C74F]" />
                )}

                <CardContent className="p-5">
                  <div className="space-y-4">
                    {/* Header Section */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Status Icon */}
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                            isCompleted
                              ? 'bg-gradient-to-br from-green-500/30 to-green-600/20 shadow-lg shadow-green-500/20'
                              : isNext
                              ? 'bg-gradient-to-br from-[#FADF4A] to-[#F9C74F] shadow-lg shadow-[#FADF4A]/30'
                              : 'bg-[#1D295B]/60'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                          ) : (
                            <Dumbbell
                              className={`w-6 h-6 ${isNext ? 'text-[#101938]' : 'text-white/50'}`}
                            />
                          )}
                        </div>

                        {/* Workout Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-2">
                            <h4 className={`text-lg font-bold ${isNext ? 'text-white' : 'text-white/90'} truncate flex-1`}>
                              {workout.workout_name}
                            </h4>
                            {isNext && (
                              <span className="px-3 py-1 bg-gradient-to-r from-[#FADF4A] to-[#F9C74F] text-[#101938] rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                                Up Next
                              </span>
                            )}
                          </div>

                          {/* Workout Stats */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                            <span className="flex items-center gap-1.5 text-sm text-white/70">
                              <div className="w-5 h-5 rounded-lg bg-[#8FD1FF]/20 flex items-center justify-center">
                                <Calendar className="w-3 h-3 text-[#8FD1FF]" />
                              </div>
                              <span className="font-medium">Day {workout.day_of_week}</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-sm text-white/70">
                              <div className="w-5 h-5 rounded-lg bg-[#F676CD]/20 flex items-center justify-center">
                                <Clock className="w-3 h-3 text-[#F676CD]" />
                              </div>
                              <span className="font-medium">{workout.estimated_duration_minutes} min</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-sm text-white/70">
                              <div className="w-5 h-5 rounded-lg bg-[#FADF4A]/20 flex items-center justify-center">
                                <TrendingUp className="w-3 h-3 text-[#FADF4A]" />
                              </div>
                              <span className="font-medium">{workout.plan_exercises?.length || 0} exercises</span>
                            </span>
                          </div>

                          {/* Muscle Groups */}
                          {workout.muscle_groups && workout.muscle_groups.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {workout.muscle_groups.map((muscle: string, idx: number) => (
                                <span
                                  key={muscle}
                                  className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                                    isNext
                                      ? 'bg-[#8FD1FF]/25 text-[#8FD1FF] border border-[#8FD1FF]/30'
                                      : 'bg-[#8FD1FF]/15 text-[#8FD1FF]/80 border border-[#8FD1FF]/20'
                                  }`}
                                >
                                  {muscle}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    {!isCompleted && (
                      <Button
                        className={`w-full rounded-2xl font-bold py-4 text-base flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 ${
                          isNext
                            ? 'bg-gradient-to-r from-[#FADF4A] to-[#F9C74F] hover:from-[#F9C74F] hover:to-[#FADF4A] text-[#101938] shadow-xl shadow-[#FADF4A]/30'
                            : 'bg-[#1D295B]/60 hover:bg-[#1D295B]/80 text-white/90 border-2 border-white/10 hover:border-white/20'
                        }`}
                        onClick={() => onStartWorkout?.(workout)}
                      >
                        <Play className={`w-5 h-5 ${isNext ? '' : 'text-white/70'}`} />
                        <span>{isNext ? 'Start Workout Now' : 'Start Workout'}</span>
                      </Button>
                    )}

                    {/* Completion Status */}
                    {isCompleted && workout.completed_date && (
                      <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-500/10 rounded-xl border border-green-500/20">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">
                          Completed {new Date(workout.completed_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )

            return (
              <div className="space-y-3">
                {/* Up Next Workout */}
                {nextWorkout && (
                  <WorkoutCard workout={nextWorkout} isNext={true} />
                )}

                {/* Upcoming Workouts - Collapsible */}
                {upcomingWorkouts.length > 0 && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowUpcoming(!showUpcoming)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[#1D295B]/30 hover:bg-[#1D295B]/50 border border-[#1D295B]/40 rounded-xl transition-all duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#8FD1FF]" />
                        <span className="text-sm font-semibold text-white">
                          Upcoming This Week ({upcomingWorkouts.length})
                        </span>
                      </div>
                      {showUpcoming ? (
                        <ChevronUp className="w-5 h-5 text-[#8FD1FF]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#8FD1FF]" />
                      )}
                    </button>

                    <AnimatePresence>
                      {showUpcoming && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="space-y-3 overflow-hidden"
                        >
                          {upcomingWorkouts.map((workout: any) => (
                            <WorkoutCard key={workout.id} workout={workout} />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Completed Workouts - Always Collapsed */}
                {completedWorkouts.length > 0 && !nextWorkout && (
                  <div className="space-y-3">
                    {completedWorkouts.map((workout: any) => (
                      <WorkoutCard key={workout.id} workout={workout} isCompleted={true} />
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 backdrop-blur-md border-green-500/30 p-6 rounded-3xl shadow-2xl">
          <div className="text-center py-6">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-white font-bold text-xl mb-2">Plan Complete! 🎉</p>
            <p className="text-green-400/80 text-sm">You've finished all workouts in your plan</p>
          </div>
        </Card>
      )}

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={showRegenConfirm} onOpenChange={setShowRegenConfirm}>
        <AlertDialogContent className="bg-neutral-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Regenerate Your Plan?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              This will replace your current plan and reset all progress. A brand-new 4-week plan will be generated based on your current fitness profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-800 text-white border-white/10 hover:bg-neutral-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRegenerate}
              className="bg-yellow-400 text-black hover:bg-yellow-300 font-semibold"
            >
              Yes, Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
