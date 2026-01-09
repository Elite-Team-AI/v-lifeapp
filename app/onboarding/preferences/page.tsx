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
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-black to-charcoal p-4">
      <motion.div
        className="mx-auto w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Training & Preferences</h1>
          <p className="mt-2 text-white/70">Help us customize your workout and nutrition plans</p>
        </div>

        <div className="space-y-6">
          {/* Fitness Program Type */}
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-accent" />
              Fitness Program
            </h2>
            <div className="grid gap-2">
              {programTypes.map((style) => (
                <Card
                  key={style.id}
                  className={`p-3 cursor-pointer transition-all ${
                    programType === style.id
                      ? "border-accent bg-accent/10"
                      : "border-white/10 hover:border-white/30"
                  }`}
                  onClick={() => setProgramType(style.id)}
                >
                  <p className={`font-medium ${programType === style.id ? "text-accent" : "text-white"}`}>
                    {style.label}
                  </p>
                  <p className="text-xs text-white/60">{style.description}</p>
                </Card>
              ))}
            </div>
            {programType === "other" && (
              <Input
                value={customProgramType}
                onChange={(e) => setCustomProgramType(e.target.value)}
                placeholder="Describe your program type"
                className="mt-2"
              />
            )}
          </div>

          {/* Available Time */}
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Available Workout Time
            </h2>
            <div className="flex gap-2">
              {timeOptions.map((option) => (
                <button
                  key={option.value}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    availableTime === option.value
                      ? "bg-accent text-black"
                      : "bg-black/50 text-white/70 border border-accent/30 hover:border-accent/50"
                  }`}
                  onClick={() => setAvailableTime(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Training Days */}
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Days Per Week
            </h2>
            <div className="flex gap-2">
              {daysOptions.map((days) => (
                <button
                  key={days}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    trainingDays === days
                      ? "bg-accent text-black"
                      : "bg-black/50 text-white/70 border border-accent/30 hover:border-accent/50"
                  }`}
                  onClick={() => setTrainingDays(days)}
                >
                  {days}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-medium text-white">Food Allergies</h2>
            <div className="flex flex-wrap gap-2">
              {allergies.map((allergy) => (
                <button
                  key={allergy}
                  className={`rounded-full px-3 py-1 text-sm transition-all ${
                    selectedAllergies.includes(allergy)
                      ? "bg-accent text-black"
                      : "bg-black/50 text-white/70 border border-accent/30 hover:border-accent/50"
                  }`}
                  onClick={() => toggleAllergy(allergy)}
                >
                  {allergy}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-medium text-white">Custom Restrictions</h2>
            <div className="flex gap-2">
              <Input
                value={customRestriction}
                onChange={(e) => setCustomRestriction(e.target.value)}
                placeholder="Add custom restriction"
                className="flex-1"
              />
              <ButtonGlow
                variant="outline-glow"
                size="icon"
                onClick={addCustomRestriction}
                disabled={!customRestriction.trim()}
              >
                <Plus className="h-4 w-4" />
              </ButtonGlow>
            </div>

            {customRestrictions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {customRestrictions.map((restriction, index) => (
                  <div key={index} className="rounded-full bg-accent/20 px-3 py-1 text-sm text-accent">
                    {restriction}
                  </div>
                ))}
              </div>
            )}
          </div>

          <ButtonGlow variant="accent-glow" className="w-full" onClick={handleContinue}>
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonGlow>
        </div>
      </motion.div>
    </div>
  )
}
