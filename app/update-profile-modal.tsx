"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Save, Dumbbell, Home, Hotel, Building, Settings, Camera, Loader2, Clock, Calendar } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateProfile } from "@/lib/actions/profile"
import { uploadAvatar } from "@/lib/actions/avatar"
import { useToast } from "@/hooks/use-toast"
import { DEFAULT_AVATAR } from "@/lib/stock-images"

interface ProfileData {
  name: string
  avatar_url?: string
  age: string
  gender: string
  heightFeet: string
  heightInches: string
  weight: string
  goalWeight: string
  calorieGoal?: string
  primaryGoal: string
  activityLevel: number | string
  gymAccess: string
  selectedGym: string
  customEquipment: string
  allergies: string[]
  customRestrictions: string[]
  programType?: string
  customProgramType?: string
  availableTimeMinutes?: number
  trainingDaysPerWeek?: number
  timezone?: string
}

interface UpdateProfileModalProps {
  isOpen: boolean
  onClose: () => void
  currentProfile: ProfileData
  onUpdate: (profile: ProfileData) => void
}

const goals = [
  { id: "lose-weight", title: "Lose Weight", description: "Burn fat and get leaner" },
  { id: "tone-up", title: "Tone Up", description: "Define muscles and improve shape" },
  { id: "build-muscle", title: "Build Muscle", description: "Gain strength and size" },
  { id: "lifestyle", title: "Lifestyle Maintenance", description: "Stay healthy and active" },
]

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

const commonAllergies = ["Dairy", "Gluten", "Peanuts", "Tree Nuts", "Soy", "Eggs", "Fish", "Shellfish"]

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

