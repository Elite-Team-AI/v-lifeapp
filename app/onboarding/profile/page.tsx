"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, Dumbbell, Home, Hotel, Building, Settings } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useOnboarding } from "@/lib/contexts/onboarding-context"

export default function ProfileSetup() {
  const router = useRouter()
  const { data, updateData } = useOnboarding()

  const [name, setName] = useState(data.name)
  const [age, setAge] = useState(data.age)
  const [gender, setGender] = useState(data.gender)
  const [heightFeet, setHeightFeet] = useState(data.heightFeet)
  const [heightInches, setHeightInches] = useState(data.heightInches)
  const [weight, setWeight] = useState(data.weight)
  const [goalWeight, setGoalWeight] = useState(data.goalWeight)
  const [gymAccess, setGymAccess] = useState<string | null>(data.gymAccess || null)
  const [activityLevel, setActivityLevel] = useState(data.activityLevel)
  const [showActivityDefinitions, setShowActivityDefinitions] = useState(false)
  const [customEquipment, setCustomEquipment] = useState(data.customEquipment)
  const [showCustomEquipment, setShowCustomEquipment] = useState(false)
  const [selectedGym, setSelectedGym] = useState<string | null>(data.selectedGym || null)
  const [showGymRequest, setShowGymRequest] = useState(false)
  const [requestedGym, setRequestedGym] = useState("")

  const popularGyms = [
    "Planet Fitness",
    "LA Fitness",
    "24 Hour Fitness",
    "Gold's Gym",
    "Anytime Fitness",
    "Crunch Fitness",
    "Equinox",
    "Life Time Fitness",
  ]

  const handleContinue = () => {
    updateData({
      name,
      age,
      gender,
      heightFeet,
      heightInches,
      weight,
      goalWeight,
      gymAccess: gymAccess || "",
      selectedGym: selectedGym || "",
      customEquipment,
      activityLevel,
    })
    router.push("/onboarding/goals")
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
        className="relative z-10 mx-auto w-full max-w-md"
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
            Profile Setup
          </motion.h1>
          <motion.p
            className="mt-2 text-white/70 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Tell us about yourself
          </motion.p>
        </div>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, staggerChildren: 0.1 }}
        >
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Label htmlFor="name" className="text-white/90 font-medium">Name *</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="backdrop-blur-xl bg-white/5 border-white/10 focus:border-accent/50 focus:bg-white/10 transition-all duration-300"
            />
          </motion.div>

          <motion.div
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="space-y-2">
              <Label htmlFor="age" className="text-white/90 font-medium">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="backdrop-blur-xl bg-white/5 border-white/10 focus:border-accent/50 focus:bg-white/10 transition-all duration-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-white/90 font-medium">Gender</Label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => {
                  console.log("[v0] Gender changed to:", e.target.value)
                  setGender(e.target.value)
                }}
                onFocus={() => console.log("[v0] Gender dropdown focused")}
                onBlur={() => console.log("[v0] Gender dropdown blurred")}
                onClick={() => console.log("[v0] Gender dropdown clicked")}
                className="flex h-10 w-full rounded-md border border-white/10 backdrop-blur-xl bg-white/5 px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent/50 focus-visible:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 relative z-50 cursor-pointer transition-all duration-300"
                style={{ position: "relative", zIndex: 50 }}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/90 font-medium">Height</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="feet"
                      type="number"
                      placeholder="Feet"
                      min="1"
                      max="8"
                      value={heightFeet}
                      onChange={(e) => {
                        console.log("[v0] Height feet changed to:", e.target.value)
                        setHeightFeet(e.target.value)
                      }}
                      className="backdrop-blur-xl bg-white/5 border-white/10 focus:border-accent/50 focus:bg-white/10 transition-all duration-300"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      id="inches"
                      type="number"
                      placeholder="In"
                      min="0"
                      max="11"
                      value={heightInches}
                      onChange={(e) => {
                        console.log("[v0] Height inches changed to:", e.target.value)
                        setHeightInches(e.target.value)
                      }}
                      onFocus={() => console.log("[v0] Inches input focused, current value:", heightInches)}
                      onBlur={() => console.log("[v0] Inches input blurred, final value:", heightInches)}
                      className="w-full text-foreground backdrop-blur-xl bg-white/5 border-white/10 focus:border-accent/50 focus:bg-white/10 transition-all duration-300"
                      style={{ width: "100%", minWidth: "60px" }}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-white/90 font-medium">Current Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="Current weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="backdrop-blur-xl bg-white/5 border-white/10 focus:border-accent/50 focus:bg-white/10 transition-all duration-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalWeight" className="text-white/90 font-medium">Goal Weight (lbs)</Label>
              <Input
                id="goalWeight"
                type="number"
                placeholder="Target weight"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                className="backdrop-blur-xl bg-white/5 border-white/10 focus:border-accent/50 focus:bg-white/10 transition-all duration-300"
              />
            </div>
          </motion.div>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Label className="text-white/90 font-medium">Gym Access</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Home, label: "Home", value: "home" },
                { icon: Hotel, label: "Hotel", value: "hotel" },
                { icon: Building, label: "Commercial", value: "commercial" },
                { icon: Dumbbell, label: "None", value: "none" },
              ].map((item, index) => (
                <motion.div
                  key={item.value}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card
                    className={`relative flex cursor-pointer flex-col items-center justify-center p-4 transition-all backdrop-blur-xl ${
                      gymAccess === item.value
                        ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                        : "border-white/10 bg-white/5 hover:border-accent/50 hover:bg-white/10"
                    }`}
                    onClick={() => {
                      setGymAccess(item.value)
                      setShowCustomEquipment(false)
                      setSelectedGym(null)
                    }}
                  >
                    {gymAccess === item.value && (
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent rounded-lg" />
                    )}
                    <item.icon
                      className={`relative mb-2 h-6 w-6 transition-all ${
                        gymAccess === item.value ? "text-accent scale-110" : "text-white/70"
                      }`}
                    />
                    <span
                      className={`relative text-sm font-medium transition-all ${
                        gymAccess === item.value ? "text-accent" : "text-white/70"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Card>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card
                  className={`relative flex cursor-pointer flex-col items-center justify-center p-4 transition-all backdrop-blur-xl ${
                    gymAccess === "gym"
                      ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                      : "border-white/10 bg-white/5 hover:border-accent/50 hover:bg-white/10"
                  }`}
                  onClick={() => {
                    setGymAccess("gym")
                    setShowCustomEquipment(false)
                  }}
                >
                  {gymAccess === "gym" && (
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent rounded-lg" />
                  )}
                  <Building
                    className={`relative mb-2 h-6 w-6 transition-all ${
                      gymAccess === "gym" ? "text-accent scale-110" : "text-white/70"
                    }`}
                  />
                  <span
                    className={`relative text-sm font-medium transition-all ${
                      gymAccess === "gym" ? "text-accent" : "text-white/70"
                    }`}
                  >
                    Specific Gym
                  </span>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card
                  className={`relative flex cursor-pointer flex-col items-center justify-center p-4 transition-all backdrop-blur-xl ${
                    gymAccess === "custom"
                      ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                      : "border-white/10 bg-white/5 hover:border-accent/50 hover:bg-white/10"
                  }`}
                  onClick={() => {
                    setGymAccess("custom")
                    setShowCustomEquipment(true)
                    setSelectedGym(null)
                  }}
                >
                  {gymAccess === "custom" && (
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent rounded-lg" />
                  )}
                  <Settings
                    className={`relative mb-2 h-6 w-6 transition-all ${
                      gymAccess === "custom" ? "text-accent scale-110" : "text-white/70"
                    }`}
                  />
                  <span
                    className={`relative text-sm font-medium transition-all ${
                      gymAccess === "custom" ? "text-accent" : "text-white/70"
                    }`}
                  >
                    Custom
                  </span>
                </Card>
              </motion.div>
            </div>

            {gymAccess === "gym" && (
              <motion.div
                className="mt-3 space-y-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Label htmlFor="gym-select" className="text-white/90 font-medium">Select Your Gym</Label>
                <select
                  id="gym-select"
                  value={selectedGym || ""}
                  onChange={(e) => {
                    setSelectedGym(e.target.value)
                    if (e.target.value === "request") {
                      setShowGymRequest(true)
                    } else {
                      setShowGymRequest(false)
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-white/10 backdrop-blur-xl bg-white/5 px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent/50 focus-visible:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
                >
                  <option value="">Choose your gym...</option>
                  {popularGyms.map((gym) => (
                    <option key={gym} value={gym}>
                      {gym}
                    </option>
                  ))}
                  <option value="request">My gym is not listed - Request to add</option>
                </select>

                {selectedGym && selectedGym !== "request" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-lg border border-accent/30 backdrop-blur-xl bg-accent/10 p-3"
                  >
                    <p className="text-sm text-accent font-medium">Great choice!</p>
                    <p className="text-xs text-white/80 mt-1">
                      We'll create your workout plan using the exact equipment available at {selectedGym}.
                    </p>
                  </motion.div>
                )}

                {showGymRequest && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-3 rounded-lg border border-accent/30 backdrop-blur-xl bg-white/5 p-3"
                  >
                    <Label htmlFor="requested-gym" className="text-white/90 font-medium">Gym Name</Label>
                    <Input
                      id="requested-gym"
                      value={requestedGym}
                      onChange={(e) => setRequestedGym(e.target.value)}
                      placeholder="Enter your gym's name and location"
                      className="backdrop-blur-xl bg-white/5 border-white/10 focus:border-accent/50 focus:bg-white/10 transition-all duration-300"
                    />
                    <p className="text-xs text-white/60">
                      We'll review your request and add your gym's equipment profile to help create more accurate
                      workout plans.
                    </p>
                    <ButtonGlow variant="outline-glow" size="sm" className="w-full backdrop-blur-xl">
                      Submit Gym Request
                    </ButtonGlow>
                  </motion.div>
                )}
              </motion.div>
            )}

            {showCustomEquipment && gymAccess === "custom" && (
              <motion.div
                className="mt-3 space-y-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Label htmlFor="equipment" className="text-white/90 font-medium">Available Equipment</Label>
                <Input
                  id="equipment"
                  value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value)}
                  placeholder="e.g., Dumbbells, Resistance bands, Pull-up bar..."
                  className="w-full backdrop-blur-xl bg-white/5 border-white/10 focus:border-accent/50 focus:bg-white/10 transition-all duration-300"
                />
                <p className="text-xs text-white/60">List the equipment you have access to</p>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex justify-between">
              <Label className="text-white/90 font-medium">Activity Level</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold bg-gradient-to-r from-accent to-yellow-300 bg-clip-text text-transparent">
                  {activityLevel}/5
                </span>
                <motion.button
                  type="button"
                  onClick={() => setShowActivityDefinitions(!showActivityDefinitions)}
                  className="text-xs text-accent hover:text-accent/80 underline transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showActivityDefinitions ? "Hide" : "View"} definitions
                </motion.button>
              </div>
            </div>

            {showActivityDefinitions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg border border-accent/30 backdrop-blur-xl bg-accent/10 p-3 text-xs text-white/80"
              >
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-accent">1 - Sedentary:</span> Little to no exercise, desk job
                  </div>
                  <div>
                    <span className="font-medium text-accent">2 - Lightly Active:</span> Light exercise 1-3 days/week
                  </div>
                  <div>
                    <span className="font-medium text-accent">3 - Moderately Active:</span> Moderate exercise 3-5
                    days/week
                  </div>
                  <div>
                    <span className="font-medium text-accent">4 - Very Active:</span> Hard exercise 6-7 days/week
                  </div>
                  <div>
                    <span className="font-medium text-accent">5 - Extremely Active:</span> Very hard exercise, physical
                    job
                  </div>
                </div>
              </motion.div>
            )}

            <Slider
              defaultValue={[3]}
              max={5}
              min={1}
              step={1}
              onValueChange={(value) => setActivityLevel(value[0])}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-white/50">
              <span>Sedentary</span>
              <span>Very Active</span>
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
              <ButtonGlow
                variant="accent-glow"
                className="w-full h-12 text-base font-semibold tracking-wide relative"
                onClick={handleContinue}
                disabled={!name.trim()}
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
