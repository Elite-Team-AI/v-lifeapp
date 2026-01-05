"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Loader2, Play, Pause, Volume2, VolumeX, Target, Dumbbell, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExerciseDemoData {
  exerciseId: string
  name: string
  imageUrl: string
  equipments: string[]
  bodyParts: string[]
  gender: string
  exerciseType: string
  targetMuscles: string[]
  secondaryMuscles: string[]
  videoUrl: string
  keywords: string[]
  overview: string
  instructions: string[]
  exerciseTips: string[]
  variations: string[]
  relatedExerciseIds: string[]
}

interface ExerciseDemoModalProps {
  isOpen: boolean
  onClose: () => void
  exerciseName: string
}

export function ExerciseDemoModal({ isOpen, onClose, exerciseName }: ExerciseDemoModalProps) {
  const [exercise, setExercise] = useState<ExerciseDemoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (isOpen && exerciseName) {
      fetchExerciseData()
    } else {
      // Reset state when modal closes
      setExercise(null)
      setError(null)
      setIsPlaying(false)
      setIsMuted(true)
    }
  }, [isOpen, exerciseName])

  const fetchExerciseData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/exercise-demo?name=${encodeURIComponent(exerciseName)}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          setError("Demo not available for this exercise")
        } else {
          setError(data.error || "Failed to load exercise demo")
        }
        return
      }

      if (data.success && data.exercise) {
        setExercise(data.exercise)
      } else {
        setError("Exercise not found")
      }
    } catch (err) {
      console.error("[Exercise Demo] Error:", err)
      setError("Failed to load exercise demo")
    } finally {
      setLoading(false)
    }
  }

  const handlePlayPause = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleMuteToggle = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">{exerciseName}</DialogTitle>
          <DialogDescription className="text-white/70">
            Exercise Demonstration
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <span className="ml-3 text-white/70">Loading exercise demo...</span>
          </div>
        )}

        {error && (
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
              <Info className="h-8 w-8 text-white/40" />
            </div>
            <p className="text-white/70">{error}</p>
            <p className="text-sm text-white/50 mt-2">
              Try asking VBot for form tips instead!
            </p>
          </div>
        )}

        {exercise && !loading && (
          <div className="space-y-6 mt-4">
            {/* Video Player */}
            {exercise.videoUrl && (
              <div className="relative w-full bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src={exercise.videoUrl}
                  className="w-full h-auto cursor-pointer"
                  muted={isMuted}
                  onEnded={handleVideoEnded}
                  onClick={handlePlayPause}
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {!isPlaying && (
                    <div className="pointer-events-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePlayPause()
                        }}
                        className="flex items-center justify-center w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-colors"
                      >
                        <Play className="h-8 w-8 text-white ml-1" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-none">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlayPause()
                    }}
                    className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 text-white" />
                    ) : (
                      <Play className="h-5 w-5 text-white ml-0.5" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMuteToggle()
                    }}
                    className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="h-5 w-5 text-white" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-white" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Fallback Image */}
            {!exercise.videoUrl && exercise.imageUrl && (
              <div className="w-full bg-black rounded-lg overflow-hidden">
                <img
                  src={exercise.imageUrl}
                  alt={exercise.name}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Overview */}
            {exercise.overview && (
              <div>
                <h3 className="text-sm font-semibold text-accent mb-2 uppercase tracking-wider">Overview</h3>
                <p className="text-sm text-white/80 leading-relaxed">{exercise.overview}</p>
              </div>
            )}

            {/* Exercise Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Target Muscles */}
              {exercise.targetMuscles.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-accent" />
                    <h3 className="text-sm font-semibold text-white">Target Muscles</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {exercise.targetMuscles.map((muscle, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipment */}
              {exercise.equipments.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Dumbbell className="h-4 w-4 text-accent" />
                    <h3 className="text-sm font-semibold text-white">Equipment</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {exercise.equipments.map((equipment, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/80"
                      >
                        {equipment}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            {exercise.instructions && exercise.instructions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-accent mb-3 uppercase tracking-wider">
                  Step-by-Step Instructions
                </h3>
                <ol className="space-y-3">
                  {exercise.instructions.map((instruction, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-white/80 leading-relaxed flex-1">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Exercise Tips */}
            {exercise.exerciseTips && exercise.exerciseTips.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-accent mb-3 uppercase tracking-wider">
                  Form Tips
                </h3>
                <ul className="space-y-2">
                  {exercise.exerciseTips.map((tip, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span className="text-sm text-white/80 leading-relaxed flex-1">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Variations */}
            {exercise.variations && exercise.variations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-accent mb-3 uppercase tracking-wider">
                  Variations
                </h3>
                <ul className="space-y-2">
                  {exercise.variations.map((variation, idx) => (
                    <li key={idx} className="text-sm text-white/80 leading-relaxed">
                      {variation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

