"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Target, Clock, Zap } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddHabitModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (habit: { name: string; category: string; frequency: string }) => void
}

const habitCategories = [
  { id: "fitness", name: "Fitness", icon: Target, color: "text-red-400" },
  { id: "nutrition", name: "Nutrition", icon: Zap, color: "text-green-400" },
  { id: "wellness", name: "Wellness", icon: Clock, color: "text-blue-400" },
]

const frequencyOptions = [
  { id: "daily", name: "Daily", description: "Every day" },
  { id: "weekdays", name: "Weekdays", description: "Monday - Friday" },
  { id: "weekly", name: "Weekly", description: "Once per week" },
  { id: "custom", name: "Custom", description: "Set your own schedule" },
]

const suggestedHabits = {
  fitness: [
    "10,000 steps daily",
    "30-minute workout",
    "Morning stretches",
    "Post-workout protein",
    "Active recovery walk",
  ],
  nutrition: [
    "8 glasses of water",
    "Eat 5 servings of vegetables",
    "Take daily vitamins",
    "Meal prep Sunday",
    "No late-night snacking",
  ],
  wellness: [
    "8 hours of sleep",
    "10-minute meditation",
    "Journal 3 gratitudes",
    "No phone before bed",
    "Morning sunlight exposure",
  ],
}

export function AddHabitModal({ isOpen, onClose, onAdd }: AddHabitModalProps) {
  const [habitName, setHabitName] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("fitness")
  const [selectedFrequency, setSelectedFrequency] = useState("daily")
  const [showSuggestions, setShowSuggestions] = useState(true)

  const handleAdd = () => {
    if (habitName.trim()) {
      onAdd({
        name: habitName.trim(),
        category: selectedCategory,
        frequency: selectedFrequency,
      })
      // Reset form
      setHabitName("")
      setSelectedCategory("fitness")
      setSelectedFrequency("daily")
      setShowSuggestions(true)
      onClose()
    }
  }

  const selectSuggestedHabit = (habit: string) => {
    setHabitName(habit)
    setShowSuggestions(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 pb-modal-safe"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-accent/30 bg-black/90 backdrop-blur-lg flex flex-col max-h-[75vh]">
              <div className="flex items-center justify-between border-b border-accent/20 p-4 flex-shrink-0">
                <div>
                  <h3 className="font-bold text-white">Add New Habit</h3>
                  <p className="text-xs text-accent">Build consistency, one habit at a time</p>
                </div>
                <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10">
                  <X className="h-5 w-5 text-white/60" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Category Selection */}
                <div className="space-y-2">
                  <Label className="text-white">Category</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {habitCategories.map((category) => (
                      <Card
                        key={category.id}
                        className={`cursor-pointer transition-all hover:border-accent/50 ${
                          selectedCategory === category.id
                            ? "border-accent border-glow bg-accent/10"
                            : "border-white/10 bg-black/30"
                        }`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <CardContent className="p-3 text-center">
                          <category.icon
                            className={`mx-auto mb-1 h-5 w-5 ${
                              selectedCategory === category.id ? "text-accent" : category.color
                            }`}
                          />
                          <span
                            className={`text-xs ${selectedCategory === category.id ? "text-accent" : "text-white/70"}`}
                          >
                            {category.name}
                          </span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Habit Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="habit-name" className="text-white">
                    Habit Name
                  </Label>
                  <Input
                    id="habit-name"
                    value={habitName}
                    onChange={(e) => setHabitName(e.target.value)}
                    placeholder="Enter your habit..."
                    className="w-full"
                  />
                </div>

                {/* Suggested Habits */}
                {showSuggestions && habitName === "" && (
                  <div className="space-y-2">
                    <Label className="text-white">Suggested Habits</Label>
                    <div className="space-y-2">
                      {suggestedHabits[selectedCategory as keyof typeof suggestedHabits].map((habit, index) => (
                        <button
                          key={index}
                          onClick={() => selectSuggestedHabit(habit)}
                          className="w-full text-left rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white/80 transition-all hover:border-accent/50 hover:bg-accent/5"
                        >
                          {habit}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Frequency Selection */}
                <div className="space-y-2">
                  <Label className="text-white">Frequency</Label>
                  <div className="space-y-2">
                    {frequencyOptions.map((option) => (
                      <Card
                        key={option.id}
                        className={`cursor-pointer transition-all hover:border-accent/50 ${
                          selectedFrequency === option.id
                            ? "border-accent border-glow bg-accent/10"
                            : "border-white/10 bg-black/30"
                        }`}
                        onClick={() => setSelectedFrequency(option.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4
                                className={`font-medium ${
                                  selectedFrequency === option.id ? "text-accent" : "text-white"
                                }`}
                              >
                                {option.name}
                              </h4>
                              <p className="text-xs text-white/60">{option.description}</p>
                            </div>
                            {selectedFrequency === option.id && <div className="h-4 w-4 rounded-full bg-accent" />}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-accent/20 p-4 flex gap-3 flex-shrink-0">
                <ButtonGlow variant="outline-glow" onClick={onClose} className="flex-1">
                  Cancel
                </ButtonGlow>
                <ButtonGlow variant="accent-glow" onClick={handleAdd} disabled={!habitName.trim()} className="flex-1">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Habit
                </ButtonGlow>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