export function UpdateProfileModal({ isOpen, onClose, currentProfile, onUpdate }: UpdateProfileModalProps) {
  const [profile, setProfile] = useState<ProfileData>(currentProfile)
  const [activeTab, setActiveTab] = useState<"basic" | "goals" | "gym" | "nutrition" | "training">("basic")
  const [showActivityDefinitions, setShowActivityDefinitions] = useState(false)
  const [newRestriction, setNewRestriction] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    console.log("[v0] UpdateProfileModal received profile:", currentProfile)
    setProfile(currentProfile)
  }, [currentProfile])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setUploadingAvatar(true)
    try {
      // Use server action for upload (handles auth and RLS properly)
      const formData = new FormData()
      formData.append("file", file)
      
      console.log("[AvatarUpload] Uploading via server action, size:", file.size)
      
      const result = await uploadAvatar(formData)
      
      if (!result.success) {
        console.error("[AvatarUpload] Server action error:", result.error)
        throw new Error(result.error || "Upload failed")
      }

      console.log("[AvatarUpload] Upload successful:", result.avatarUrl)

      // Update profile state with new avatar URL
      if (result.avatarUrl) {
        updateProfileState({ avatar_url: result.avatarUrl })
      }

      toast({
        title: "Avatar uploaded",
        description: "Your profile photo has been updated",
      })
    } catch (error) {
      console.error("[AvatarUpload] Error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to upload avatar. Please try again."
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const result = await updateProfile(profile)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        onUpdate(profile)
        toast({
          title: "Success",
          description: "Your profile has been updated successfully",
        })
        onClose()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateProfileState = (updates: Partial<ProfileData>) => {
    setProfile((prev) => ({ ...prev, ...updates }))
  }

  const toggleAllergy = (allergy: string) => {
    const currentAllergies = profile.allergies || []
    if (currentAllergies.includes(allergy)) {
      updateProfileState({ allergies: currentAllergies.filter((a) => a !== allergy) })
    } else {
      updateProfileState({ allergies: [...currentAllergies, allergy] })
    }
  }

  const addCustomRestriction = () => {
    if (newRestriction.trim() && !profile.customRestrictions.includes(newRestriction.trim())) {
      updateProfileState({
        customRestrictions: [...profile.customRestrictions, newRestriction.trim()],
      })
      setNewRestriction("")
    }
  }

  const removeCustomRestriction = (restriction: string) => {
    updateProfileState({
      customRestrictions: profile.customRestrictions.filter((r) => r !== restriction),
    })
  }

  const handleRestrictionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addCustomRestriction()
    }
  }

  const tabs = [
    { id: "basic", label: "Basic Info", icon: User },
    { id: "goals", label: "Goals", icon: Dumbbell },
    { id: "gym", label: "Gym Access", icon: Building },
    { id: "training", label: "Training", icon: Dumbbell },
    { id: "nutrition", label: "Nutrition", icon: Settings },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-2xl h-[90vh] flex flex-col"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-accent/30 bg-black/90 backdrop-blur-lg h-full flex flex-col">
              {/* Fixed Header */}
              <div className="flex items-center justify-between border-b border-accent/20 p-4 flex-shrink-0">
                <div className="flex items-center">
                  <User className="mr-3 h-6 w-6 text-accent" />
                  <div>
                    <h3 className="font-bold text-white">Update Profile</h3>
                    <p className="text-xs text-accent">Keep your information current</p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="rounded-full p-2 hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <X className="h-5 w-5 text-white/60" />
                </motion.button>
              </div>

              {/* Fixed Tab Navigation */}
              <div className="flex border-b border-accent/20 overflow-x-auto flex-shrink-0">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-all whitespace-nowrap min-h-[48px] ${
                      activeTab === tab.id ? "border-b-2 border-accent text-accent" : "text-white/70 hover:text-white"
                    }`}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <tab.icon className="mr-2 h-4 w-4" />
                    {tab.label}
                  </motion.button>
                ))}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Basic Info Tab */}
                  {activeTab === "basic" && (
                    <div className="space-y-6">
                      {/* Avatar Upload */}
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-24 w-24 border-2 border-accent/30">
                            <AvatarImage 
                              src={profile.avatar_url || DEFAULT_AVATAR} 
                              alt={profile.name || "Profile"} 
                            />
                            <AvatarFallback className="text-2xl">
                              {profile.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <motion.button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="absolute bottom-0 right-0 p-2.5 rounded-full bg-accent text-black hover:bg-accent/90 transition-colors disabled:opacity-50 min-w-[40px] min-h-[40px] flex items-center justify-center"
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          >
                            {uploadingAvatar ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Camera className="h-4 w-4" />
                            )}
                          </motion.button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                        </div>
                        <p className="text-sm text-white/60">
                          Click the camera icon to upload a profile photo
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={profile.name}
                            onChange={(e) => updateProfileState({ name: e.target.value })}
                            placeholder="Your name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="age">Age</Label>
                          <Input
                            id="age"
                            type="number"
                            value={profile.age}
                            onChange={(e) => updateProfileState({ age: e.target.value })}
                            placeholder="Age"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gender">Gender</Label>
                          <select
                            id="gender"
                            value={profile.gender}
                            onChange={(e) => updateProfileState({ gender: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Height</Label>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                type="number"
                                value={profile.heightFeet}
                                onChange={(e) => updateProfileState({ heightFeet: e.target.value })}
                                placeholder="Feet"
                                min="1"
                                max="8"
                              />
                            </div>
                            <div className="flex-1">
                              <Input
                                type="number"
                                value={profile.heightInches}
                                onChange={(e) => updateProfileState({ heightInches: e.target.value })}
                                placeholder="Inches"
                                min="0"
                                max="11"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="weight">Current Weight (lbs)</Label>
                          <Input
                            id="weight"
                            type="number"
                            value={profile.weight}
                            onChange={(e) => updateProfileState({ weight: e.target.value })}
                            placeholder="Weight in lbs"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="goalWeight">Goal Weight (lbs)</Label>
                          <Input
                            id="goalWeight"
                            type="number"
                            value={profile.goalWeight}
                            onChange={(e) => updateProfileState({ goalWeight: e.target.value })}
                            placeholder="Goal weight in lbs"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <Label>Activity Level</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white/70">{profile.activityLevel}/5</span>
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
                                <span className="font-medium text-accent">1 - Sedentary:</span> Little to no exercise,
                                desk job
                              </div>
                              <div>
                                <span className="font-medium text-accent">2 - Lightly Active:</span> Light exercise 1-3
                                days/week
                              </div>
                              <div>
                                <span className="font-medium text-accent">3 - Moderately Active:</span> Moderate
                                exercise 3-5 days/week
                              </div>
                              <div>
                                <span className="font-medium text-accent">4 - Very Active:</span> Hard exercise 6-7
                                days/week
                              </div>
                              <div>
                                <span className="font-medium text-accent">5 - Extremely Active:</span> Very hard
                                exercise, physical job
                              </div>
                            </div>
                          </div>
                        )}

                        <Slider
                          value={[typeof profile.activityLevel === 'number' ? profile.activityLevel : Number(profile.activityLevel) || 3]}
                          onValueChange={(value) => updateProfileState({ activityLevel: value[0] })}
                          max={5}
                          min={1}
                          step={1}
                          className="py-4"
                        />
                        <div className="flex justify-between text-xs text-white/50">
                          <span>Sedentary</span>
                          <span>Very Active</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Goals Tab */}
                  {activeTab === "goals" && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-white text-lg">Primary Goal</Label>
                        <p className="text-white/70 text-sm mb-4">What would you like to achieve?</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {goals.map((goal) => (
                            <motion.div
                              key={goal.id}
                              whileTap={{ scale: 0.98 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                              <Card
                                className={`cursor-pointer transition-all hover:border-accent ${
                                  profile.primaryGoal === goal.id ? "border-accent border-glow" : "border-border"
                                }`}
                                onClick={() => updateProfileState({ primaryGoal: goal.id })}
                              >
                                <CardContent className="p-4">
                                  <h3
                                    className={`font-bold ${profile.primaryGoal === goal.id ? "text-accent" : "text-white"}`}
                                  >
                                    {goal.title}
                                  </h3>
                                  <p className="mt-1 text-sm text-white/70">{goal.description}</p>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gym Access Tab */}
                  {activeTab === "gym" && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-white text-lg">Gym Access</Label>
                        <p className="text-white/70 text-sm mb-4">Where do you work out?</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { icon: Home, label: "Home", value: "home" },
                            { icon: Hotel, label: "Hotel", value: "hotel" },
                            { icon: Building, label: "Commercial", value: "commercial" },
                            { icon: Dumbbell, label: "None", value: "none" },
                            { icon: Building, label: "Specific Gym", value: "gym" },
                            { icon: Settings, label: "Custom", value: "custom" },
                          ].map((item) => (
                            <motion.div
                              key={item.value}
                              whileTap={{ scale: 0.98 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                              <Card
                                className={`cursor-pointer transition-all hover:border-accent min-h-[80px] ${
                                  profile.gymAccess === item.value ? "border-accent border-glow" : "border-border"
                                }`}
                                onClick={() => updateProfileState({ gymAccess: item.value })}
                              >
                                <CardContent className="flex flex-col items-center justify-center p-4">
                                  <item.icon
                                    className={`mb-2 h-6 w-6 ${profile.gymAccess === item.value ? "text-accent" : "text-white/70"}`}
                                  />
                                  <span className={`text-sm ${profile.gymAccess === item.value ? "text-accent" : "text-white/70"}`}>
                                    {item.label}
                                  </span>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>

                        {profile.gymAccess === "gym" && (
                          <div className="mt-6 space-y-3">
                            <Label htmlFor="gym-select">Select Your Gym</Label>
                            <select
                              id="gym-select"
                              value={profile.selectedGym}
                              onChange={(e) => updateProfileState({ selectedGym: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">Choose your gym...</option>
                              {popularGyms.map((gym) => (
                                <option key={gym} value={gym}>
                                  {gym}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {profile.gymAccess === "custom" && (
                          <div className="mt-6 space-y-2">
                            <Label htmlFor="equipment">Available Equipment</Label>
                            <Input
                              id="equipment"
                              value={profile.customEquipment}
                              onChange={(e) => updateProfileState({ customEquipment: e.target.value })}
                              placeholder="e.g., Dumbbells, Resistance bands, Pull-up bar..."
                            />
                            <p className="text-xs text-white/60">List the equipment you have access to</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Training Tab */}
                  {activeTab === "training" && (
                    <div className="space-y-6">
                      {/* Fitness Program Type */}
                      <div className="space-y-3">
                        <h2 className="text-lg font-medium text-white flex items-center gap-2">
                          <Dumbbell className="h-5 w-5 text-accent" />
                          Fitness Program
                        </h2>
                        <div className="grid gap-2">
                          {programTypes.map((style) => (
                            <motion.div
                              key={style.id}
                              whileTap={{ scale: 0.98 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                              <Card
                                className={`p-3 cursor-pointer transition-all ${
                                  profile.programType === style.id
                                    ? "border-accent bg-accent/10"
                                    : "border-white/10 hover:border-white/30"
                                }`}
                                onClick={() => updateProfileState({ programType: style.id })}
                              >
                                <p className={`font-medium ${profile.programType === style.id ? "text-accent" : "text-white"}`}>
                                  {style.label}
                                </p>
                                <p className="text-xs text-white/60">{style.description}</p>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                        {profile.programType === "other" && (
                          <Input
                            value={profile.customProgramType || ""}
                            onChange={(e) => updateProfileState({ customProgramType: e.target.value })}
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
                            <motion.button
                              key={option.value}
                              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all min-h-[44px] ${
                                profile.availableTimeMinutes === option.value
                                  ? "bg-accent text-black"
                                  : "bg-black/50 text-white/70 border border-accent/30 hover:border-accent/50 active:border-accent"
                              }`}
                              onClick={() => updateProfileState({ availableTimeMinutes: option.value })}
                              whileTap={{ scale: 0.95 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                              {option.label}
                            </motion.button>
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
                            <motion.button
                              key={days}
                              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all min-h-[44px] ${
                                profile.trainingDaysPerWeek === days
                                  ? "bg-accent text-black"
                                  : "bg-black/50 text-white/70 border border-accent/30 hover:border-accent/50 active:border-accent"
                              }`}
                              onClick={() => updateProfileState({ trainingDaysPerWeek: days })}
                              whileTap={{ scale: 0.95 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                              {days}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nutrition Tab */}
                  {activeTab === "nutrition" && (
                    <div className="space-y-6">
                      {/* Calorie Goal Section */}
                      <div>
                        <Label className="text-white text-lg">Daily Calorie Goal</Label>
                        <p className="text-white/70 text-sm mb-4">
                          Override the calculated target or leave empty for recommended
                        </p>

                        {/* Show calculated reference */}
                        <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/60">Calculated Target:</span>
                            <span className="text-accent font-medium">
                              {(() => {
                                const goalWeight = Number(profile.goalWeight) || 170
                                const isLosingWeight = profile.primaryGoal === "lose-weight"
                                const multiplier = isLosingWeight ? 11 : 13
                                return Math.round(goalWeight * multiplier)
                              })()} kcal
                            </span>
                          </div>
                          <p className="text-xs text-white/50 mt-1">
                            Based on your goal weight ({profile.goalWeight || 170} lbs) and primary goal.{" "}
                            <a href="/health-sources" className="text-accent/70 hover:text-accent underline">
                              View sources (ISSN)
                            </a>
                          </p>
                        </div>

                        {/* Custom calorie goal input */}
                        <div className="space-y-2">
                          <Label htmlFor="calorieGoal" className="text-white/80">Custom Calorie Goal (optional)</Label>
                          <div className="flex gap-2 items-center">
                            <Input
                              id="calorieGoal"
                              type="number"
                              value={profile.calorieGoal || ""}
                              onChange={(e) => updateProfileState({ calorieGoal: e.target.value })}
                              placeholder="e.g., 2000"
                              min="800"
                              max="10000"
                              className="flex-1"
                            />
                            <span className="text-white/60 text-sm">kcal</span>
                          </div>
                          {profile.calorieGoal && (
                            <button
                              type="button"
                              onClick={() => updateProfileState({ calorieGoal: "" })}
                              className="text-xs text-accent hover:text-accent/80 underline"
                            >
                              Clear custom goal (use calculated)
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-white text-lg">Allergies</Label>
                        <p className="text-white/70 text-sm mb-4">Select any allergies you have</p>
                        <div className="flex flex-wrap gap-2">
                          {commonAllergies.map((allergy) => (
                            <motion.button
                              key={allergy}
                              onClick={() => toggleAllergy(allergy)}
                              className={`rounded-full px-3 py-2 text-sm transition-all min-h-[36px] ${
                                profile.allergies?.includes(allergy)
                                  ? "bg-accent text-black"
                                  : "bg-black/50 text-white/70 border border-accent/30 hover:border-accent/50 active:border-accent"
                              }`}
                              whileTap={{ scale: 0.95 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                              {allergy}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-white text-lg">Custom Dietary Restrictions</Label>
                        <p className="text-white/70 text-sm mb-4">Add any other dietary restrictions</p>
                        <div className="flex gap-2 mb-3">
                          <Input
                            value={newRestriction}
                            onChange={(e) => setNewRestriction(e.target.value)}
                            onKeyDown={handleRestrictionKeyDown}
                            placeholder="Add custom restriction"
                            className="flex-1 text-white bg-black/50 border-white/20"
                            autoComplete="off"
                          />
                          <ButtonGlow
                            variant="outline-glow"
                            onClick={addCustomRestriction}
                            disabled={!newRestriction.trim()}
                          >
                            Add
                          </ButtonGlow>
                        </div>

                        {profile.customRestrictions.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {profile.customRestrictions.map((restriction, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-sm text-accent"
                              >
                                {restriction}
                                <button
                                  onClick={() => removeCustomRestriction(restriction)}
                                  className="text-accent hover:text-accent/80"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="border-t border-accent/20 p-4 flex gap-3 flex-shrink-0">
                <ButtonGlow variant="outline-glow" onClick={onClose} className="flex-1" disabled={saving}>
                  Cancel
                </ButtonGlow>
                <ButtonGlow
                  variant="accent-glow"
                  onClick={handleSave}
                  className="flex-1"
                  isLoading={saving}
                  loadingText="Saving..."
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </ButtonGlow>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
