"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Zap, Dumbbell, Clock, Target, TrendingUp, Activity, Heart, Flame, Users } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { generateWorkoutPlan, type WorkoutPlanPreferences } from "@/lib/actions/personalized-workouts"

interface WorkoutPlanGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (planId: string) => void
}

const trainingModalities = [
  { id: "strength", name: "Strength", icon: Dumbbell, description: "Build max strength" },
  { id: "hypertrophy", name: "Bodybuilding", icon: TrendingUp, description: "Muscle growth" },
  { id: "endurance", name: "Endurance", icon: Activity, description: "Cardio & stamina" },
  { id: "power", name: "Power", icon: Flame, description: "Explosive movements" },
  { id: "HIIT", name: "HIIT", icon: Zap, description: "High-intensity" },
  { id: "mobility", name: "Mobility", icon: Heart, description: "Flexibility & range" },
  { id: "functional", name: "Functional", icon: Users, description: "Real-world fitness" },
  { id: "mind_body", name: "Mind-Body", icon: Heart, description: "Yoga & mindfulness" },
]

const experienceLevels = [
  { id: "beginner", name: "Beginner", description: "New to training" },
  { id: "intermediate", name: "Intermediate", description: "1-3 years experience" },
  { id: "advanced", name: "Advanced", description: "3-5 years experience" },
  { id: "expert", name: "Expert", description: "5+ years experience" },
]

const sessionDurations = [
  { value: 30, label: "30 min", description: "Quick session" },
  { value: 45, label: "45 min", description: "Standard" },
  { value: 60, label: "60 min", description: "Full workout" },
  { value: 90, label: "90 min", description: "Extended" },
  { value: 120, label: "120 min", description: "Max session" },
]

const equipmentOptions = [
  "Barbell",
  "Dumbbells",
  "Kettlebell",
  "Resistance Bands",
  "Pull-up Bar",
  "Bench",
  "Cable Machine",
  "Bodyweight Only",
  "Medicine Ball",
  "TRX/Suspension Trainer",
  "Rowing Machine",
  "Bike/Spin Bike",
  "Treadmill",
]

const focusAreaOptions = [
  "Upper Body",
  "Lower Body",
  "Core",
  "Full Body",
  "Back",
  "Chest",
  "Shoulders",
  "Arms",
  "Legs",
  "Glutes",
  "Cardio",
  "Athletic Performance",
]

