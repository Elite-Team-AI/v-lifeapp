"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Dumbbell, TrendingUp, CheckCircle2, Play, Sparkles, Loader2, RefreshCw, Info, ChevronDown, ChevronUp } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"

interface PersonalizedWorkoutPlanProps {
  onStartWorkout?: (workout: any) => void
}

export function PersonalizedWorkoutPlan({ onStartWorkout }: PersonalizedWorkoutPlanProps) {
  const { user } = useAuth()
  const [currentPlan, setCurrentPlan] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRationale, setShowRationale] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchCurrentPlan()
    }
  }, [user])

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
      setError(err.message || 'Failed to load workout plan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePlan = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      const response = await fetch('/api/workouts/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id
        }),
      })

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = 'Failed to generate plan'
        let needsEquipment = false
        try {
          const data = await response.json()
          needsEquipment = data.needsEquipment || false

          // Handle validation errors (details is an array)
          if (data.details && Array.isArray(data.details)) {
            errorMessage = data.details.map((d: any) => d.message).join(', ')
          } else {
            errorMessage = data.error || data.message || errorMessage
          }
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage
        }

        const error: any = new Error(errorMessage)
        error.needsEquipment = needsEquipment
        throw error
      }

      const data = await response.json()

      // Refresh the plan
      await fetchCurrentPlan()
    } catch (err: any) {
      console.error('Error generating plan:', err)
      setError(err.message || 'Failed to generate workout plan')
      // Store needsEquipment flag for rendering
      if (err.needsEquipment) {
        setError(`${err.message}|NEEDS_EQUIPMENT`)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegeneratePlan = async () => {
    const confirmed = window.confirm(
      'Regenerating your plan will replace your current plan and reset all progress. Are you sure you want to continue?'
    )

    if (!confirmed) {
      return
    }

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
            {error.includes('|NEEDS_EQUIPMENT') ? (
              <>
                <p className="text-red-200 text-sm mb-3">{error.split('|')[0]}</p>
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
              <p className="text-red-200 text-sm">{error}</p>
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
              Generating Your Plan...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate My Personalized Plan
            </>
          )}
        </Button>

        <p className="text-center text-[#8FD1FF]/60 text-xs mt-3">
          Takes ~30 seconds to create your custom 4-week plan
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
            {error.includes('|NEEDS_EQUIPMENT') ? (
              <>
                <p className="text-red-200 text-sm mb-3">{error.split('|')[0]}</p>
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
              <p className="text-red-200 text-sm">{error}</p>
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
              Regenerating Plan...
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

      {/* Next Workout */}
      {todaysWorkout ? (
        <Card className="bg-gradient-to-br from-[#FADF4A]/20 to-[#FADF4A]/5 backdrop-blur-md border-[#FADF4A]/30 p-6 rounded-3xl shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#FADF4A] rounded-xl flex items-center justify-center flex-shrink-0">
                <Dumbbell className="w-6 h-6 text-[#101938]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{todaysWorkout.workout_name}</h3>
                <p className="text-[#FADF4A]/80 text-sm">{todaysWorkout.estimated_duration_minutes} minutes</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#8FD1FF]/70">Week {todaysWorkout.week_number}</div>
              <div className="text-xs text-[#8FD1FF]/70">Day {todaysWorkout.day_of_week}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {todaysWorkout.muscle_groups?.map((muscle: string) => (
              <span
                key={muscle}
                className="px-3 py-1 bg-[#FADF4A]/20 text-[#FADF4A] rounded-full text-xs font-medium"
              >
                {muscle}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-4 text-[#8FD1FF]/80 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>{todaysWorkout.plan_exercises?.length || 0} exercises</span>
          </div>

          <Button
            className="w-full bg-[#FADF4A] hover:bg-[#FADF4A]/90 text-[#101938] rounded-xl font-bold py-4 text-base flex items-center justify-center gap-2 shadow-lg transition-all duration-200 active:scale-[0.98]"
            onClick={() => onStartWorkout?.(todaysWorkout)}
          >
            <Play className="w-5 h-5" />
            Start Workout
          </Button>
        </Card>
      ) : (
        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 backdrop-blur-md border-green-500/30 p-6 rounded-3xl shadow-2xl">
          <div className="text-center py-6">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-white font-bold text-xl mb-2">Plan Complete! 🎉</p>
            <p className="text-green-400/80 text-sm">You've finished all workouts in your plan</p>
          </div>
        </Card>
      )}
    </div>
  )
}
