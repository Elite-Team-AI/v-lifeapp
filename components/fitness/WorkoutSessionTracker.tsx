"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2,
  Circle,
  Clock,
  Dumbbell,
  Trophy,
  TrendingUp,
  Play,
  Pause,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  logExerciseSet,
  completeWorkoutSession,
  type WorkoutSession,
  type ExerciseLogInput,
} from "@/lib/actions/personalized-workouts"

interface WorkoutSessionTrackerProps {
  workout: WorkoutSession
  onComplete: () => void
  onExit: () => void
}

interface SetLog {
  setNumber: number
  reps: number
  weight: number
  rpe?: number
  isLogged: boolean
}

export function WorkoutSessionTracker({ workout, onComplete, onExit }: WorkoutSessionTrackerProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set([0]))
  const [setLogs, setSetLogs] = useState<Record<string, SetLog[]>>({})
  const [isLogging, setIsLogging] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Rest timer state
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [isResting, setIsResting] = useState(false)

  const currentExercise = workout.exercises[currentExerciseIndex]

  // Initialize set logs for all exercises
  useEffect(() => {
    const initialLogs: Record<string, SetLog[]> = {}
    workout.exercises.forEach((exercise) => {
      initialLogs[exercise.id] = Array.from({ length: exercise.targetSets }, (_, i) => ({
        setNumber: i + 1,
        reps: exercise.targetRepsMin,
        weight: exercise.lastWeight || 0,
        rpe: exercise.targetRpe,
        isLogged: i < exercise.completedSets,
      }))
    })
    setSetLogs(initialLogs)
  }, [workout])

  // Rest timer countdown
  useEffect(() => {
    if (isResting && restTimer !== null && restTimer > 0) {
      const interval = setInterval(() => {
        setRestTimer((prev) => (prev !== null && prev > 0 ? prev - 1 : null))
      }, 1000)
      return () => clearInterval(interval)
    } else if (restTimer === 0) {
      setIsResting(false)
      setRestTimer(null)
    }
  }, [isResting, restTimer])

  const toggleExercise = (index: number) => {
    setExpandedExercises((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const updateSetValue = (
    exerciseId: string,
    setIndex: number,
    field: "reps" | "weight" | "rpe",
    value: number
  ) => {
    setSetLogs((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((set, i) =>
        i === setIndex ? { ...set, [field]: value } : set
      ),
    }))
  }

  const logSet = async (exerciseId: string, setIndex: number) => {
    const exercise = workout.exercises.find((ex) => ex.id === exerciseId)
    if (!exercise) return

    const setLog = setLogs[exerciseId][setIndex]
    setIsLogging(true)
    setError(null)

    try {
      const input: ExerciseLogInput = {
        planExerciseId: exercise.id,
        workoutId: workout.workoutId,
        exerciseId: exercise.exerciseId,
        setNumber: setLog.setNumber,
        reps: setLog.reps,
        weight: setLog.weight,
        unit: "lbs",
        rpe: setLog.rpe,
      }

      const result = await logExerciseSet(input)

      if (!result.success) {
        setError(result.error || "Failed to log set")
        return
      }

      // Mark set as logged
      setSetLogs((prev) => ({
        ...prev,
        [exerciseId]: prev[exerciseId].map((set, i) =>
          i === setIndex ? { ...set, isLogged: true } : set
        ),
      }))

      // If this was the last set, move to next exercise
      const allSetsLogged = setLogs[exerciseId].every((set, i) => i === setIndex || set.isLogged)
      if (allSetsLogged && currentExerciseIndex < workout.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1)
        setExpandedExercises(new Set([currentExerciseIndex + 1]))
      }

      // Start rest timer
      if (setIndex < exercise.targetSets - 1) {
        setRestTimer(exercise.restSeconds)
        setIsResting(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log set")
    } finally {
      setIsLogging(false)
    }
  }

  const skipRestTimer = () => {
    setIsResting(false)
    setRestTimer(null)
  }

  const handleCompleteWorkout = async () => {
    setIsCompleting(true)
    setError(null)

    try {
      const result = await completeWorkoutSession(workout.workoutId)

      if (!result.success) {
        setError(result.error || "Failed to complete workout")
        return
      }

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete workout")
    } finally {
      setIsCompleting(false)
    }
  }

  const totalExercises = workout.exercises.length
  const completedExercises = workout.exercises.filter((ex) => ex.isCompleted).length
  const overallProgress = Math.round((completedExercises / totalExercises) * 100)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      {/* Workout Header */}
      <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{workout.workoutName}</h2>
              <div className="flex items-center gap-3 mt-2 text-sm text-white/70">
                <div className="flex items-center gap-1">
                  <Dumbbell className="h-4 w-4" />
                  <span>{totalExercises} exercises</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{workout.estimatedDuration} min</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onExit} disabled={isCompleting}>
              Exit
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/70">Progress</span>
              <span className="text-sm font-bold text-accent">{overallProgress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Rest Timer */}
      <AnimatePresence>
        {isResting && restTimer !== null && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-accent border-glow bg-accent/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Rest Timer</p>
                      <p className="text-2xl font-bold text-accent">{formatTime(restTimer)}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={skipRestTimer}
                    className="border-accent/50 text-accent hover:bg-accent/10"
                  >
                    Skip Rest
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercises List */}
      <div className="space-y-3">
        {workout.exercises.map((exercise, index) => {
          const isExpanded = expandedExercises.has(index)
          const isCurrent = index === currentExerciseIndex
          const exerciseSets = setLogs[exercise.id] || []
          const completedSets = exerciseSets.filter((set) => set.isLogged).length

          return (
            <Card
              key={exercise.id}
              className={`transition-all ${
                isCurrent
                  ? "border-accent border-glow bg-accent/5"
                  : exercise.isCompleted
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-white/10 bg-black/30"
              }`}
            >
              <CardHeader
                className="cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleExercise(index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {exercise.isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    ) : (
                      <Circle className="h-5 w-5 text-white/40 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white">{exercise.exerciseName}</h3>
                        {isCurrent && (
                          <Badge variant="outline" className="border-accent text-accent">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-white/60">
                        <span>
                          {completedSets}/{exercise.targetSets} sets
                        </span>
                        <span>•</span>
                        <span>
                          {exercise.targetRepsMin}
                          {exercise.targetRepsMin !== exercise.targetRepsMax &&
                            `-${exercise.targetRepsMax}`}{" "}
                          reps
                        </span>
                        <span>•</span>
                        <span>{exercise.restSeconds}s rest</span>
                      </div>
                      {exercise.personalRecord && (
                        <div className="flex items-center gap-1 mt-2">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="text-xs text-yellow-500">
                            PR: {exercise.personalRecord.weight} lbs × {exercise.personalRecord.reps}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-white/40" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-white/40" />
                  )}
                </div>
              </CardHeader>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="border-t border-white/10 pt-4 space-y-3">
                      {/* Performance Info */}
                      {exercise.lastWeight && exercise.lastReps && (
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-accent" />
                            <span className="text-xs font-medium text-white/70">Last Performance</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-white">
                              {exercise.lastWeight} lbs × {exercise.lastReps} reps
                            </span>
                            {exercise.estimatedOneRepMax && (
                              <>
                                <span className="text-white/40">•</span>
                                <span className="text-white/70">
                                  Est. 1RM: {exercise.estimatedOneRepMax} lbs
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sets */}
                      {exerciseSets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className={`p-3 rounded-lg border ${
                            set.isLogged
                              ? "border-green-500/30 bg-green-500/5"
                              : "border-white/10 bg-black/20"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-white">Set {set.setNumber}</span>
                            {set.isLogged && (
                              <Badge variant="outline" className="border-green-500 text-green-500">
                                <Check className="h-3 w-3 mr-1" />
                                Logged
                              </Badge>
                            )}
                          </div>

                          {!set.isLogged && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-white/70">Weight (lbs)</Label>
                                  <Input
                                    type="number"
                                    value={set.weight}
                                    onChange={(e) =>
                                      updateSetValue(
                                        exercise.id,
                                        setIndex,
                                        "weight",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="text-center"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-white/70">Reps</Label>
                                  <Input
                                    type="number"
                                    value={set.reps}
                                    onChange={(e) =>
                                      updateSetValue(
                                        exercise.id,
                                        setIndex,
                                        "reps",
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="text-center"
                                  />
                                </div>
                              </div>

                              {exercise.targetRpe && (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <Label className="text-xs text-white/70">RPE</Label>
                                    <span className="text-sm font-medium text-accent">{set.rpe || 0}</span>
                                  </div>
                                  <Slider
                                    value={[set.rpe || 0]}
                                    onValueChange={(value) =>
                                      updateSetValue(exercise.id, setIndex, "rpe", value[0])
                                    }
                                    min={1}
                                    max={10}
                                    step={0.5}
                                  />
                                  <div className="flex justify-between text-[10px] text-white/40">
                                    <span>Easy (1)</span>
                                    <span>Max (10)</span>
                                  </div>
                                </div>
                              )}

                              <Button
                                onClick={() => logSet(exercise.id, setIndex)}
                                disabled={isLogging}
                                className="w-full"
                              >
                                {isLogging ? "Logging..." : "Log Set"}
                              </Button>
                            </div>
                          )}

                          {set.isLogged && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/70">
                                {set.weight} lbs × {set.reps} reps
                              </span>
                              {set.rpe && <span className="text-white/50">RPE: {set.rpe}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )
        })}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-500">Error</p>
              <p className="text-sm text-red-400/80">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Workout Button */}
      <ButtonGlow
        variant="accent-glow"
        onClick={handleCompleteWorkout}
        disabled={isCompleting || completedExercises < totalExercises}
        isLoading={isCompleting}
        loadingText="Completing..."
        className="w-full"
        size="lg"
      >
        <CheckCircle2 className="mr-2 h-5 w-5" />
        Complete Workout
      </ButtonGlow>

      {completedExercises < totalExercises && (
        <p className="text-center text-sm text-white/50">
          Complete all exercises to finish your workout
        </p>
      )}
    </div>
  )
}
