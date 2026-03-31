"use client"

import { useState } from "react"
import { AlertCircle, X, Settings } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { ButtonGlow } from "@/components/ui/button-glow"
import { useRouter } from "next/navigation"

interface ProfileCompletenessCheckProps {
  profile: {
    age: number | null
    height_feet: number | null
    height_inches: number | null
    weight: number | null
    goal_weight: number | null
    primary_goal: string | null
  }
}

export function ProfileCompletenessBanner({ profile }: ProfileCompletenessCheckProps) {
  const router = useRouter()
  const [isDismissed, setIsDismissed] = useState(false)

  // Check which fields are missing
  const missingFields: string[] = []
  if (!profile.age) missingFields.push("Age")
  if (!profile.height_feet || !profile.height_inches) missingFields.push("Height")
  if (!profile.weight) missingFields.push("Weight")
  if (!profile.goal_weight) missingFields.push("Goal Weight")
  if (!profile.primary_goal) missingFields.push("Primary Goal")

  // Don't show if profile is complete or user dismissed
  if (missingFields.length === 0 || isDismissed) {
    return null
  }

  const handleUpdateProfile = () => {
    router.push("/settings")
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Card className="relative overflow-hidden bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 border-2 border-orange-500/30 backdrop-blur-xl shadow-lg">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-orange-500/5 animate-gradient-shift bg-[length:200%_auto]" />

          <div className="relative p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white mb-1">
                  Complete Your Profile
                </h3>
                <p className="text-sm text-white/80 mb-3">
                  Your profile is missing some important information. This affects the accuracy of your personalized plans and AI coaching.
                </p>

                {/* Missing fields list */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {missingFields.map((field) => (
                    <span
                      key={field}
                      className="px-2 py-1 bg-orange-500/20 border border-orange-500/40 rounded-full text-xs font-medium text-orange-200"
                    >
                      {field}
                    </span>
                  ))}
                </div>

                {/* Action button */}
                <ButtonGlow
                  variant="outline-glow"
                  size="sm"
                  onClick={handleUpdateProfile}
                  className="bg-orange-500/10 border-orange-500/40 text-orange-200 hover:bg-orange-500/20 hover:border-orange-500/60"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Update Profile
                </ButtonGlow>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => setIsDismissed(true)}
                className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
