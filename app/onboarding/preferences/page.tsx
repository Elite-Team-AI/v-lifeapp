"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOnboarding } from "@/lib/contexts/onboarding-context"
import { motion } from "framer-motion"
import { ArrowRight, Plus, Dumbbell, Clock, Calendar } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

const allergies = ["Dairy", "Gluten", "Peanuts", "Tree Nuts", "Soy", "Eggs", "Fish", "Shellfish"]

const programTypes = [
  { id: "aesthetics", label: "Aesthetics / Hypertrophy", description: "Muscle building & definition" },
  { id: "hiit", label: "HIIT", description: "High intensity interval training" },
  { id: "crossfit", label: "CrossFit Style", description: "Varied functional movements" },
  { id: "cardio", label: "Purely Cardio", description: "Endurance & cardiovascular focus" },
  { id: "strength", label: "Strength / Powerlifting", description: "Maximum strength development" },
  { id: "other", label: "Other", description: "Custom program type" },
]

const timeOptions = [
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60+ min" },
]

const daysOptions = [2, 3, 4, 5, 6]

export default function Preferences() {
  const router = useRouter()
  const { data, updateData } = useOnboarding()

  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(data.allergies)
  const [customRestriction, setCustomRestriction] = useState("")
  const [customRestrictions, setCustomRestrictions] = useState<string[]>(data.customRestrictions)
  const [programType, setProgramType] = useState(data.programType || "")
  const [customProgramType, setCustomProgramType] = useState(data.customProgramType || "")
  const [availableTime, setAvailableTime] = useState(data.availableTimeMinutes || 45)
  const [trainingDays, setTrainingDays] = useState(data.trainingDaysPerWeek || 4)

  const toggleAllergy = (allergy: string) => {
    if (selectedAllergies.includes(allergy)) {
      setSelectedAllergies(selectedAllergies.filter((a) => a !== allergy))
    } else {
      setSelectedAllergies([...selectedAllergies, allergy])
    }
  }

  const addCustomRestriction = () => {
    if (customRestriction.trim() && !customRestrictions.includes(customRestriction.trim())) {
      setCustomRestrictions([...customRestrictions, customRestriction.trim()])
      setCustomRestriction("")
    }
  }

  const handleContinue = () => {
    updateData({
      allergies: selectedAllergies,
      customRestrictions,
      programType,
      customProgramType: programType === "other" ? customProgramType : undefined,
      availableTimeMinutes: availableTime,
      trainingDaysPerWeek: trainingDays,
    })
    router.push("/onboarding/confirmation")
  }

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
        className="relative z-10 mx-auto w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 text-center">
          <motion.h1
            className="text-4xl font-bold tracking-tight font-heading bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Training & Preferences
          </motion.h1>
          <motion.p
            className="mt-2 text-white/70 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Help us customize your workout and nutrition plans
          </motion.p>
        </div>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, staggerChildren: 0.1 }}
        >
          {/* Fitness Program Type */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-lg font-medium tracking-tight font-heading text-white/90 flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-accent" />
              Fitness Program
            </h2>
            <div className="grid gap-2">
              {programTypes.map((style, index) => (
                <motion.div
                  key={style.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`relative p-4 cursor-pointer transition-all backdrop-blur-xl ${
                      programType === style.id
                        ? "border-accent bg-accent/10 shadow-[0_0_15px_rgba(255,215,0,0.2)]"
                        : "border-white/10 bg-white/5 hover:border-accent/50 hover:bg-white/10"
                    }`}
                    onClick={() => setProgramType(style.id)}
                  >
                    {programType === style.id && (
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent rounded-lg" />
                    )}
                    <p
                      className={`relative font-medium ${
                        programType === style.id ? "text-accent" : "text-white"
                      }`}
                    >
                      {style.label}
                    </p>
                    <p className="relative text-xs text-white/60 mt-1 leading-relaxed">{style.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
            {programType === "other" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Input
                  value={customProgramType}
                  onChange={(e) => setCustomProgramType(e.target.value)}
                  placeholder="Describe your program type"
                  className="mt-2 backdrop-blur-xl bg-white/5 border-white/10 focus:border-accent/50 focus:bg-white/10 transition-all duration-300"
                />
              </motion.div>
            )}
          </motion.div>

          {/* Available Time */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            <h2 className="text-lg font-medium tracking-tight font-heading text-white/90 flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Available Workout Time
            </h2>
            <div className="flex gap-2">
              {timeOptions.map((option, index) => (
                <motion.button
                  key={option.value}
                  className={`flex-1 rounded-lg px-3 py-3 text-sm font-medium transition-all backdrop-blur-xl ${
                    availableTime === option.value
                      ? "bg-accent text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                      : "bg-white/5 text-white/70 border border-white/10 hover:border-accent/50 hover:bg-white/10"
                  }`}
                  onClick={() => setAvailableTime(option.value)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.95 + index * 0.05 }}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Training Days */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1 }}
          >
            <h2 className="text-lg font-medium tracking-tight font-heading text-white/90 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Days Per Week
            </h2>
            <div className="flex gap-2">
              {daysOptions.map((days, index) => (
                <motion.button
                  key={days}
                  className={`flex-1 rounded-lg px-3 py-3 text-sm font-medium transition-all backdrop-blur-xl ${
                    trainingDays === days
                      ? "bg-accent text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                      : "bg-white/5 text-white/70 border border-white/10 hover:border-accent/50 hover:bg-white/10"
                  }`}
                  onClick={() => setTrainingDays(days)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.15 + index * 0.05 }}
                >
                  {days}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3 }}
          >
            <h2 className="text-lg font-medium tracking-tight font-heading text-white/90">Food Allergies</h2>
            <div className="flex flex-wrap gap-2">
              {allergies.map((allergy, index) => (
                <motion.button
                  key={allergy}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all backdrop-blur-xl ${
                    selectedAllergies.includes(allergy)
                      ? "bg-accent text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                      : "bg-white/5 text-white/70 border border-white/10 hover:border-accent/50 hover:bg-white/10"
                  }`}
                  onClick={() => toggleAllergy(allergy)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.35 + index * 0.05 }}
                >
                  {allergy}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6 }}
          >
            <h2 className="text-lg font-medium tracking-tight font-heading text-white/90">Custom Restrictions</h2>
            <div className="flex gap-2">
              <Input
                value={customRestriction}
                onChange={(e) => setCustomRestriction(e.target.value)}
                placeholder="Add custom restriction"
                className="flex-1 backdrop-blur-xl bg-white/5 border-white/10 focus:border-accent/50 focus:bg-white/10 transition-all duration-300"
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <ButtonGlow
                  variant="outline-glow"
                  size="icon"
                  onClick={addCustomRestriction}
                  disabled={!customRestriction.trim()}
                  className="backdrop-blur-xl"
                >
                  <Plus className="h-4 w-4" />
                </ButtonGlow>
              </motion.div>
            </div>

            {customRestrictions.length > 0 && (
              <motion.div
                className="flex flex-wrap gap-2 pt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                {customRestrictions.map((restriction, index) => (
                  <motion.div
                    key={index}
                    className="rounded-full backdrop-blur-xl bg-accent/20 border border-accent/30 px-4 py-2 text-sm text-accent font-medium"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {restriction}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
              <ButtonGlow
                variant="accent-glow"
                className="w-full h-12 text-base font-semibold tracking-wide relative"
                onClick={handleContinue}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </ButtonGlow>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
