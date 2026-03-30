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
  ChevronLeft
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/hooks/use-toast"
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
  const [showExitConfirmation, setShowExitConfirmation] = useState(false)
  const [showSkipExerciseConfirmation, setShowSkipExerciseConfirmation] = useState(false)

  const exercises = workout.plan_exercises || []
  const currentExercise = exercises[currentExerciseIndex]

  // Debug logging
  useEffect(() => {
    console.log('WorkoutSession Debug:', {
      workout,
      hasWorkout: !!workout,
      hasPlanExercises: !!workout.plan_exercises,
      planExercisesLength: workout.plan_exercises?.length || 0,
      exercises,
      exercisesLength: exercises.length,
      currentExerciseIndex,
      currentExercise: currentExercise ? {
        id: currentExercise.id,
        exercise_id: currentExercise.exercise_id,
        exercise_name: currentExercise.exercise?.name
      } : null
    })
  }, [workout, exercises, currentExerciseIndex, currentExercise])

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

      console.log('Starting workout with:', {
        userId: user?.id,
        workoutId: workout.id,
        isQuickWorkout,
        workout: workout
      })

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

      console.log('Workout start response:', {
        status: response.status,
        ok: response.ok,
        data
      })

      if (!response.ok) {
        console.error('Failed to start workout:', data)
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

          toast({
            title: "Workout Resumed",
            description: "Continuing from where you left off"
          })
        } else {
          // New workout - initialize fresh exercise logs
          exercises.forEach((ex: any) => {
            if (ex.exercise?.exercise_type === 'strength' || !ex.exercise?.exercise_type) {
              logs.set(ex.exercise_id, {
                exerciseId: ex.exercise_id,
                sets: Array(ex.target_sets).fill(null).map(() => ({
                  reps: ex.target_reps_min ?? 1, // Use nullish coalescing to allow 0 for isometric holds
                  weight: ex.target_weight_lbs ?? 0,
                  rpe: undefined,
                  completed: false
                }))
              })
            }
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
    if (!set || set.completed) return

    try {
      // Mark set as completed
      const updatedSets = [...exerciseLog.sets]
      updatedSets[setIndex] = { ...set, completed: true }

      const updatedLog = { ...exerciseLog, sets: updatedSets }
      const newLogs = new Map(exerciseLogs)
      newLogs.set(exercise.exercise_id, updatedLog)
      setExerciseLogs(newLogs)

      // Check if all sets are completed
      const allSetsCompleted = updatedSets.every(s => s.completed)

      // If all sets completed, log to backend
      if (allSetsCompleted) {
        console.log('Logging completed exercise:', {
          userId: user?.id,
          workoutLogId,
          exerciseId: exercise.exercise_id,
          sets: updatedSets.length
        })

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
              // Only include RPE if provided (already validated to be 1-10 or undefined)
              ...(s.rpe !== undefined ? { rpe: s.rpe } : {})
            }))
          })
        })

        const data = await response.json()

        console.log('Exercise log response:', {
          status: response.status,
          ok: response.ok,
          data
        })

        if (!response.ok) {
          console.error('Failed to log exercise:', data)
          // Show specific error details
          let errorMessage = 'Failed to save exercise'
          if (data.details) {
            if (Array.isArray(data.details)) {
              // Validation errors
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
        } else {
          console.log('Exercise logged successfully!')
        }
      }
    } catch (error) {
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

      // Check for missing weight/RPE in completed sets
      const missingWeight: number[] = []
      const missingRPE: number[] = []

      completedSets.forEach((set, index) => {
        const actualSetNumber = exerciseLog.sets.findIndex(s => s === set) + 1

        // Check for missing or zero weight
        if (set.weight === 0 || set.weight === undefined || set.weight === null) {
          missingWeight.push(actualSetNumber)
        }

        // Check for missing RPE
        if (set.rpe === undefined || set.rpe === null) {
          missingRPE.push(actualSetNumber)
        }
      })

      if (missingWeight.length > 0) {
        allIssues.push(`${exercise.exercise?.name}: Weight not logged for set${missingWeight.length > 1 ? 's' : ''}: ${missingWeight.join(', ')}`)
      }
      if (missingRPE.length > 0) {
        allIssues.push(`${exercise.exercise?.name}: RPE not logged for set${missingRPE.length > 1 ? 's' : ''}: ${missingRPE.join(', ')}`)
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

    try {
      setIsCompleting(true)
      setIsTimerRunning(false)

      console.log('Completing workout with:', {
        userId: user?.id,
        workoutLogId
      })

      const response = await fetch('/api/workouts/logs/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          workoutLogId
        })
      })

      const data = await response.json()

      console.log('Workout complete response:', {
        status: response.status,
        ok: response.ok,
        data
      })

      if (!response.ok) {
        console.error('Failed to complete workout:', data)
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
        console.error('Workout completion returned success=false:', data)
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
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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
      <div className="fixed inset-0 bg-[#101938] z-50 overflow-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <Card className="bg-gradient-to-br from-[#FADF4A]/20 to-[#FADF4A]/5 backdrop-blur-md border-[#FADF4A]/30 p-8 rounded-3xl shadow-2xl max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-[#FADF4A] rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-[#101938]" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Workout Complete!</h2>
              <p className="text-[#8FD1FF]/80">Great work today</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-[#1D295B]/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#8FD1FF]/80 text-sm">Duration</span>
                  <span className="text-white font-bold text-lg">{completionSummary.duration} min</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1D295B]/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#FADF4A] mb-1">{completionSummary.totalExercises}</div>
                  <div className="text-[#8FD1FF]/80 text-xs">Exercises</div>
                </div>
                <div className="bg-[#1D295B]/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#F676CD] mb-1">{completionSummary.totalSets}</div>
                  <div className="text-[#8FD1FF]/80 text-xs">Sets</div>
                </div>
              </div>

              {completionSummary.totalVolume > 0 && (
                <div className="bg-[#1D295B]/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8FD1FF]/80 text-sm">Total Volume</span>
                    <span className="text-white font-bold">{completionSummary.totalVolume.toLocaleString()} lbs</span>
                  </div>
                </div>
              )}

              {completionSummary.avgRPE && (
                <div className="bg-[#1D295B]/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8FD1FF]/80 text-sm">Avg RPE</span>
                    <span className="text-white font-bold">{completionSummary.avgRPE.toFixed(1)}/10</span>
                  </div>
                </div>
              )}
            </div>

            <Button
              className="w-full bg-[#FADF4A] hover:bg-[#FADF4A]/90 text-[#101938] rounded-xl font-bold py-4 text-lg"
              onClick={() => {
                setShowCompletionSummary(false)
                onComplete()
              }}
            >
              Back to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  // Main workout session UI
  return (
    <div className="fixed inset-0 bg-[#101938] z-50 overflow-auto">
      <div className="min-h-full pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#101938]/95 backdrop-blur-md border-b border-[#1D295B]/40 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExitConfirmation(true)}
              className="text-[#8FD1FF] hover:bg-[#1D295B]/50"
            >
              <X className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-[#FADF4A]">
                <Timer className="w-5 h-5" />
                <span className="font-mono font-bold text-lg">{formatTime(elapsedSeconds)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="text-[#8FD1FF] hover:bg-[#1D295B]/50"
              >
                {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-white mb-1">{workout.workout_name}</h1>
            <p className="text-[#8FD1FF]/80 text-sm">
              {isSuperset ? `Superset ${currentGroupIndex + 1}` : `Exercise ${currentGroupIndex + 1}`} of {exerciseGroups.length}
              {isSuperset && ` • ${currentGroup.length} exercises`}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="w-full h-2 bg-[#1D295B]/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FADF4A] to-[#F676CD] rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Exercise Group (Superset or Solo) */}
        {currentGroup.length > 0 && (
          <div className="px-4 py-6">
            {isSuperset && (
              <div className="mb-4 px-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-3 py-1 bg-[#F676CD]/20 border border-[#F676CD]/40 rounded-full">
                    <span className="text-[#F676CD] font-bold text-sm">SUPERSET {String.fromCharCode(65 + currentGroupIndex)}</span>
                  </div>
                </div>
                <p className="text-[#8FD1FF]/70 text-sm">
                  Complete all sets of each exercise with minimal rest between exercises
                </p>
              </div>
            )}

            {/* Render all exercises in the group */}
            {currentGroup.map((exercise: any, exerciseIndexInGroup: number) => {
              const exerciseLabel = isSuperset ? getSupersetLabel(currentGroupIndex, exerciseIndexInGroup) : null

              return (
                <Card
                  key={exercise.id}
                  className={`bg-gradient-to-br from-[#8FD1FF]/20 to-[#8FD1FF]/5 backdrop-blur-md border-[#8FD1FF]/30 p-6 rounded-3xl shadow-2xl ${exerciseIndexInGroup > 0 ? 'mt-4' : 'mb-6'}`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-[#8FD1FF] rounded-2xl flex items-center justify-center flex-shrink-0">
                      {exerciseLabel ? (
                        <span className="text-[#101938] font-bold text-lg">{exerciseLabel}</span>
                      ) : (
                        <Dumbbell className="w-7 h-7 text-[#101938]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-1">{exercise.exercise?.name}</h2>
                      <p className="text-[#8FD1FF]/80 text-sm">
                        {exercise.target_sets} sets × {exercise.target_reps_min}
                        {exercise.target_reps_max && exercise.target_reps_max !== exercise.target_reps_min
                          ? `-${exercise.target_reps_max}`
                          : ''} reps
                      </p>
                    </div>
                  </div>

                  {exercise.exercise?.instructions && (
                    <div className="mb-4 p-4 bg-[#1D295B]/30 rounded-xl">
                      <p className="text-[#8FD1FF]/90 text-sm">{exercise.exercise.instructions}</p>
                    </div>
                  )}

                  {/* Sets Logging */}
                  {(exercise.exercise?.exercise_type === 'strength' || !exercise.exercise?.exercise_type) && (
                    <div className="space-y-3">
                      {exerciseLogs.get(exercise.exercise_id)?.sets.map((set, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            set.completed
                              ? 'bg-green-500/20 border-green-500/40'
                              : 'bg-[#1D295B]/30 border-[#1D295B]/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-white font-bold">Set {index + 1}</span>
                              {set.completed && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-[#8FD1FF]/70 text-xs mb-1 block">Reps</label>
                              <Input
                                type="number"
                                value={set.reps}
                                onChange={(e) => updateSet(exercise, index, 'reps', Math.max(1, parseInt(e.target.value) || 1))}
                                disabled={set.completed}
                                min="1"
                                className="bg-[#101938]/50 border-[#1D295B] text-white text-center"
                              />
                            </div>
                            <div>
                              <label className="text-[#8FD1FF]/70 text-xs mb-1 block">Weight (lbs)</label>
                              <Input
                                type="number"
                                value={set.weight}
                                onChange={(e) => updateSet(exercise, index, 'weight', Math.max(0, parseFloat(e.target.value) || 0))}
                                disabled={set.completed}
                                min="0"
                                step="0.5"
                                className="bg-[#101938]/50 border-[#1D295B] text-white text-center"
                              />
                            </div>
                            <div>
                              <label className="text-[#8FD1FF]/70 text-xs mb-1 block">RPE</label>
                              <Input
                                type="number"
                                value={set.rpe ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? undefined : parseInt(e.target.value)
                                  if (val === undefined || (val >= 1 && val <= 10)) {
                                    updateSet(exercise, index, 'rpe', val)
                                  }
                                }}
                                disabled={set.completed}
                                placeholder="1-10"
                                min="1"
                                max="10"
                                className="bg-[#101938]/50 border-[#1D295B] text-white text-center"
                              />
                            </div>
                          </div>

                          {!set.completed && (
                            <Button
                              onClick={() => logExerciseSet(exercise, index)}
                              className="w-full mt-3 bg-[#FADF4A] hover:bg-[#FADF4A]/90 text-[#101938] rounded-lg font-bold"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Complete Set
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Navigation - Outside exercise rendering but inside workout session */}
        {currentGroup.length > 0 && (
          <div className="px-4 pb-6"

            <div className="flex gap-3">
              <Button
                onClick={goToPreviousExercise}
                disabled={currentGroupIndex === 0}
                variant="outline"
                className="flex-1 bg-[#1D295B]/50 border-[#1D295B] text-white hover:bg-[#1D295B] disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </Button>

              {currentGroupIndex < exerciseGroups.length - 1 ? (
                <Button
                  onClick={goToNextExercise}
                  className="flex-1 bg-[#8FD1FF] hover:bg-[#8FD1FF]/90 text-[#101938] font-bold"
                >
                  {isSuperset ? 'Next Superset' : 'Next Exercise'}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={completeWorkout}
                  disabled={isCompleting}
                  className="flex-1 bg-[#FADF4A] hover:bg-[#FADF4A]/90 text-[#101938] font-bold"
                >
                  {isCompleting ? 'Finishing...' : 'Finish Workout'}
                  <Trophy className="w-5 h-5 ml-2" />
                </Button>
              )}
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
