"use client"

import { useState, useEffect } from "react"
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
  const [hasStartedSession, setHasStartedSession] = useState(false)
  const [showExitConfirmation, setShowExitConfirmation] = useState(false)

  const exercises = workout.plan_exercises || []
  const currentExercise = exercises[currentExerciseIndex]

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
    if (user?.id && !hasStartedSession && !workoutLogId) {
      startWorkoutSession()
    }
  }, [user?.id])

  const startWorkoutSession = async () => {
    try {
      setIsStarting(true)
      setHasStartedSession(true)

      console.log('Starting workout with:', {
        userId: user?.id,
        workoutId: workout.id,
        workout: workout
      })

      const response = await fetch('/api/workouts/logs/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          workoutId: workout.id
        })
      })

      const data = await response.json()

      console.log('Workout start response:', {
        status: response.status,
        ok: response.ok,
        data
      })

      if (!response.ok) {
        console.error('Failed to start workout:', data)
        alert(`Failed to start workout: ${data.error || 'Unknown error'}\n${data.details ? JSON.stringify(data.details) : ''}`)
        setHasStartedSession(false) // Allow retry
        return
      }

      if (data.success) {
        setWorkoutLogId(data.workoutLogId)
        setIsTimerRunning(true)

        // Initialize exercise logs
        const logs = new Map<string, ExerciseLog>()
        exercises.forEach((ex: any) => {
          if (ex.exercise?.exercise_type === 'strength' || !ex.exercise?.exercise_type) {
            logs.set(ex.exercise_id, {
              exerciseId: ex.exercise_id,
              sets: Array(ex.target_sets).fill(null).map(() => ({
                reps: ex.target_reps_min || 1, // Default to 1 instead of 0
                weight: ex.target_weight_lbs || 0,
                rpe: undefined,
                completed: false
              }))
            })
          }
        })
        setExerciseLogs(logs)
      }
    } catch (error) {
      console.error('Error starting workout:', error)
      alert(`Error starting workout: ${error}`)
      setHasStartedSession(false) // Allow retry
    } finally {
      setIsStarting(false)
    }
  }

  const logExerciseSet = async (setIndex: number) => {
    if (!workoutLogId || !currentExercise) return

    const exerciseLog = exerciseLogs.get(currentExercise.exercise_id)
    if (!exerciseLog) return

    const set = exerciseLog.sets[setIndex]
    if (!set || set.completed) return

    try {
      // Mark set as completed
      const updatedSets = [...exerciseLog.sets]
      updatedSets[setIndex] = { ...set, completed: true }

      const updatedLog = { ...exerciseLog, sets: updatedSets }
      const newLogs = new Map(exerciseLogs)
      newLogs.set(currentExercise.exercise_id, updatedLog)
      setExerciseLogs(newLogs)

      // Check if all sets are completed
      const allSetsCompleted = updatedSets.every(s => s.completed)

      // If all sets completed, log to backend
      if (allSetsCompleted) {
        console.log('Logging completed exercise:', {
          userId: user?.id,
          workoutLogId,
          exerciseId: currentExercise.exercise_id,
          sets: updatedSets.length
        })

        const response = await fetch('/api/workouts/logs/exercise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            workoutLogId,
            exerciseId: currentExercise.exercise_id,
            exerciseType: currentExercise.exercise?.exercise_type || 'strength',
            planExerciseId: currentExercise.id,
            sets: updatedSets.map(s => ({
              reps: s.reps,
              weight: s.weight,
              // Only include RPE if it's a valid value (1-10)
              ...(s.rpe && s.rpe >= 1 && s.rpe <= 10 ? { rpe: s.rpe } : {})
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
          alert(errorMessage)
        } else {
          console.log('Exercise logged successfully!')
        }
      }
    } catch (error) {
      console.error('Error logging set:', error)
      alert(`Error logging set: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const updateSet = (setIndex: number, field: 'reps' | 'weight' | 'rpe', value: number) => {
    const exerciseLog = exerciseLogs.get(currentExercise.exercise_id)
    if (!exerciseLog) return

    const updatedSets = [...exerciseLog.sets]
    updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value }

    const newLogs = new Map(exerciseLogs)
    newLogs.set(currentExercise.exercise_id, { ...exerciseLog, sets: updatedSets })
    setExerciseLogs(newLogs)
  }

  const goToNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1)
    }
  }

  const goToPreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1)
    }
  }

  const completeWorkout = async () => {
    if (!workoutLogId) {
      console.error('Cannot complete workout: workoutLogId is null')
      alert('Error: No workout session found. Please start a new workout.')
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
        alert(`Failed to complete workout: ${data.error || 'Unknown error'}\n${data.details ? JSON.stringify(data.details) : ''}`)
        return
      }

      if (data.success) {
        setCompletionSummary(data.summary)
        setShowCompletionSummary(true)
      } else {
        console.error('Workout completion returned success=false:', data)
        alert('Failed to complete workout. Please try again.')
      }
    } catch (error) {
      console.error('Error completing workout:', error)
      alert(`Error completing workout: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
    const totalExercises = exercises.length
    const completedExercises = Array.from(exerciseLogs.values()).filter(log =>
      log.sets.every(s => s.completed)
    ).length
    return totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0
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
              Exercise {currentExerciseIndex + 1} of {exercises.length}
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

        {/* Current Exercise */}
        {currentExercise && (
          <div className="px-4 py-6">
            <Card className="bg-gradient-to-br from-[#8FD1FF]/20 to-[#8FD1FF]/5 backdrop-blur-md border-[#8FD1FF]/30 p-6 rounded-3xl shadow-2xl mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-[#8FD1FF] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-7 h-7 text-[#101938]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">{currentExercise.exercise?.name}</h2>
                  <p className="text-[#8FD1FF]/80 text-sm">
                    {currentExercise.target_sets} sets × {currentExercise.target_reps_min}
                    {currentExercise.target_reps_max && currentExercise.target_reps_max !== currentExercise.target_reps_min
                      ? `-${currentExercise.target_reps_max}`
                      : ''} reps
                  </p>
                </div>
              </div>

              {currentExercise.exercise?.instructions && (
                <div className="mb-4 p-4 bg-[#1D295B]/30 rounded-xl">
                  <p className="text-[#8FD1FF]/90 text-sm">{currentExercise.exercise.instructions}</p>
                </div>
              )}

              {/* Sets Logging */}
              {(currentExercise.exercise?.exercise_type === 'strength' || !currentExercise.exercise?.exercise_type) && (
                <div className="space-y-3">
                  {exerciseLogs.get(currentExercise.exercise_id)?.sets.map((set, index) => (
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
                            onChange={(e) => updateSet(index, 'reps', Math.max(1, parseInt(e.target.value) || 1))}
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
                            onChange={(e) => updateSet(index, 'weight', Math.max(0, parseFloat(e.target.value) || 0))}
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
                            value={set.rpe || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0
                              updateSet(index, 'rpe', val > 0 ? Math.min(10, val) : 0)
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
                          onClick={() => logExerciseSet(index)}
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

            {/* Navigation */}
            <div className="flex gap-3">
              <Button
                onClick={goToPreviousExercise}
                disabled={currentExerciseIndex === 0}
                variant="outline"
                className="flex-1 bg-[#1D295B]/50 border-[#1D295B] text-white hover:bg-[#1D295B] disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </Button>

              {currentExerciseIndex < exercises.length - 1 ? (
                <Button
                  onClick={goToNextExercise}
                  className="flex-1 bg-[#8FD1FF] hover:bg-[#8FD1FF]/90 text-[#101938] font-bold"
                >
                  Next Exercise
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
    </div>
  )
}
