"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Dumbbell, Clock, Target, TrendingUp, Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ExerciseLog {
  id: string
  exercise_library_id: string
  exercise_name: string
  exercise_type: string
  sets_completed: number
  reps_per_set: number[]
  weight_per_set: number[]
  rpe_per_set?: number[]
  avg_rpe?: number
  total_volume_lbs: number
  max_weight_lbs?: number
  duration_seconds?: number
  distance_miles?: number
  calories_burned?: number
  avg_heart_rate?: number
  form_quality_rating?: number
}

interface WorkoutLog {
  id: string
  workout_name: string
  workout_date: string
  actual_duration_minutes: number
  total_volume_lbs: number
  total_sets: number
  exercises_completed: number
  avg_rpe?: number
  notes?: string
}

interface WorkoutDetailModalProps {
  workoutId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WorkoutDetailModal({
  workoutId,
  open,
  onOpenChange,
}: WorkoutDetailModalProps) {
  const [workout, setWorkout] = useState<WorkoutLog | null>(null)
  const [exercises, setExercises] = useState<ExerciseLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (workoutId && open) {
      loadWorkoutDetails()
    }
  }, [workoutId, open])

  const loadWorkoutDetails = async () => {
    if (!workoutId) return

    setLoading(true)
    try {
      const supabase = createClient()

      // Fetch workout log with exercise logs
      const { data: workoutData, error: workoutError } = await supabase
        .from("workout_logs")
        .select(`
          *,
          exercise_logs (
            *,
            exercise_library (
              name,
              exercise_type
            )
          )
        `)
        .eq("id", workoutId)
        .single()

      if (workoutError) throw workoutError

      setWorkout(workoutData)

      // Transform exercise logs
      const exerciseLogs = workoutData.exercise_logs?.map((log: any) => ({
        id: log.id,
        exercise_library_id: log.exercise_library_id,
        exercise_name: log.exercise_library?.name || "Unknown Exercise",
        exercise_type: log.exercise_library?.exercise_type || "general",
        sets_completed: log.sets_completed || 0,
        reps_per_set: log.reps_per_set || [],
        weight_per_set: log.weight_per_set || [],
        rpe_per_set: log.rpe_per_set || [],
        avg_rpe: log.avg_rpe,
        total_volume_lbs: log.total_volume_lbs || 0,
        max_weight_lbs: log.max_weight_lbs,
        duration_seconds: log.duration_seconds,
        distance_miles: log.distance_miles,
        calories_burned: log.calories_burned,
        avg_heart_rate: log.avg_heart_rate,
        form_quality_rating: log.form_quality_rating,
      })) || []

      setExercises(exerciseLogs)
    } catch (error) {
      console.error("Error loading workout details:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatPace = (secondsPerMile?: number) => {
    if (!secondsPerMile) return null
    const mins = Math.floor(secondsPerMile / 60)
    const secs = secondsPerMile % 60
    return `${mins}:${secs.toString().padStart(2, "0")}/mi`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0A1128] border-[#1D295B]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            {workout?.workout_name || "Workout Details"}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {workout?.workout_date
              ? new Date(workout.workout_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : ""}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Workout Summary */}
            {workout && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-[#101938]/80 border-[#1D295B]/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <p className="text-xs text-white/60">Duration</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {workout.actual_duration_minutes} min
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#101938]/80 border-[#1D295B]/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Dumbbell className="h-4 w-4 text-purple-400" />
                      <p className="text-xs text-white/60">Total Volume</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {workout.total_volume_lbs.toLocaleString()} lbs
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#101938]/80 border-[#1D295B]/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-green-400" />
                      <p className="text-xs text-white/60">Total Sets</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {workout.total_sets}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#101938]/80 border-[#1D295B]/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-orange-400" />
                      <p className="text-xs text-white/60">Avg RPE</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {workout.avg_rpe?.toFixed(1) || "N/A"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Exercise Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Exercises</h3>
              {exercises.length === 0 ? (
                <p className="text-white/60 text-center py-8">
                  No exercise data found for this workout
                </p>
              ) : (
                exercises.map((exercise, index) => (
                  <Card
                    key={exercise.id}
                    className="bg-[#101938]/80 border-[#1D295B]/40"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white text-lg">
                            {index + 1}. {exercise.exercise_name}
                          </CardTitle>
                          <div className="flex gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className="bg-blue-500/10 text-blue-400 border-blue-500/30"
                            >
                              {exercise.exercise_type}
                            </Badge>
                            {exercise.form_quality_rating && (
                              <Badge
                                variant="outline"
                                className="bg-green-500/10 text-green-400 border-green-500/30"
                              >
                                Form: {exercise.form_quality_rating}/10
                              </Badge>
                            )}
                          </div>
                        </div>
                        {exercise.avg_rpe && (
                          <Badge
                            variant="outline"
                            className="bg-orange-500/10 text-orange-400 border-orange-500/30"
                          >
                            RPE {exercise.avg_rpe.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Strength Exercise Details */}
                      {exercise.sets_completed > 0 && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-white/60 mb-1">
                                Total Volume
                              </p>
                              <p className="text-lg font-semibold text-white">
                                {exercise.total_volume_lbs.toLocaleString()} lbs
                              </p>
                            </div>
                            {exercise.max_weight_lbs && (
                              <div>
                                <p className="text-xs text-white/60 mb-1">
                                  Max Weight
                                </p>
                                <p className="text-lg font-semibold text-white">
                                  {exercise.max_weight_lbs} lbs
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-medium text-white/80">
                              Sets Details:
                            </p>
                            <div className="space-y-1">
                              {Array.from({
                                length: exercise.sets_completed,
                              }).map((_, setIndex) => (
                                <div
                                  key={setIndex}
                                  className="flex items-center justify-between p-2 bg-[#1D295B]/20 rounded-lg"
                                >
                                  <span className="text-sm text-white/70">
                                    Set {setIndex + 1}
                                  </span>
                                  <div className="flex gap-4 text-sm">
                                    {exercise.reps_per_set[setIndex] !==
                                      undefined && (
                                      <span className="text-white">
                                        {exercise.reps_per_set[setIndex]} reps
                                      </span>
                                    )}
                                    {exercise.weight_per_set[setIndex] !==
                                      undefined && (
                                      <span className="text-white">
                                        @ {exercise.weight_per_set[setIndex]}{" "}
                                        lbs
                                      </span>
                                    )}
                                    {exercise.rpe_per_set &&
                                      exercise.rpe_per_set[setIndex] !==
                                        undefined && (
                                        <span className="text-orange-400">
                                          RPE {exercise.rpe_per_set[setIndex]}
                                        </span>
                                      )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cardio Exercise Details */}
                      {exercise.duration_seconds && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-white/60 mb-1">
                              Duration
                            </p>
                            <p className="text-lg font-semibold text-white">
                              {formatDuration(exercise.duration_seconds)}
                            </p>
                          </div>
                          {exercise.distance_miles && (
                            <div>
                              <p className="text-xs text-white/60 mb-1">
                                Distance
                              </p>
                              <p className="text-lg font-semibold text-white">
                                {exercise.distance_miles.toFixed(2)} mi
                              </p>
                            </div>
                          )}
                          {exercise.calories_burned && (
                            <div>
                              <p className="text-xs text-white/60 mb-1">
                                Calories
                              </p>
                              <p className="text-lg font-semibold text-white">
                                {exercise.calories_burned}
                              </p>
                            </div>
                          )}
                          {exercise.avg_heart_rate && (
                            <div>
                              <p className="text-xs text-white/60 mb-1 flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                Avg HR
                              </p>
                              <p className="text-lg font-semibold text-white">
                                {exercise.avg_heart_rate} bpm
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Notes */}
            {workout?.notes && (
              <Card className="bg-[#101938]/80 border-[#1D295B]/40">
                <CardHeader>
                  <CardTitle className="text-white text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70">{workout.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
