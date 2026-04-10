"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  X,
  Check,
  Play,
  Pause,
  Timer,
  Dumbbell,
  ChevronRight,
  CheckCircle2,
  Trophy,
  ChevronLeft,
  SkipForward
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/hooks/use-toast"
import { invalidateFitnessCache } from "@/hooks/use-fitness-data"
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

interface WorkoutSessionProps {
  workout: any
  onComplete: () => void
  onCancel: () => void
}

interface ExerciseSet {
  reps: number
  weight: number
  rpe?: number
  completed: boolean
}

interface ExerciseLog {
  exerciseId: string
  sets: ExerciseSet[]
  notes?: string
}

export function WorkoutSession({ workout, onComplete, onCancel }: WorkoutSessionProps) {
  const { user } = useAuth()
  const [useMetric, setUseMetric] = useState(false)
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [exerciseLogs, setExerciseLogs] = useState<Map<string, ExerciseLog>>(new Map())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showCompletionSummary, setShowCompletionSummary] = useState(false)
  const [completionSummary, setCompletionSummary] = useState<any>(null)
  const hasStartedSessionRef = useRef(false)
  const isCompletingRef = useRef(false)
  const [showExitConfirmation, setShowExitConfirmation] = useState(false)
  const [showSkipExerciseConfirmation, setShowSkipExerciseConfirmation] = useState(false)
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0)
  // Rest timer
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null)
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const exercises = workout.plan_exercises || []

  // Group exercises by superset (if is_superset is true, group consecutive exercises with same superset_group)
  const exerciseGroups: any[][] = []
  let currentGroupBuffer: any[] = []
  let lastSupersetGroup: string | null = null

  exercises.forEach((ex: any, idx: number) => {
    if (ex.is_superset && ex.superset_group === lastSupersetGroup) {
      // Continue current superset group
      currentGroupBuffer.push(ex)
    } else {
      // Start new group
      if (currentGroupBuffer.length > 0) {
        exerciseGroups.push(currentGroupBuffer)
      }
      currentGroupBuffer = [ex]
      lastSupersetGroup = ex.is_superset ? ex.superset_group : null
    }
  })

  // Push final group
  if (currentGroupBuffer.length > 0) {
    exerciseGroups.push(currentGroupBuffer)
  }

  const currentGroup = exerciseGroups[currentGroupIndex] || []
  const isSuperset = currentGroup.length > 1
  const currentExercise = exercises[currentExerciseIndex]

  // Load metric preference
  useEffect(() => {
    setUseMetric(localStorage.getItem('useMetric') === 'true')
  }, [])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning])

  // Rest timer countdown effect
  useEffect(() => {
    if (restSecondsLeft === null) return
    if (restSecondsLeft <= 0) {
      setRestSecondsLeft(null)
      return
    }
    restIntervalRef.current = setInterval(() => {
      setRestSecondsLeft(prev => (prev !== null ? prev - 1 : null))
    }, 1000)
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current)
    }
  }, [restSecondsLeft])

  // Cleanup rest timer on unmount
  useEffect(() => {
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current)
    }
  }, [])

  const startRestTimer = (seconds: number) => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current)
    setRestSecondsLeft(seconds)
  }

  const skipRestTimer = () => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current)
    setRestSecondsLeft(null)
  }

  const formatRestTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`
  }

  // Auto-start workout when user is available
  useEffect(() => {
    if (user?.id && !hasStartedSessionRef.current && !workoutLogId) {
      startWorkoutSession()
    }
  }, [user?.id, workoutLogId])

  const startWorkoutSession = async () => {
    try {
      setIsStarting(true)
      hasStartedSessionRef.current = true

      const isQuickWorkout = workout.id?.startsWith('quick-') || workout.is_quick_workout

      const requestBody: any = {
        userId: user?.id,
        workoutId: workout.id
      }

      // For quick workouts, include the full workout data
      if (isQuickWorkout) {
        requestBody.quickWorkoutData = workout
      }

      const response = await fetch('/api/workouts/logs/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Failed to Start Workout",
          description: `${data.error || 'Unknown error'}${data.details ? '\n' + JSON.stringify(data.details) : ''}`,
          variant: "destructive"
        })
        hasStartedSessionRef.current = false // Allow retry
        return
      }

      if (data.success) {
        setWorkoutLogId(data.workoutLogId)
        setIsTimerRunning(true)

        // Initialize exercise logs
        const logs = new Map<string, ExerciseLog>()

        if (data.isResume && data.exerciseLogs && data.exerciseLogs.length > 0) {
          // Resume existing workout - populate from saved exercise logs
          data.exerciseLogs.forEach((log: any) => {
            const sets = []
            const setsCompleted = log.sets_completed || 0

            // Reconstruct completed sets from array data
            for (let i = 0; i < setsCompleted; i++) {
              sets.push({
                reps: log.reps_per_set?.[i] ?? 1,
                weight: log.weight_per_set?.[i] ?? 0,
                rpe: log.rpe_per_set?.[i],
                completed: true
              })
            }

            // Find the plan exercise to determine total target sets
            const planExercise = exercises.find((ex: any) => ex.exercise_id === log.exercise_id)
            const targetSets = planExercise?.target_sets || setsCompleted

            // Add remaining incomplete sets if needed
            while (sets.length < targetSets) {
              sets.push({
                reps: planExercise?.target_reps_min ?? 1,
                weight: planExercise?.target_weight_lbs ?? 0,
                rpe: undefined,
                completed: false
              })
            }

            logs.set(log.exercise_id, {
              exerciseId: log.exercise_id,
              sets
            })
          })

          // Calculate elapsed time from started_at if available
          if (data.workout?.started_at) {
            const startedAt = new Date(data.workout.started_at)
            const now = new Date()
            const elapsedSecs = Math.floor((now.getTime() - startedAt.getTime()) / 1000)
            setElapsedSeconds(Math.max(0, elapsedSecs))
          }

          // Also initialize any exercises that weren't in the saved logs yet
          // (e.g. exercises the user hadn't reached before closing the app)
          exercises.forEach((ex: any) => {
            if (!logs.has(ex.exercise_id)) {
              logs.set(ex.exercise_id, {
                exerciseId: ex.exercise_id,
                sets: Array(ex.target_sets || 3).fill(null).map(() => ({
                  reps: ex.target_reps_min ?? 1,
                  weight: ex.target_weight_lbs ?? 0,
                  rpe: undefined,
                  completed: false
                }))
              })
            }
          })

          toast({
            title: "Workout Resumed",
            description: "Continuing from where you left off"
          })
        } else {
          // New workout - initialize fresh exercise logs
          exercises.forEach((ex: any) => {
            logs.set(ex.exercise_id, {
              exerciseId: ex.exercise_id,
              sets: Array(ex.target_sets || 3).fill(null).map(() => ({
                reps: ex.target_reps_min ?? 1,
                weight: ex.target_weight_lbs ?? 0,
                rpe: undefined,
                completed: false
              }))
            })
          })
        }

        setExerciseLogs(logs)
      }
    } catch (error) {
      console.error('Error starting workout:', error)
      toast({
        title: "Error Starting Workout",
        description: String(error),
        variant: "destructive"
      })
      hasStartedSessionRef.current = false // Allow retry
    } finally {
      setIsStarting(false)
    }
  }

  const logExerciseSet = async (exercise: any, setIndex: number) => {
    if (!workoutLogId || !exercise) return

    const exerciseLog = exerciseLogs.get(exercise.exercise_id)
    if (!exerciseLog) return

    const set = exerciseLog.sets[setIndex]
    if (!set) return

    try {
      // Optimistically mark set as completed
      const updatedSets = [...exerciseLog.sets]
      updatedSets[setIndex] = { ...set, completed: true }

      const updatedLog = { ...exerciseLog, sets: updatedSets }
      const newLogs = new Map(exerciseLogs)
      newLogs.set(exercise.exercise_id, updatedLog)
      setExerciseLogs(newLogs)

      // Start rest timer immediately after completing a set (not just the last set)
      const restSeconds = exercise.rest_seconds
      if (restSeconds && restSeconds > 0) {
        startRestTimer(restSeconds)
      }

      // Check if all sets are completed
      const allSetsCompleted = updatedSets.every(s => s.completed)

      // If all sets completed, log to backend
      if (allSetsCompleted) {
        const response = await fetch('/api/workouts/logs/exercise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            workoutLogId,
            exerciseId: exercise.exercise_id,
            exerciseType: exercise.exercise?.exercise_type || 'strength',
            planExerciseId: exercise.id,
            sets: updatedSets.map(s => ({
              reps: s.reps,
              weight: s.weight,
              ...(s.rpe !== undefined ? { rpe: s.rpe } : {})
            }))
          })
        })

        const data = await response.json()

        if (!response.ok) {
          // Rollback optimistic state on failure
          const rolledBackLogs = new Map(exerciseLogs)
          rolledBackLogs.set(exercise.exercise_id, exerciseLog)
          setExerciseLogs(rolledBackLogs)
          skipRestTimer()

          let errorMessage = 'Failed to save exercise'
          if (data.details) {
            if (Array.isArray(data.details)) {
              errorMessage += ':\n' + data.details.map((d: any) => `${d.path}: ${d.message}`).join('\n')
            } else if (typeof data.details === 'string') {
              errorMessage += ': ' + data.details
            }
          } else if (data.error && data.error !== 'Failed to log exercise') {
            errorMessage += ': ' + data.error
          }
          toast({
            title: "Failed to Save Exercise",
            description: errorMessage,
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      // Rollback optimistic state on network error
      const rolledBackLogs = new Map(exerciseLogs)
      rolledBackLogs.set(exercise.exercise_id, exerciseLog)
      setExerciseLogs(rolledBackLogs)
      skipRestTimer()
      console.error('Error logging set:', error)
      toast({
        title: "Error Logging Set",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      })
    }
  }

  const updateSet = (exercise: any, setIndex: number, field: 'reps' | 'weight' | 'rpe', value: number | undefined) => {
    const exerciseLog = exerciseLogs.get(exercise.exercise_id)
    if (!exerciseLog) return

    const updatedSets = [...exerciseLog.sets]
    updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value }

    const newLogs = new Map(exerciseLogs)
    newLogs.set(exercise.exercise_id, { ...exerciseLog, sets: updatedSets })
    setExerciseLogs(newLogs)
  }

  const goToNextExercise = () => {
    // Validate all exercises in the current group
    const allIssues: string[] = []
    let hasAnyCompleted = false
    let hasAnySkipped = false

    for (const exercise of currentGroup) {
      const exerciseLog = exerciseLogs.get(exercise.exercise_id)

      if (!exerciseLog) {
        hasAnySkipped = true
        continue
      }

      const completedSets = exerciseLog.sets.filter(s => s.completed)

      if (completedSets.length === 0) {
        hasAnySkipped = true
        continue
      }

      hasAnyCompleted = true

      // Check for missing weight in completed sets (RPE is optional)
      const missingWeight: number[] = []

      completedSets.forEach((set, index) => {
        const actualSetNumber = exerciseLog.sets.findIndex(s => s === set) + 1

        // Check for missing or zero weight
        if (set.weight === 0 || set.weight === undefined || set.weight === null) {
          missingWeight.push(actualSetNumber)
        }
      })

      if (missingWeight.length > 0) {
        allIssues.push(`${exercise.exercise?.name}: Weight not logged for set${missingWeight.length > 1 ? 's' : ''}: ${missingWeight.join(', ')}`)
      }
    }

    // If no exercises were completed, show skip confirmation
    if (!hasAnyCompleted) {
      setShowSkipExerciseConfirmation(true)
      return
    }

    // If there are validation issues, block advancement
    if (allIssues.length > 0) {
      toast({
        title: "⚠️ Missing Information",
        description: `${allIssues.join('\n')}\n\nPlease complete all exercises in this ${isSuperset ? 'superset' : 'group'} before advancing.`,
        variant: "destructive",
        duration: 6000
      })
      return
    }

    // All validation passed, advance to next group
    proceedToNextExercise()
  }

  const proceedToNextExercise = () => {
    if (currentGroupIndex < exerciseGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1)
    }
  }

  const goToPreviousExercise = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1)
    }
  }

  const completeWorkout = async () => {
    if (!workoutLogId) {
      console.error('Cannot complete workout: workoutLogId is null')
      toast({
        title: "Error",
        description: "No workout session found. Please start a new workout.",
        variant: "destructive"
      })
      return
    }

    if (isCompletingRef.current) return
    isCompletingRef.current = true

    try {
      setIsCompleting(true)
      setIsTimerRunning(false)
      skipRestTimer()

      const response = await fetch('/api/workouts/logs/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          workoutLogId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Failed to Complete Workout",
          description: `${data.error || 'Unknown error'}${data.details ? '\n' + JSON.stringify(data.details) : ''}`,
          variant: "destructive"
        })
        return
      }

      if (data.success) {
        setCompletionSummary(data.summary)
        setShowCompletionSummary(true)
      } else {
        toast({
          title: "Failed to Complete Workout",
          description: "Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error completing workout:', error)
      toast({
        title: "Error Completing Workout",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      })
    } finally {
      setIsCompleting(false)
      isCompletingRef.current = false
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatWeightDisplay = (weightLbs: number) => {
    if (useMetric) return `${(weightLbs / 2.20462).toFixed(1)}kg`
    return `${Math.round(weightLbs)}lbs`
  }

  const weightUnit = useMetric ? 'kg' : 'lbs'

  const getProgressPercentage = () => {
    const totalGroups = exerciseGroups.length
    const completedGroups = exerciseGroups.slice(0, currentGroupIndex).length
    return totalGroups > 0 ? (completedGroups / totalGroups) * 100 : 0
  }

  // Helper function to get superset label (A1, A2, B1, B2, etc.)
  const getSupersetLabel = (groupIndex: number, exerciseIndexInGroup: number) => {
    const letter = String.fromCharCode(65 + groupIndex) // A, B, C, etc.
    return `${letter}${exerciseIndexInGroup + 1}`
  }

  // Show completion summary
  if (showCompletionSummary && completionSummary) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-[#101938] via-[#1D295B]/20 to-[#101938] z-50 overflow-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-[#1D295B]/90 via-[#1D295B]/80 to-[#101938]/90 backdrop-blur-xl border-2 border-[#FADF4A]/30 p-8 rounded-3xl shadow-2xl max-w-md w-full">
            {/* Accent gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FADF4A]/10 via-transparent to-[#F676CD]/10 pointer-events-none" />

            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-[#FADF4A] rounded-full blur-xl opacity-50 animate-pulse" />
                  <div className="relative w-24 h-24 bg-gradient-to-br from-[#FADF4A] to-[#F9C74F] rounded-full flex items-center justify-center shadow-2xl shadow-[#FADF4A]/50">
                    <Trophy className="w-12 h-12 text-[#101938]" />
                  </div>
                </div>
                <h2 className="text-4xl font-bold text-white mb-2">Workout Complete!</h2>
                <p className="text-[#8FD1FF] text-lg">🎉 Great work today</p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="bg-gradient-to-r from-[#101938]/80 to-[#1D295B]/60 backdrop-blur-sm border border-[#8FD1FF]/20 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8FD1FF] text-base font-semibold flex items-center gap-2">
                      <Timer className="w-5 h-5" />
                      Duration
                    </span>
                    <span className="text-white font-bold text-2xl">{completionSummary.duration} min</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-[#FADF4A]/20 to-[#FADF4A]/5 backdrop-blur-sm border border-[#FADF4A]/30 rounded-2xl p-5 text-center">
                    <div className="text-3xl font-bold text-[#FADF4A] mb-1">{completionSummary.totalExercises}</div>
                    <div className="text-white/80 text-sm font-semibold">Exercises</div>
                  </div>
                  <div className="bg-gradient-to-br from-[#F676CD]/20 to-[#F676CD]/5 backdrop-blur-sm border border-[#F676CD]/30 rounded-2xl p-5 text-center">
                    <div className="text-3xl font-bold text-[#F676CD] mb-1">{completionSummary.totalSets}</div>
                    <div className="text-white/80 text-sm font-semibold">Sets</div>
                  </div>
                </div>

                {completionSummary.totalVolume > 0 && (
                  <div className="bg-gradient-to-r from-[#8FD1FF]/20 to-[#8FD1FF]/5 backdrop-blur-sm border border-[#8FD1FF]/30 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8FD1FF] text-base font-semibold flex items-center gap-2">
                        <Dumbbell className="w-5 h-5" />
                        Total Volume
                      </span>
                      <span className="text-white font-bold text-xl">{formatWeightDisplay(completionSummary.totalVolume)}</span>
                    </div>
                  </div>
                )}

                {completionSummary.avgRPE && (
                  <div className="bg-gradient-to-r from-[#F676CD]/20 to-[#F676CD]/5 backdrop-blur-sm border border-[#F676CD]/30 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#F676CD] text-base font-semibold">Avg RPE</span>
                      <span className="text-white font-bold text-xl">{completionSummary.avgRPE.toFixed(1)}/10</span>
                    </div>
                  </div>
                )}
              </div>

              <Button
                className="w-full h-16 bg-gradient-to-r from-[#FADF4A] to-[#F9C74F] hover:from-[#F9C74F] hover:to-[#FADF4A] text-[#101938] rounded-2xl font-bold text-lg shadow-2xl shadow-[#FADF4A]/40 transition-all duration-300 transform active:scale-95"
                onClick={() => {
                  setShowCompletionSummary(false)
                  invalidateFitnessCache()
                  onComplete()
                }}
              >
                Back to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Main workout session UI
  return (
    <div className="fixed inset-0 bg-[#101938] z-[60] overflow-auto">
      <div className="min-h-full pb-40">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-[#101938] via-[#101938]/98 to-[#101938]/95 backdrop-blur-xl border-b border-[#8FD1FF]/20 shadow-lg shadow-[#101938]/50">
          <div className="px-4 py-5">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExitConfirmation(true)}
                className="text-white/80 hover:text-white hover:bg-[#1D295B]/60 rounded-xl h-10 w-10 p-0 transition-all"
              >
                <X className="w-5 h-5" />
              </Button>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FADF4A]/20 to-[#F9C74F]/20 border border-[#FADF4A]/30 rounded-xl">
                  <Timer className="w-5 h-5 text-[#FADF4A]" />
                  <span className="font-mono font-bold text-lg text-[#FADF4A]">{formatTime(elapsedSeconds)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="text-white/80 hover:text-white hover:bg-[#1D295B]/60 rounded-xl h-10 w-10 p-0 transition-all"
                >
                  {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <h1 className="text-2xl font-bold text-white mb-2 leading-tight">{workout.workout_name}</h1>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#8FD1FF]/20 border border-[#8FD1FF]/40 rounded-full text-[#8FD1FF] text-sm font-semibold">
                  {isSuperset ? `Superset ${currentGroupIndex + 1}` : `Exercise ${currentGroupIndex + 1}`} of {exerciseGroups.length}
                </span>
                {isSuperset && (
                  <span className="px-3 py-1 bg-[#F676CD]/20 border border-[#F676CD]/40 rounded-full text-[#F676CD] text-sm font-semibold">
                    {currentGroup.length} exercises
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative">
              <div className="w-full h-3 bg-[#1D295B]/50 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[#8FD1FF] via-[#FADF4A] to-[#F676CD] rounded-full transition-all duration-500 shadow-lg shadow-[#FADF4A]/30"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <div className="absolute -top-1 right-0 text-xs font-bold text-white/60">
                {Math.round(getProgressPercentage())}%
              </div>
            </div>
          </div>
        </div>

        {/* Rest Timer Banner */}
        {restSecondsLeft !== null && restSecondsLeft > 0 && (
          <div className="sticky top-[120px] z-20 mx-4 mt-3">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#1D295B] to-[#101938] border border-[#8FD1FF]/40 rounded-2xl shadow-xl shadow-[#8FD1FF]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#8FD1FF]/20 flex items-center justify-center">
                  <Timer className="w-5 h-5 text-[#8FD1FF]" />
                </div>
                <div>
                  <p className="text-xs text-[#8FD1FF]/70 font-medium uppercase tracking-wide">Rest Timer</p>
                  <p className="text-2xl font-bold text-[#8FD1FF] font-mono leading-none">{formatRestTime(restSecondsLeft)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Progress ring */}
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(143,209,255,0.15)" strokeWidth="4" />
                    <circle
                      cx="24" cy="24" r="20" fill="none"
                      stroke="#8FD1FF" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (restSecondsLeft / (currentGroup[0]?.rest_seconds || restSecondsLeft))}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                </div>
                <button
                  onClick={skipRestTimer}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#8FD1FF]/10 hover:bg-[#8FD1FF]/20 border border-[#8FD1FF]/30 rounded-xl text-[#8FD1FF] text-sm font-semibold transition-all"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current Exercise Group (Superset or Solo) */}
        {currentGroup.length > 0 && (
          <div className="px-4 py-6 pb-28">
            {isSuperset && (
              <div className="mb-6 p-4 bg-gradient-to-r from-[#F676CD]/20 via-[#F676CD]/10 to-transparent border-l-4 border-[#F676CD] rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="px-4 py-1.5 bg-gradient-to-r from-[#F676CD] to-[#E55AAD] rounded-full shadow-lg shadow-[#F676CD]/30">
                    <span className="text-white font-bold text-sm tracking-wide">SUPERSET {String.fromCharCode(65 + currentGroupIndex)}</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#F676CD]/50 to-transparent" />
                </div>
                <p className="text-[#8FD1FF]/90 text-sm leading-relaxed">
                  💪 Complete all sets of each exercise with minimal rest between exercises
                </p>
              </div>
            )}

            {/* Render all exercises in the group */}
            {currentGroup.map((exercise: any, exerciseIndexInGroup: number) => {
              const exerciseLabel = isSuperset ? getSupersetLabel(currentGroupIndex, exerciseIndexInGroup) : null

              return (
                <Card
                  key={exercise.id}
                  className={`relative overflow-hidden bg-gradient-to-br from-[#1D295B]/80 via-[#1D295B]/60 to-[#101938]/40 backdrop-blur-xl border-2 border-[#8FD1FF]/30 p-6 rounded-3xl shadow-2xl ${exerciseIndexInGroup > 0 ? 'mt-4' : 'mb-6'}`}
                >
                  {/* Accent gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#8FD1FF]/5 via-transparent to-[#F676CD]/5 pointer-events-none" />

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#8FD1FF] to-[#6BB8E8] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#8FD1FF]/30">
                        {exerciseLabel ? (
                          <span className="text-[#101938] font-bold text-xl">{exerciseLabel}</span>
                        ) : (
                          <Dumbbell className="w-8 h-8 text-[#101938]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{exercise.exercise?.name}</h2>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 bg-[#FADF4A]/20 border border-[#FADF4A]/40 rounded-full text-[#FADF4A] text-xs font-semibold">
                            {exercise.target_sets} sets
                          </span>
                          <span className="px-3 py-1 bg-[#F676CD]/20 border border-[#F676CD]/40 rounded-full text-[#F676CD] text-xs font-semibold">
                            {exercise.target_reps_min}
                            {exercise.target_reps_max && exercise.target_reps_max !== exercise.target_reps_min
                              ? `-${exercise.target_reps_max}`
                              : ''} reps
                          </span>
                          {exercise.rest_seconds && (
                            <span className="px-3 py-1 bg-[#8FD1FF]/20 border border-[#8FD1FF]/40 rounded-full text-[#8FD1FF] text-xs font-semibold">
                              {exercise.rest_seconds}s rest
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {exercise.exercise?.instructions && (
                      <div className="mb-5 p-4 bg-[#101938]/50 backdrop-blur-sm border border-[#8FD1FF]/20 rounded-xl">
                        <p className="text-[#8FD1FF]/90 text-sm leading-relaxed">{exercise.exercise.instructions}</p>
                      </div>
                    )}

                  {/* Sets Logging */}
                  {(exercise.exercise?.exercise_type === 'strength' || !exercise.exercise?.exercise_type) && (
                    <div className="space-y-4">
                      {exerciseLogs.get(exercise.exercise_id)?.sets.map((set, index) => (
                        <div
                          key={index}
                          className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                            set.completed
                              ? 'bg-gradient-to-br from-green-500/25 to-green-600/10 border-green-500/50 shadow-lg shadow-green-500/20'
                              : 'bg-gradient-to-br from-[#1D295B]/60 to-[#101938]/40 border-[#8FD1FF]/20 hover:border-[#8FD1FF]/40'
                          }`}
                        >
                          {/* Set Number Badge */}
                          <div className="flex items-center justify-between p-4 pb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                                set.completed
                                  ? 'bg-green-500/30 text-green-300'
                                  : 'bg-[#FADF4A]/20 text-[#FADF4A]'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <span className={`font-bold text-base ${set.completed ? 'text-green-300' : 'text-white'}`}>
                                  Set {index + 1}
                                </span>
                                {set.completed && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                    <span className="text-green-400 text-xs font-medium">Completed</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {set.completed && (
                              <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                                <span className="text-green-400 text-xs font-bold">✓ DONE</span>
                              </div>
                            )}
                          </div>

                          {/* Input Grid */}
                          <div className="px-4 pb-4">
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              {/* Reps Input */}
                              <div>
                                <label className="text-[#8FD1FF] text-xs font-semibold mb-2 block uppercase tracking-wide">Reps</label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    value={set.reps}
                                    onChange={(e) => updateSet(exercise, index, 'reps', Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                    className={`h-14 text-center text-xl font-bold border-2 rounded-xl transition-all ${
                                      set.completed
                                        ? 'bg-[#101938]/50 border-green-500/50 text-green-300 focus:border-green-400 focus:ring-2 focus:ring-green-400/20'
                                        : 'bg-[#101938]/80 border-[#8FD1FF]/30 text-white hover:border-[#8FD1FF]/50 focus:border-[#8FD1FF] focus:ring-2 focus:ring-[#8FD1FF]/20'
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* Weight Input */}
                              <div>
                                <label className="text-[#F676CD] text-xs font-semibold mb-2 block uppercase tracking-wide">Weight</label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    value={set.weight}
                                    onChange={(e) => updateSet(exercise, index, 'weight', Math.max(0, parseFloat(e.target.value) || 0))}
                                    min="0"
                                    step={useMetric ? '2.5' : '5'}
                                    className={`h-10 text-center text-base font-bold border-2 rounded-xl transition-all pr-8 ${
                                      set.completed
                                        ? 'bg-[#101938]/50 border-green-500/50 text-green-300 focus:border-green-400 focus:ring-2 focus:ring-green-400/20'
                                        : 'bg-[#101938]/80 border-[#F676CD]/30 text-white hover:border-[#F676CD]/50 focus:border-[#F676CD] focus:ring-2 focus:ring-[#F676CD]/20'
                                    }`}
                                  />
                                  <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold ${
                                    set.completed ? 'text-green-400/60' : 'text-[#F676CD]/60'
                                  }`}>
                                    {weightUnit}
                                  </span>
                                </div>
                              </div>

                              {/* RPE Input */}
                              <div>
                                <label className="text-[#FADF4A] text-xs font-semibold mb-2 block uppercase tracking-wide">RPE</label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    value={set.rpe ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? undefined : parseInt(e.target.value)
                                      if (val === undefined || (val >= 1 && val <= 10)) {
                                        updateSet(exercise, index, 'rpe', val)
                                      }
                                    }}
                                    placeholder="1-10"
                                    min="1"
                                    max="10"
                                    className={`h-14 text-center text-xl font-bold border-2 rounded-xl transition-all ${
                                      set.completed
                                        ? 'bg-[#101938]/50 border-green-500/50 text-green-300 focus:border-green-400 focus:ring-2 focus:ring-green-400/20'
                                        : 'bg-[#101938]/80 border-[#FADF4A]/30 text-white hover:border-[#FADF4A]/50 focus:border-[#FADF4A] focus:ring-2 focus:ring-[#FADF4A]/20'
                                    }`}
                                  />
                                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${
                                    set.completed ? 'text-green-400/60' : 'text-[#FADF4A]/60'
                                  }`}>
                                    /10
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Complete Set Button */}
                            {!set.completed && (
                              <Button
                                onClick={() => logExerciseSet(exercise, index)}
                                className="w-full h-14 bg-gradient-to-r from-[#FADF4A] to-[#F9C74F] hover:from-[#F9C74F] hover:to-[#FADF4A] text-[#101938] rounded-xl font-bold text-base shadow-lg shadow-[#FADF4A]/30 transition-all duration-300 transform active:scale-95"
                              >
                                <Check className="w-5 h-5 mr-2" />
                                Complete Set {index + 1}
                              </Button>
                            )}

                            {/* Completed Set Stats */}
                            {set.completed && (
                              <div className="grid grid-cols-3 gap-2 mt-2">
                                <div className="bg-green-500/10 rounded-lg p-2 text-center">
                                  <div className="text-green-400 text-xs font-medium">Reps</div>
                                  <div className="text-green-300 font-bold">{set.reps}</div>
                                </div>
                                <div className="bg-green-500/10 rounded-lg p-2 text-center">
                                  <div className="text-green-400 text-xs font-medium">Weight</div>
                                  <div className="text-green-300 font-bold">{formatWeightDisplay(set.weight)}</div>
                                </div>
                                <div className="bg-green-500/10 rounded-lg p-2 text-center">
                                  <div className="text-green-400 text-xs font-medium">RPE</div>
                                  <div className="text-green-300 font-bold">{set.rpe || '-'}/10</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Accent Line for Active Set */}
                          {!set.completed && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8FD1FF] via-[#FADF4A] to-[#F676CD]" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Navigation - Fixed bottom bar */}
        {currentGroup.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-gradient-to-t from-[#101938] via-[#101938]/98 to-[#101938]/95 backdrop-blur-xl border-t border-[#8FD1FF]/20 shadow-2xl">
            <div className="px-4 py-4">
              <div className="flex gap-3">
                <Button
                  onClick={goToPreviousExercise}
                  disabled={currentGroupIndex === 0}
                  variant="outline"
                  className="flex-1 h-14 bg-[#1D295B]/50 border-2 border-[#8FD1FF]/30 text-white hover:bg-[#1D295B] hover:border-[#8FD1FF]/50 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-semibold text-base transition-all"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Previous
                </Button>

                {currentGroupIndex < exerciseGroups.length - 1 ? (
                  <Button
                    onClick={goToNextExercise}
                    className="flex-1 h-14 bg-gradient-to-r from-[#8FD1FF] to-[#6BB8E8] hover:from-[#6BB8E8] hover:to-[#8FD1FF] text-[#101938] font-bold text-base rounded-xl shadow-lg shadow-[#8FD1FF]/30 transition-all duration-300 transform active:scale-95"
                  >
                    {isSuperset ? 'Next Superset' : 'Next Exercise'}
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={completeWorkout}
                    disabled={isCompleting}
                    className="flex-1 h-14 bg-gradient-to-r from-[#FADF4A] to-[#F9C74F] hover:from-[#F9C74F] hover:to-[#FADF4A] text-[#101938] font-bold text-base rounded-xl shadow-lg shadow-[#FADF4A]/30 transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCompleting ? (
                      <>
                        <div className="w-5 h-5 mr-2 border-2 border-[#101938]/30 border-t-[#101938] rounded-full animate-spin" />
                        Finishing...
                      </>
                    ) : (
                      <>
                        Finish Workout
                        <Trophy className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitConfirmation} onOpenChange={setShowExitConfirmation}>
        <AlertDialogContent className="bg-[#101938] border-[#1D295B]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Exit Workout?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to exit this workout? Your progress has been saved and you can resume later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#1D295B]/50 border-[#1D295B] text-white hover:bg-[#1D295B]">
              Stay in Workout
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowExitConfirmation(false)
                onCancel()
              }}
              className="bg-[#8FD1FF] hover:bg-[#8FD1FF]/90 text-[#101938] font-bold"
            >
              Exit Workout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Skip Exercise Confirmation Dialog */}
      <AlertDialog open={showSkipExerciseConfirmation} onOpenChange={setShowSkipExerciseConfirmation}>
        <AlertDialogContent className="bg-[#101938] border-[#1D295B]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Skip Exercise Without Logging?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              You haven't completed any sets for this exercise. Are you sure you want to continue to the next exercise without logging any data?
              <br /><br />
              <span className="text-yellow-400 font-semibold">Note:</span> No data will be saved for this exercise if you skip it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#1D295B]/50 border-[#1D295B] text-white hover:bg-[#1D295B]">
              Go Back and Log Sets
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowSkipExerciseConfirmation(false)
                proceedToNextExercise()
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-[#101938] font-bold"
            >
              Skip Exercise
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
