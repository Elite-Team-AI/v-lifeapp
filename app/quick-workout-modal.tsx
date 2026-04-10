"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Zap, Dumbbell, Clock, Target, TrendingUp, Loader2 } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface QuickWorkoutModalProps {
  isOpen: boolean
  onClose: () => void
  onWorkoutGenerated: (workout: any) => void
}

const bodyPartOptions = [
  {
    id: "full_body",
    name: "Full Body",
    icon: TrendingUp,
    description: "Complete workout",
    muscleGroups: ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core"]
  },
  {
    id: "upper_body",
    name: "Upper Body",
    icon: Dumbbell,
    description: "Chest, back, shoulders, arms",
    muscleGroups: ["Chest", "Back", "Shoulders", "Biceps", "Triceps"]
  },
  {
    id: "lower_body",
    name: "Lower Body",
    icon: Target,
    description: "Legs and glutes",
    muscleGroups: ["Quadriceps", "Hamstrings", "Glutes", "Calves"]
  },
  {
    id: "push",
    name: "Push",
    icon: TrendingUp,
    description: "Chest, shoulders, triceps",
    muscleGroups: ["Chest", "Shoulders", "Triceps"]
  },
  {
    id: "pull",
    name: "Pull",
    icon: Target,
    description: "Back and biceps",
    muscleGroups: ["Back", "Biceps", "Rear Delts"]
  },
  {
    id: "legs",
    name: "Legs",
    icon: Dumbbell,
    description: "Quads, hamstrings, glutes",
    muscleGroups: ["Quadriceps", "Hamstrings", "Glutes", "Calves"]
  },
  {
    id: "arms",
    name: "Arms",
    icon: TrendingUp,
    description: "Biceps and triceps",
    muscleGroups: ["Biceps", "Triceps", "Forearms"]
  },
  {
    id: "core",
    name: "Core",
    icon: Target,
    description: "Abs and obliques",
    muscleGroups: ["Abs", "Obliques", "Lower Back"]
  }
]

const durationOptions = [
  { value: 20, label: "20 min", description: "Quick session" },
  { value: 30, label: "30 min", description: "Standard" },
  { value: 45, label: "45 min", description: "Full workout" },
  { value: 60, label: "60 min", description: "Extended" }
]

const intensityOptions = [
  { id: "light", name: "Light", description: "Easy recovery workout" },
  { id: "moderate", name: "Moderate", description: "Balanced intensity" },
  { id: "intense", name: "Intense", description: "Push your limits" }
]

export function QuickWorkoutModal({ isOpen, onClose, onWorkoutGenerated }: QuickWorkoutModalProps) {
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("full_body")
  const [duration, setDuration] = useState<number>(30)
  const [intensity, setIntensity] = useState<string>("moderate")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      const selectedOption = bodyPartOptions.find(opt => opt.id === selectedBodyPart)

      const response = await fetch('/api/workouts/generate-quick-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bodyPart: selectedBodyPart,
          muscleGroups: selectedOption?.muscleGroups || [],
          duration,
          intensity
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate workout')
      }

      const data = await response.json()

      if (data.success && data.workout) {
        onWorkoutGenerated(data.workout)
        onClose()
      } else {
        throw new Error('No workout data returned')
      }
    } catch (err: any) {
      console.error('Error generating quick workout:', err)
      setError(err.message || 'Failed to generate workout. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedOption = bodyPartOptions.find(opt => opt.id === selectedBodyPart)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#101938] to-[#1D295B] border-[#8FD1FF]/30 shadow-2xl">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#FADF4A] rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-[#101938]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Quick Workout</h2>
                      <p className="text-[#8FD1FF]/80 text-sm">Generate a single workout for today</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}

                {/* Body Part Selection */}
                <div className="mb-6">
                  <Label className="text-white text-base font-semibold mb-3 block">
                    Select Focus Area
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {bodyPartOptions.map((option) => {
                      const Icon = option.icon
                      const isSelected = selectedBodyPart === option.id

                      return (
                        <button
                          key={option.id}
                          onClick={() => setSelectedBodyPart(option.id)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? 'bg-[#FADF4A]/20 border-[#FADF4A] shadow-lg'
                              : 'bg-[#1D295B]/50 border-[#1D295B] hover:border-[#8FD1FF]/30'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isSelected ? 'bg-[#FADF4A]' : 'bg-[#8FD1FF]/20'
                              }`}
                            >
                              <Icon
                                className={`w-5 h-5 ${
                                  isSelected ? 'text-[#101938]' : 'text-[#8FD1FF]'
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <div className={`font-semibold mb-1 ${
                                isSelected ? 'text-[#FADF4A]' : 'text-white'
                              }`}>
                                {option.name}
                              </div>
                              <div className="text-xs text-white/60">{option.description}</div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Show muscle groups for selected option */}
                  {selectedOption && (
                    <div className="mt-3 p-3 bg-[#1D295B]/30 rounded-lg">
                      <p className="text-xs text-[#8FD1FF]/70 mb-2">Target Muscles:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedOption.muscleGroups.map((muscle) => (
                          <span
                            key={muscle}
                            className="px-2 py-1 bg-[#8FD1FF]/20 text-[#8FD1FF] rounded-full text-xs"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Duration Selection */}
                <div className="mb-6">
                  <Label className="text-white text-base font-semibold mb-3 block flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Workout Duration
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {durationOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setDuration(option.value)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          duration === option.value
                            ? 'bg-[#8FD1FF]/20 border-[#8FD1FF] text-[#8FD1FF]'
                            : 'bg-[#1D295B]/50 border-[#1D295B] text-white/70 hover:border-[#8FD1FF]/30'
                        }`}
                      >
                        <div className="font-semibold">{option.label}</div>
                        <div className="text-xs mt-1 opacity-70">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intensity Selection */}
                <div className="mb-6">
                  <Label className="text-white text-base font-semibold mb-3 block flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Intensity Level
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {intensityOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setIntensity(option.id)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          intensity === option.id
                            ? 'bg-[#8FD1FF]/20 border-[#8FD1FF]'
                            : 'bg-[#1D295B]/50 border-[#1D295B] hover:border-[#8FD1FF]/30'
                        }`}
                      >
                        <div className={`font-semibold mb-1 ${
                          intensity === option.id ? 'text-[#8FD1FF]' : 'text-white'
                        }`}>
                          {option.name}
                        </div>
                        <div className="text-xs text-white/60">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-[#FADF4A] hover:bg-[#FADF4A]/90 text-[#101938] rounded-xl font-bold py-6 text-lg flex items-center justify-center gap-2 shadow-lg transition-all duration-200"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Building your workout...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Generate Quick Workout
                    </>
                  )}
                </Button>

                <p className="text-center text-[#8FD1FF]/60 text-xs mt-3">
                  {isGenerating
                    ? 'AI is personalizing your workout — usually takes 10–20 seconds'
                    : `AI will create a personalized ${duration}-minute ${selectedOption?.name.toLowerCase()} workout based on your equipment and goals`}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