export function WorkoutPlanGeneratorModal({ isOpen, onClose, onSuccess }: WorkoutPlanGeneratorModalProps) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0) // 0-100
  const [currentWeek, setCurrentWeek] = useState(1) // 1-4

  // Form state
  const [trainingStyle, setTrainingStyle] = useState<string>("hypertrophy")
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4)
  const [sessionDuration, setSessionDuration] = useState<number>(60)
  const [experienceLevel, setExperienceLevel] = useState<string>("intermediate")
  const [fitnessGoal, setFitnessGoal] = useState<string>("")
  const [equipment, setEquipment] = useState<string[]>(["Barbell", "Dumbbells", "Bench", "Bodyweight Only"])
  const [focusAreas, setFocusAreas] = useState<string[]>(["Full Body"])

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    setGenerationProgress(0)
    setCurrentWeek(1)

    console.log('[WorkoutPlanGenerator] Starting plan generation...')

    // Track previous week to detect week changes
    let previousWeek = 1

    // Simulate progress updates (each week fills 0-100% in ~23 seconds)
    const progressInterval = setInterval(() => {
      setCurrentWeek((currentWeekValue) => {
        // Reset progress when week changes
        if (currentWeekValue !== previousWeek) {
          previousWeek = currentWeekValue
          setGenerationProgress(0)
        }
        return currentWeekValue
      })

      setGenerationProgress((prev) => {
        const newProgress = prev + 4.35 // ~23 seconds per week = 4.35% per 250ms
        if (newProgress >= 100) {
          return 100
        }
        return newProgress
      })
    }, 250)

    // Update week indicator every ~23 seconds
    const weekInterval = setInterval(() => {
      setCurrentWeek((prev) => (prev < 4 ? prev + 1 : 4))
    }, 23000)

    try {
      const preferences: WorkoutPlanPreferences = {
        trainingStyle: trainingStyle as any,
        daysPerWeek,
        sessionDurationMinutes: sessionDuration,
        fitnessGoal: fitnessGoal || undefined,
        experienceLevel: experienceLevel as any,
        availableEquipment: equipment,
        focusAreas,
      }

      console.log('[WorkoutPlanGenerator] Calling generateWorkoutPlan with preferences:', preferences)
      const result = await generateWorkoutPlan(preferences)
      console.log('[WorkoutPlanGenerator] Result received:', result)

      if (!result.success) {
        const errorMsg = result.error || "Failed to generate workout plan"
        console.error('[WorkoutPlanGenerator] Plan generation failed:', errorMsg)
        setError(errorMsg)
        clearInterval(progressInterval)
        clearInterval(weekInterval)
        return
      }

      console.log('[WorkoutPlanGenerator] Plan generated successfully! Plan ID:', result.planId)

      // Complete progress bar
      clearInterval(progressInterval)
      clearInterval(weekInterval)
      setGenerationProgress(100)
      setCurrentWeek(4)

      // Reset form
      resetForm()
      onSuccess(result.planId!)
      onClose()
    } catch (err) {
      console.error('[WorkoutPlanGenerator] Exception during plan generation:', err)
      clearInterval(progressInterval)
      clearInterval(weekInterval)
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred"
      console.error('[WorkoutPlanGenerator] Error message:', errorMsg)
      setError(errorMsg)
    } finally {
      setIsLoading(false)
      setGenerationProgress(0)
      setCurrentWeek(1)
    }
  }

  const resetForm = () => {
    setStep(1)
    setTrainingStyle("hypertrophy")
    setDaysPerWeek(4)
    setSessionDuration(60)
    setExperienceLevel("intermediate")
    setFitnessGoal("")
    setEquipment(["Barbell", "Dumbbells", "Bench", "Bodyweight Only"])
    setFocusAreas(["Full Body"])
    setError(null)
  }

  const toggleEquipment = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    )
  }

  const toggleFocusArea = (area: string) => {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
  }

  const handleClose = () => {
    if (!isLoading) {
      resetForm()
      onClose()
    }
  }

  const canProceed = () => {
    if (step === 1) return true
    if (step === 2) return equipment.length > 0
    if (step === 3) return focusAreas.length > 0
    return true
  }

  const totalSteps = 3

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 pb-modal-safe"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="w-full max-w-md"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-accent/30 bg-black/90 backdrop-blur-lg flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between border-b border-accent/20 p-4 flex-shrink-0">
                <div>
                  <h3 className="font-bold text-white">Generate Workout Plan</h3>
                  <p className="text-xs text-accent">
                    Step {step} of {totalSteps}
                  </p>
                </div>
                <motion.button
                  onClick={handleClose}
                  className="rounded-full p-2 hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  disabled={isLoading}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <X className="h-5 w-5 text-white/60" />
                </motion.button>
              </div>

              {/* Progress Bar */}
              <div className="px-4 pt-2 flex-shrink-0">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${(step / totalSteps) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Step 1: Training Style, Experience, Schedule */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Training Modality */}
                    <div className="space-y-2">
                      <Label className="text-white">Training Style</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {trainingModalities.map((modality) => (
                          <motion.div
                            key={modality.id}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          >
                            <Card
                              className={`cursor-pointer transition-all hover:border-accent/50 min-h-[72px] ${
                                trainingStyle === modality.id
                                  ? "border-accent border-glow bg-accent/10"
                                  : "border-white/10 bg-black/30"
                              }`}
                              onClick={() => setTrainingStyle(modality.id)}
                            >
                              <CardContent className="p-3 text-center">
                                <modality.icon
                                  className={`mx-auto mb-1 h-4 w-4 ${
                                    trainingStyle === modality.id ? "text-accent" : "text-white/70"
                                  }`}
                                />
                                <span
                                  className={`text-xs font-medium block mb-0.5 ${
                                    trainingStyle === modality.id ? "text-accent" : "text-white"
                                  }`}
                                >
                                  {modality.name}
                                </span>
                                <span className="text-[10px] text-white/50">{modality.description}</span>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Experience Level */}
                    <div className="space-y-2">
                      <Label className="text-white">Experience Level</Label>
                      <div className="space-y-2">
                        {experienceLevels.map((level) => (
                          <motion.div
                            key={level.id}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          >
                            <Card
                              className={`cursor-pointer transition-all hover:border-accent/50 min-h-[56px] ${
                                experienceLevel === level.id
                                  ? "border-accent border-glow bg-accent/10"
                                  : "border-white/10 bg-black/30"
                              }`}
                              onClick={() => setExperienceLevel(level.id)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4
                                      className={`font-medium text-sm ${
                                        experienceLevel === level.id ? "text-accent" : "text-white"
                                      }`}
                                    >
                                      {level.name}
                                    </h4>
                                    <p className="text-xs text-white/60">{level.description}</p>
                                  </div>
                                  {experienceLevel === level.id && (
                                    <div className="h-4 w-4 rounded-full bg-accent" />
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Days Per Week */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-white">Days Per Week</Label>
                        <span className="text-accent font-bold">{daysPerWeek}</span>
                      </div>
                      <Slider
                        value={[daysPerWeek]}
                        onValueChange={(value) => setDaysPerWeek(value[0])}
                        min={1}
                        max={7}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-white/50">
                        <span>1 day</span>
                        <span>7 days</span>
                      </div>
                    </div>

                    {/* Session Duration */}
                    <div className="space-y-2">
                      <Label className="text-white">Session Duration</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {sessionDurations.map((duration) => (
                          <motion.div
                            key={duration.value}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          >
                            <Card
                              className={`cursor-pointer transition-all hover:border-accent/50 min-h-[56px] ${
                                sessionDuration === duration.value
                                  ? "border-accent border-glow bg-accent/10"
                                  : "border-white/10 bg-black/30"
                              }`}
                              onClick={() => setSessionDuration(duration.value)}
                            >
                              <CardContent className="p-2 text-center">
                                <Clock
                                  className={`mx-auto mb-1 h-3 w-3 ${
                                    sessionDuration === duration.value ? "text-accent" : "text-white/70"
                                  }`}
                                />
                                <span
                                  className={`text-xs font-medium block ${
                                    sessionDuration === duration.value ? "text-accent" : "text-white"
                                  }`}
                                >
                                  {duration.label}
                                </span>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Fitness Goal (Optional) */}
                    <div className="space-y-2">
                      <Label htmlFor="fitness-goal" className="text-white">
                        Fitness Goal <span className="text-white/50">(Optional)</span>
                      </Label>
                      <Input
                        id="fitness-goal"
                        value={fitnessGoal}
                        onChange={(e) => setFitnessGoal(e.target.value)}
                        placeholder="e.g., Lose 15 lbs, Run a 5K, Build muscle..."
                        className="w-full"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Equipment */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-2"
                  >
                    <Label className="text-white">Available Equipment</Label>
                    <p className="text-xs text-white/60 mb-3">Select all that apply (minimum 3 recommended)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {equipmentOptions.map((item) => (
                        <motion.div
                          key={item}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all hover:border-accent/50 min-h-[48px] ${
                              equipment.includes(item)
                                ? "border-accent border-glow bg-accent/10"
                                : "border-white/10 bg-black/30"
                            }`}
                            onClick={() => toggleEquipment(item)}
                          >
                            <CardContent className="p-3 flex items-center justify-between">
                              <span
                                className={`text-xs ${
                                  equipment.includes(item) ? "text-accent font-medium" : "text-white/70"
                                }`}
                              >
                                {item}
                              </span>
                              {equipment.includes(item) && <div className="h-3 w-3 rounded-full bg-accent" />}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Equipment warning */}
                    {equipment.length < 3 && (
                      <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <p className="text-xs text-yellow-500">
                          ⚠️ <strong>Limited equipment selected.</strong> We recommend selecting at least 3 equipment options (including "Bodyweight Only") to ensure enough exercise variety for your plan.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Focus Areas */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-2"
                  >
                    <Label className="text-white">Focus Areas</Label>
                    <p className="text-xs text-white/60 mb-3">Select one or more areas to prioritize</p>
                    <div className="grid grid-cols-2 gap-2">
                      {focusAreaOptions.map((area) => (
                        <motion.div
                          key={area}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all hover:border-accent/50 min-h-[48px] ${
                              focusAreas.includes(area)
                                ? "border-accent border-glow bg-accent/10"
                                : "border-white/10 bg-black/30"
                            }`}
                            onClick={() => toggleFocusArea(area)}
                          >
                            <CardContent className="p-3 flex items-center justify-between">
                              <span
                                className={`text-xs ${
                                  focusAreas.includes(area) ? "text-accent font-medium" : "text-white/70"
                                }`}
                              >
                                {area}
                              </span>
                              {focusAreas.includes(area) && <div className="h-3 w-3 rounded-full bg-accent" />}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                  >
                    <p className="text-sm text-red-400">{error}</p>
                  </motion.div>
                )}
              </div>

              <div className="border-t border-accent/20 p-4 flex gap-3 flex-shrink-0">
                {step > 1 && (
                  <ButtonGlow
                    variant="outline-glow"
                    onClick={() => setStep(step - 1)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Back
                  </ButtonGlow>
                )}
                {step < totalSteps ? (
                  <ButtonGlow
                    variant="accent-glow"
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceed() || isLoading}
                    className={step === 1 ? "w-full" : "flex-1"}
                  >
                    Next
                  </ButtonGlow>
                ) : (
                  <div className="flex-1 space-y-2">
                    {isLoading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-accent">
                          <span>Generating Week {currentWeek} of 4...</span>
                          <span>{Math.round(generationProgress)}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-accent to-yellow-300"
                            initial={{ width: "0%" }}
                            animate={{ width: `${generationProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    )}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400"
                      >
                        <p className="font-medium mb-1">Generation Failed</p>
                        <p className="text-xs text-red-300/80">{error}</p>
                        <p className="text-xs text-red-300/60 mt-2">Check browser console for details</p>
                      </motion.div>
                    )}
                    <ButtonGlow
                      variant="accent-glow"
                      onClick={handleGenerate}
                      disabled={!canProceed() || isLoading}
                      isLoading={isLoading}
                      loadingText={`Week ${currentWeek}/4`}
                      className="w-full"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Generate Plan
                    </ButtonGlow>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
