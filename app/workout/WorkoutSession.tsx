"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { CelebrationModal } from "@/components/confetti-celebration"
import { ExerciseDemoModal } from "@/components/exercise-demo-modal"
import type { ActiveWorkoutPayload } from "@/lib/actions/workouts"
import { ArrowLeft, CheckCircle, ListOrdered, Repeat, Sparkles, Clock, Target, Trophy, HelpCircle, Play } from "lucide-react"

interface WorkoutSessionProps {
  initialWorkout: ActiveWorkoutPayload | null
}

export default function WorkoutSession({ initialWorkout }: WorkoutSessionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [workout, setWorkout] = useState(initialWorkout)
  const [inputs, setInputs] = useState<Record<string, { weight: string; reps: string }>>({})
  const [pendingExercise, setPendingExercise] = useState<string | null>(null)
  const [completingWorkout, setCompletingWorkout] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState(false)
  const [demoExerciseName, setDemoExerciseName] = useState<string | null>(null)

  // Initialize inputs with last used weight/reps from history
  useEffect(() => {
    if (workout?.exercises) {
      const initialInputs: Record<string, { weight: string; reps: string }> = {}
      workout.exercises.forEach((exercise) => {
        if (exercise.lastWeight != null || exercise.lastReps != null) {
          initialInputs[exercise.exerciseId] = {
            weight: exercise.lastWeight != null ? String(exercise.lastWeight) : "",
            reps: exercise.lastReps != null ? String(exercise.lastReps) : "",
          }
        }
      })
      if (Object.keys(initialInputs).length > 0) {
        setInputs(initialInputs)
      }
    }
  }, [workout])

  if (!workout) {
    return (
      <div className="min-h-screen bg-black pb-nav-safe flex flex-col items-center justify-center gap-4 px-4 overflow-hidden">
        {/* Animated gradient background */}
        <div className="fixed inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px] animate-blob" />
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-blob animation-delay-4000" />
        </div>

        {/* Grid pattern overlay */}
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

        <motion.div
          className="relative z-10 text-center backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.p
            className="text-white/70 text-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            No workout scheduled for today.
          </motion.p>
          <motion.p
            className="text-white/50 text-sm mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Visit the Fitness tab to generate your AI workout.
          </motion.p>
        </motion.div>
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
            <ButtonGlow variant="accent-glow" onClick={() => router.push("/fitness")} className="relative">
              Go to Fitness
            </ButtonGlow>
          </div>
        </motion.div>
      </div>
    )
  }

  const handleInputChange = (exerciseId: string, field: "weight" | "reps", value: string) => {
    setInputs((prev) => ({
      ...prev,
      [exerciseId]: {
        weight: field === "weight" ? value : prev[exerciseId]?.weight || "",
        reps: field === "reps" ? value : prev[exerciseId]?.reps || "",
      },
    }))
  }

  const handleLogSet = async (exerciseId: string, workoutExerciseId: string, totalSets: number, completedSets: number) => {
    const payload = inputs[exerciseId]
    const weightValue = Number.parseFloat(payload?.weight || "0")
    const repsValue = Number.parseInt(payload?.reps || "0", 10)

    if (!weightValue || !repsValue) {
      toast({
        title: "Enter set details",
        description: "Provide weight and reps before completing a set.",
        variant: "destructive",
      })
      return
    }

    setPendingExercise(workoutExerciseId)
    const { logExerciseSet } = await import("@/lib/actions/workouts")
    const result = await logExerciseSet({
      workoutExerciseId,
      workoutId: workout.workoutId,
      exerciseId,
      setNumber: completedSets + 1,
      totalSets,
      weight: weightValue,
      reps: repsValue,
      unit: "lbs",
    })
    setPendingExercise(null)

    if (!result.success) {
      toast({
        title: "Unable to log set",
        description: result.error || "Please try again.",
        variant: "destructive",
      })
      return
    }

    // Update local state to reflect the logged set
    setWorkout((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.workoutExerciseId === workoutExerciseId) {
            const newCompletedSets = completedSets + 1
            return {
              ...ex,
              completedSets: newCompletedSets,
              completed: newCompletedSets >= totalSets,
            }
          }
          return ex
        }),
      }
    })

    toast({
      title: `Set ${completedSets + 1}/${totalSets} logged`,
      description: result.completed ? "Exercise completed! 🎉" : "Keep it up!",
    })
    
    // Clear inputs for this exercise after logging
    setInputs((prev) => ({
      ...prev,
      [exerciseId]: { weight: prev[exerciseId]?.weight || "", reps: "" },
    }))
  }

  const handleCompleteWorkout = async () => {
    setCompletingWorkout(true)
    const { completeWorkout } = await import("@/lib/actions/workouts")
    const result = await completeWorkout(workout.workoutId)
    setCompletingWorkout(false)
    
    if (!result.success) {
      toast({
        title: "Unable to complete workout",
        description: result.error || "Please try again.",
        variant: "destructive",
      })
      return
    }

    // Show celebration modal with confetti!
    setIsWorkoutCompleted(true)
    setShowCelebration(true)
  }

  const handleCelebrationClose = () => {
    setShowCelebration(false)
    router.push("/fitness?completed=true")
  }

  return (
    <div className="min-h-screen bg-black pb-nav-safe overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px] animate-blob" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

      <div className="relative z-10 container max-w-md px-4 py-6 space-y-6">
        <motion.div
          className="flex items-center mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ButtonGlow
              variant="outline-glow"
              size="icon"
              onClick={() => router.back()}
              className="mr-4 h-10 w-10 backdrop-blur-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </ButtonGlow>
          </motion.div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
              {workout.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/70 capitalize">{workout.workoutType}</span>
              {workout.dayEmphasis && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="text-accent text-sm drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">{workout.dayEmphasis}</span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* AI Badge & Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <Card className="border-accent/30 backdrop-blur-xl bg-gradient-to-br from-accent/10 to-transparent shadow-[0_0_20px_rgba(255,215,0,0.15)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  <Sparkles className="h-4 w-4 text-accent drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                </motion.div>
                <span className="text-sm text-accent font-medium">AI-Generated Workout</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="flex items-center gap-1.5 text-white/70"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {workout.mode === "rounds" ? (
                      <Repeat className="h-4 w-4" />
                    ) : (
                      <ListOrdered className="h-4 w-4" />
                    )}
                    <span className="text-sm capitalize">{workout.mode}</span>
                  </motion.div>
                  {workout.durationMinutes && (
                    <motion.div
                      className="flex items-center gap-1.5 text-white/70"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 }}
                    >
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{workout.durationMinutes} min</span>
                    </motion.div>
                  )}
                  <motion.div
                    className="flex items-center gap-1.5 text-white/70"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Target className="h-4 w-4" />
                    <span className="text-sm">{workout.exercises.length} exercises</span>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Conditioning Notes */}
        {workout.conditioningNotes && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className="border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_20px_rgba(255,215,0,0.1)]">
              <CardContent className="p-4">
                <p className="text-sm text-accent font-semibold mb-2 drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">Conditioning Finisher</p>
                <p className="text-sm text-white/80">{workout.conditioningNotes}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="space-y-4">
          {workout.exercises.map((exercise, index) => (
            <motion.div
              key={exercise.workoutExerciseId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <Card className={`border backdrop-blur-xl shadow-[0_0_20px_rgba(255,215,0,0.1)] transition-all ${
                exercise.completed
                  ? "border-accent/30 bg-accent/10"
                  : "border-white/10 bg-white/5"
              }`}>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <motion.p
                        className="text-sm text-accent capitalize drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + index * 0.05 }}
                      >
                        {exercise.category || "Strength"}
                      </motion.p>
                      <motion.h3
                        className="text-white font-bold flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                      >
                        {exercise.name}
                        <Link
                          href={`/vbot?prompt=${encodeURIComponent(`How do I properly do a ${exercise.name}? Explain the correct form, key cues to focus on, and common mistakes to avoid.`)}`}
                          className="text-white/40 hover:text-accent transition-colors"
                          title={`Ask VBot about ${exercise.name}`}
                        >
                          <HelpCircle className="h-4 w-4" />
                        </Link>
                      </motion.h3>
                      {exercise.lastWeight != null && exercise.lastReps != null && (
                        <motion.p
                          className="text-xs text-white/50 mt-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.45 + index * 0.05 }}
                        >
                          Last: {exercise.lastWeight}lbs × {exercise.lastReps} reps
                        </motion.p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => setDemoExerciseName(exercise.name)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-xl bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent text-xs font-medium transition-all shadow-[0_0_10px_rgba(255,215,0,0.2)]"
                        title={`View demo for ${exercise.name}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="h-3.5 w-3.5" />
                        Demo
                      </motion.button>
                      <span className="text-sm text-white/70">
                        {exercise.completedSets}/{exercise.sets} sets
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Weight"
                      value={inputs[exercise.exerciseId]?.weight || ""}
                      onChange={(e) => handleInputChange(exercise.exerciseId, "weight", e.target.value)}
                      className="backdrop-blur-xl bg-white/5 border-white/10 text-white focus:border-accent/50 focus:bg-white/10 transition-all"
                    />
                    <Input
                      type="number"
                      placeholder="Reps"
                      value={inputs[exercise.exerciseId]?.reps || ""}
                      onChange={(e) => handleInputChange(exercise.exerciseId, "reps", e.target.value)}
                      className="backdrop-blur-xl bg-white/5 border-white/10 text-white focus:border-accent/50 focus:bg-white/10 transition-all"
                    />
                  </div>

                  <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                    {!exercise.completed && (
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                        <ButtonGlow
                          variant="accent-glow"
                          className="w-full relative"
                          disabled={pendingExercise === exercise.workoutExerciseId}
                          onClick={() =>
                            handleLogSet(exercise.exerciseId, exercise.workoutExerciseId, exercise.sets, exercise.completedSets)
                          }
                        >
                          {pendingExercise === exercise.workoutExerciseId ? "Saving..." : "Log Set"}
                        </ButtonGlow>
                      </div>
                    )}
                    {exercise.completed && (
                      <div className="w-full py-3 px-4 backdrop-blur-xl bg-accent/20 border border-accent/30 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-2 text-accent font-semibold">
                          <CheckCircle className="h-4 w-4" />
                          Exercise Completed
                        </div>
                      </div>
                    )}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {!isWorkoutCompleted ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 + workout.exercises.length * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
              <ButtonGlow
                variant="accent-glow"
                className="w-full flex items-center justify-center gap-2 relative"
                onClick={handleCompleteWorkout}
                disabled={completingWorkout}
              >
                {completingWorkout ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </motion.div>
                    Finishing...
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4" />
                    Finish Workout
                  </>
                )}
              </ButtonGlow>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-full py-4 px-6 backdrop-blur-xl bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl text-center shadow-[0_0_20px_rgba(34,197,94,0.2)]"
          >
            <div className="flex items-center justify-center gap-2 text-green-400 font-semibold">
              <CheckCircle className="h-5 w-5" />
              Workout Completed!
            </div>
          </motion.div>
        )}
      </div>

      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={handleCelebrationClose}
        workoutName={workout.name}
        exerciseCount={workout.exercises.length}
      />

      {/* Exercise Demo Modal */}
      <ExerciseDemoModal
        isOpen={demoExerciseName !== null}
        onClose={() => setDemoExerciseName(null)}
        exerciseName={demoExerciseName || ""}
      />
    </div>
  )
}

