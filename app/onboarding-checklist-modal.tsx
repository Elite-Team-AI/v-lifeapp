"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, ChevronRight, Dumbbell, Settings, Target, AlertCircle } from "lucide-react"

interface OnboardingChecklistModalProps {
  isOpen: boolean
  onClose: () => void
  profileData?: any // User profile data to check completion
}

export function OnboardingChecklistModal({ isOpen, onClose, profileData }: OnboardingChecklistModalProps) {
  const router = useRouter()

  // Calculate completion status based on profile data
  const completionStatus = useMemo(() => {
    if (!profileData) {
      return {
        hasEquipment: false,
        hasWorkoutTime: false,
        hasMobilityAssessment: false,
        hasWorkoutPlan: false,
        percentage: 0,
        missingItems: []
      }
    }

    const hasEquipment = !!(profileData.custom_equipment &&
      (Array.isArray(profileData.custom_equipment) ? profileData.custom_equipment.length > 0 : profileData.custom_equipment))
    const hasWorkoutTime = !!profileData.preferred_workout_time
    const hasMobilityAssessment = !!(
      profileData.shoulder_mobility &&
      profileData.hip_mobility &&
      profileData.ankle_mobility
    )

    const completed = [hasEquipment, hasWorkoutTime, hasMobilityAssessment].filter(Boolean).length
    const total = 3
    const percentage = Math.round((completed / total) * 100)

    const missingItems: string[] = []
    if (!hasEquipment) missingItems.push("Equipment not set")
    if (!hasWorkoutTime) missingItems.push("Workout time not set")
    if (!hasMobilityAssessment) missingItems.push("Fitness assessment not completed")

    return {
      hasEquipment,
      hasWorkoutTime,
      hasMobilityAssessment,
      percentage,
      missingItems
    }
  }, [profileData])

  const steps = [
    {
      id: 1,
      icon: Dumbbell,
      title: "Go to Fitness Page",
      description: "Navigate to the Fitness tab",
      action: () => {
        onClose()
        router.push("/fitness")
      }
    },
    {
      id: 2,
      icon: Settings,
      title: "Update Your Fitness Profile",
      description: "Scroll down and open 'Your Custom Fitness Profile'",
      details: [
        "Click the Edit button",
        "Update your available equipment",
        "Set your preferred workout time",
        "Take the mobility assessment",
        "Click Save at the bottom"
      ]
    },
    {
      id: 3,
      icon: Target,
      title: "Generate Your Workout Plan",
      description: "Scroll up and click 'Generate Personalized Plan'",
      details: [
        "AI will create a custom 4-week plan",
        "Based on your goals and equipment",
        "Progressive overload built-in"
      ]
    }
  ]

  const handleStepClick = (step: typeof steps[0]) => {
    if (step.action) {
      step.action()
    }
  }

  const handleGetStarted = () => {
    onClose()
    router.push("/fitness")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-neutral-900 border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent">
            Welcome to V-Life! 🎉
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Follow these quick steps to get your personalized fitness plan set up
          </DialogDescription>
        </DialogHeader>

        {/* Progress Status Banner */}
        <div className="bg-neutral-800/50 border border-white/10 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Profile Setup Progress</h3>
              <p className="text-xs text-white/60 mt-0.5">
                {completionStatus.percentage}% Complete
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-accent">
                {completionStatus.percentage}%
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-neutral-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-yellow-400"
              initial={{ width: 0 }}
              animate={{ width: `${completionStatus.percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

          {/* Missing items */}
          {completionStatus.missingItems.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Still needed:</span>
              </div>
              {completionStatus.missingItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-white/60 pl-5">
                  <div className="w-1 h-1 rounded-full bg-accent/50" />
                  {item}
                </div>
              ))}
            </div>
          )}

          {completionStatus.percentage === 100 && (
            <div className="flex items-center gap-2 text-xs text-accent">
              <Check className="w-4 h-4" />
              <span>All set! Ready to generate your workout plan</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className="relative p-4 rounded-lg border transition-all duration-300 cursor-pointer bg-neutral-800/50 border-white/10 hover:border-accent/30 hover:bg-neutral-800"
                  onClick={() => handleStepClick(step)}
                >
                  <div className="flex items-start gap-3">
                    {/* Step number */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-white/10 text-white/70">
                      {index + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-accent flex-shrink-0" />
                        <h3 className="text-sm font-semibold text-white">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-xs text-white/60 mb-2">
                        {step.description}
                      </p>

                      {/* Details list */}
                      {step.details && (
                        <ul className="space-y-1 mt-2">
                          {step.details.map((detail, i) => (
                            <li key={i} className="text-xs text-white/50 flex items-start gap-2">
                              <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5 text-accent/50" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-white/10 hover:bg-white/5"
          >
            I'll Do This Later
          </Button>
          <Button
            onClick={handleGetStarted}
            className="flex-1 bg-accent hover:bg-accent/90 text-black font-semibold"
          >
            Get Started →
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="text-center text-xs text-white/50">
          Complete these steps to unlock your personalized AI fitness coach
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default OnboardingChecklistModal
