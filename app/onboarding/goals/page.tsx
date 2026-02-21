"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card } from "@/components/ui/card"
import { useOnboarding } from "@/lib/contexts/onboarding-context"
import { useToast } from "@/hooks/use-toast"

const goals = [
  { id: "lose-weight", title: "Lose Weight", description: "Burn fat and get leaner" },
  { id: "tone-up", title: "Tone Up", description: "Define muscles and improve shape" },
  { id: "build-muscle", title: "Build Muscle", description: "Gain strength and size" },
  { id: "lifestyle", title: "Lifestyle Maintenance", description: "Stay healthy and active" },
]

export default function GoalSelection() {
  const router = useRouter()
  const { data, updateData } = useOnboarding()
  const { toast } = useToast()

  const [selectedGoal, setSelectedGoal] = useState<string | null>(data.primaryGoal || null)

  const handleContinue = () => {
    if (!selectedGoal) {
      toast({
        title: "Choose a goal",
        description: "Select the primary result you want so we can personalize everything else.",
        variant: "destructive",
      })
      return
    }

    updateData({
      primaryGoal: selectedGoal,
    })
    router.push("/onboarding/preferences")
  }

  const focusAreas = [
    {
      title: "Training Focus",
      description: "We’ll adjust volume, exercise selection, and recovery sessions around this outcome.",
    },
    {
      title: "Nutrition Targets",
      description: "Daily calories, protein, and macro splits are tailored to match your primary goal.",
    },
    {
      title: "Habit Coaching",
      description: "We highlight the habits (sleep, hydration, mindfulness) that most impact your objective.",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-hidden p-4">
      {/* Animated gradient background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px] animate-blob" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

      <motion.div
        className="relative z-10 mx-auto w-full max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 text-center">
          <motion.h1
            className="text-4xl font-bold bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Select Your Goal
          </motion.h1>
          <motion.p
            className="mt-2 text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            What would you like to achieve?
          </motion.p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card
                    className={`relative flex cursor-pointer flex-col p-6 transition-all backdrop-blur-xl ${
                      selectedGoal === goal.id
                        ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                        : "border-white/10 bg-white/5 hover:border-accent/50 hover:bg-white/10"
                    }`}
                    onClick={() => setSelectedGoal(goal.id)}
                  >
                    {selectedGoal === goal.id && (
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent rounded-lg" />
                    )}
                    <h3
                      className={`relative font-bold text-lg transition-all ${
                        selectedGoal === goal.id ? "text-accent" : "text-white"
                      }`}
                    >
                      {goal.title}
                    </h3>
                    <p className="relative mt-2 text-sm text-white/70">{goal.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <motion.div
              className="rounded-lg border border-accent/30 backdrop-blur-xl bg-white/5 p-6 space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-purple-500/10 rounded-lg blur-xl" />
                <h2 className="relative text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  What This Choice Unlocks
                </h2>
              </div>
              <p className="text-sm text-white/70">
                Your primary goal sets the tone for coaching, nutrition targets, and how V-Life celebrates your wins.
              </p>

              <div className="space-y-3">
                {focusAreas.map((area, index) => (
                  <motion.div
                    key={area.title}
                    className="rounded-lg border border-accent/20 backdrop-blur-xl bg-accent/5 p-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ x: 4 }}
                  >
                    <p className="text-sm font-semibold text-accent">{area.title}</p>
                    <p className="text-xs text-white/70 mt-1">{area.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                <ButtonGlow variant="accent-glow" className="w-full h-12 text-base font-semibold relative" onClick={handleContinue}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </ButtonGlow>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
