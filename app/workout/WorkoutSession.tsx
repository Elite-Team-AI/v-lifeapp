"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { CelebrationModal } from "@/components/confetti-celebration"
import type { ActiveWorkoutPayload } from "@/lib/actions/workouts"
import { ArrowLeft, CheckCircle, ListOrdered, Repeat, Sparkles, Clock, Target, Trophy, HelpCircle } from "lucide-react"

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

  if (!workout) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-charcoal pb-nav-safe flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-center">
          <p className="text-white/70 text-lg">No workout scheduled for today.</p>
          <p className="text-white/50 text-sm mt-2">Visit the Fitness tab to generate your AI workout.</p>
        </div>
        <ButtonGlow variant="accent-glow" onClick={() => router.push("/fitness")}>
          Go to Fitness
        </ButtonGlow>
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

    toast({
      title: "Set logged",
      description: "Great work!",
    })
    router.refresh()
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
    <div className="min-h-screen bg-gradient-to-b from-black to-charcoal pb-nav-safe">
      <div className="container max-w-md px-4 py-6 space-y-6">
        <div className="flex items-center mb-4">
          <button onClick={() => router.back()} className="mr-4 rounded-full p-2 hover:bg-white/10">
            <ArrowLeft className="h-6 w-6 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{workout.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/70 capitalize">{workout.workoutType}</span>
              {workout.dayEmphasis && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="text-accent text-sm">{workout.dayEmphasis}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* AI Badge & Info */}
        <Card className="border-accent/20 bg-gradient-to-br from-accent/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm text-accent font-medium">AI-Generated Workout</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-white/70">
                  {workout.mode === "rounds" ? (
                    <Repeat className="h-4 w-4" />
                  ) : (
                    <ListOrdered className="h-4 w-4" />
                  )}
                  <span className="text-sm capitalize">{workout.mode}</span>
                </div>
                {workout.durationMinutes && (
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{workout.durationMinutes} min</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-white/70">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">{workout.exercises.length} exercises</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditioning Notes */}
        {workout.conditioningNotes && (
          <Card className="border-white/10 bg-black/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-sm text-accent font-semibold mb-2">Conditioning Finisher</p>
              <p className="text-sm text-white/80">{workout.conditioningNotes}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {workout.exercises.map((exercise) => (
            <Card key={exercise.workoutExerciseId} className="border-white/10 bg-black/60 backdrop-blur-sm">
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-accent capitalize">{exercise.category || "Strength"}</p>
                    <h3 className="text-white font-bold flex items-center gap-2">
                      {exercise.name}
                      <Link 
                        href={`/vbot?prompt=${encodeURIComponent(`How do I properly do a ${exercise.name}? Explain the correct form, key cues to focus on, and common mistakes to avoid.`)}`}
                        className="text-white/40 hover:text-accent transition-colors"
                        title={`How do I do a ${exercise.name}?`}
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Link>
                    </h3>
                  </div>
                  <span className="text-sm text-white/70">
                    {exercise.completedSets}/{exercise.sets} sets
                  </span>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Weight"
                    value={inputs[exercise.exerciseId]?.weight || ""}
                    onChange={(e) => handleInputChange(exercise.exerciseId, "weight", e.target.value)}
                    className="bg-black/40 border-white/10 text-white"
                  />
                  <Input
                    type="number"
                    placeholder="Reps"
                    value={inputs[exercise.exerciseId]?.reps || ""}
                    onChange={(e) => handleInputChange(exercise.exerciseId, "reps", e.target.value)}
                    className="bg-black/40 border-white/10 text-white"
                  />
                </div>

                <ButtonGlow
                  variant="accent-glow"
                  className="w-full"
                  disabled={pendingExercise === exercise.workoutExerciseId || exercise.completed}
                  onClick={() =>
                    handleLogSet(exercise.exerciseId, exercise.workoutExerciseId, exercise.sets, exercise.completedSets)
                  }
                >
                  {exercise.completed
                    ? "Exercise Completed"
                    : pendingExercise === exercise.workoutExerciseId
                      ? "Saving..."
                      : "Log Set"}
                </ButtonGlow>
              </CardContent>
            </Card>
          ))}
        </div>

        {!isWorkoutCompleted ? (
          <ButtonGlow
            variant="accent-glow"
            className="w-full flex items-center justify-center gap-2"
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
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full py-4 px-6 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl text-center"
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
    </div>
  )
}

