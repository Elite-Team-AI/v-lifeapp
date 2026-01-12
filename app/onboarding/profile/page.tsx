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
      gymAccess: gymAccess || "",
      selectedGym: selectedGym || "",
      customEquipment,
      activityLevel,
    })
    router.push("/onboarding/goals")
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
          <h1 className="text-3xl font-bold text-white">Profile Setup</h1>
          <p className="mt-2 text-white/70">Tell us about yourself</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 relative z-50 cursor-pointer"
                style={{ position: "relative", zIndex: 50 }}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Height</Label>
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
                    className="w-full text-foreground"
                    style={{ width: "100%", minWidth: "60px" }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="Weight in lbs"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Gym Access</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Home, label: "Home", value: "home" },
                { icon: Hotel, label: "Hotel", value: "hotel" },
                { icon: Building, label: "Commercial", value: "commercial" },
                { icon: Dumbbell, label: "None", value: "none" },
              ].map((item) => (
                <Card
                  key={item.value}
                  className={`flex cursor-pointer flex-col items-center justify-center p-4 transition-all hover:border-accent ${gymAccess === item.value ? "border-accent border-glow" : "border-border"}`}
                  onClick={() => {
                    setGymAccess(item.value)
                    setShowCustomEquipment(false)
                    setSelectedGym(null)
                  }}
                >
                  <item.icon className={`mb-2 h-6 w-6 ${gymAccess === item.value ? "text-accent" : "text-white/70"}`} />
                  <span className={gymAccess === item.value ? "text-accent" : "text-white/70"}>{item.label}</span>
                </Card>
              ))}
              <Card
                className={`flex cursor-pointer flex-col items-center justify-center p-4 transition-all hover:border-accent ${gymAccess === "gym" ? "border-accent border-glow" : "border-border"}`}
                onClick={() => {
                  setGymAccess("gym")
                  setShowCustomEquipment(false)
                }}
              >
                <Building className={`mb-2 h-6 w-6 ${gymAccess === "gym" ? "text-accent" : "text-white/70"}`} />
                <span className={gymAccess === "gym" ? "text-accent" : "text-white/70"}>Specific Gym</span>
              </Card>
              <Card
                className={`flex cursor-pointer flex-col items-center justify-center p-4 transition-all hover:border-accent ${gymAccess === "custom" ? "border-accent border-glow" : "border-border"}`}
                onClick={() => {
                  setGymAccess("custom")
                  setShowCustomEquipment(true)
                  setSelectedGym(null)
                }}
              >
                <Settings className={`mb-2 h-6 w-6 ${gymAccess === "custom" ? "text-accent" : "text-white/70"}`} />
                <span className={gymAccess === "custom" ? "text-accent" : "text-white/70"}>Custom</span>
              </Card>
            </div>

            {gymAccess === "gym" && (
              <div className="mt-3 space-y-3">
                <Label htmlFor="gym-select">Select Your Gym</Label>
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <div className="rounded-lg border border-accent/30 bg-black/30 p-3">
                    <p className="text-sm text-accent font-medium">Great choice!</p>
                    <p className="text-xs text-white/80 mt-1">
                      We'll create your workout plan using the exact equipment available at {selectedGym}.
                    </p>
                  </div>
                )}

                {showGymRequest && (
                  <div className="space-y-3 rounded-lg border border-accent/30 bg-black/30 p-3">
                    <Label htmlFor="requested-gym">Gym Name</Label>
                    <Input
                      id="requested-gym"
                      value={requestedGym}
                      onChange={(e) => setRequestedGym(e.target.value)}
                      placeholder="Enter your gym's name and location"
                    />
                    <p className="text-xs text-white/60">
                      We'll review your request and add your gym's equipment profile to help create more accurate
                      workout plans.
                    </p>
                    <ButtonGlow variant="outline-glow" size="sm" className="w-full">
                      Submit Gym Request
                    </ButtonGlow>
                  </div>
                )}
              </div>
            )}

            {showCustomEquipment && gymAccess === "custom" && (
              <div className="mt-3 space-y-2">
                <Label htmlFor="equipment">Available Equipment</Label>
                <Input
                  id="equipment"
                  value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value)}
                  placeholder="e.g., Dumbbells, Resistance bands, Pull-up bar..."
                  className="w-full"
                />
                <p className="text-xs text-white/60">List the equipment you have access to</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Activity Level</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/70">{activityLevel}/5</span>
                <button
                  type="button"
                  onClick={() => setShowActivityDefinitions(!showActivityDefinitions)}
                  className="text-xs text-accent hover:text-accent/80 underline"
                >
                  {showActivityDefinitions ? "Hide" : "View"} definitions
                </button>
              </div>
            </div>

            {showActivityDefinitions && (
              <div className="rounded-lg border border-accent/30 bg-black/30 p-3 text-xs text-white/80">
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
              </div>
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
          </div>

          <ButtonGlow variant="accent-glow" className="w-full" onClick={handleContinue} disabled={!name.trim()}>
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonGlow>
        </div>
      </motion.div>
    </div>
  )
}
