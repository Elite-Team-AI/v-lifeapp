"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Edit2, Trash2, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createHabit, updateHabit, deleteHabit } from "@/lib/actions/habits"

interface Habit {
  id: string
  name: string
  category: string
  frequency: string
  current_streak: number
  best_streak: number
}

interface ManageHabitsModalProps {
  isOpen: boolean
  onClose: () => void
  habits: Habit[]
  onHabitsChange: () => void
}

export function ManageHabitsModal({ isOpen, onClose, habits, onHabitsChange }: ManageHabitsModalProps) {
  const { toast } = useToast()
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "fitness",
    frequency: "daily",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState("")

  useEffect(() => {
    if (!isOpen) {
      setEditingHabit(null)
      setIsAddingNew(false)
      setFormData({ name: "", category: "fitness", frequency: "daily" })
      setFormError("")
    }
  }, [isOpen])

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit)
    setFormData({
      name: habit.name,
      category: habit.category,
      frequency: habit.frequency,
    })
    setIsAddingNew(false)
    setFormError("")
  }

  const handleAddNew = () => {
    setIsAddingNew(true)
    setEditingHabit(null)
    setFormData({ name: "", category: "fitness", frequency: "daily" })
    setFormError("")
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFormError("Habit name is required")
      return
    }

    setFormError("")
    setIsSaving(true)

    try {
      let result
      if (isAddingNew) {
        result = await createHabit(formData.name, formData.category, formData.frequency)
        if (result && result.success) {
          toast({
            title: "Success",
            description: "Habit created successfully",
          })
          await onHabitsChange()
          setIsAddingNew(false)
          setFormData({ name: "", category: "fitness", frequency: "daily" })
        } else {
          const errorMessage = result?.error || "Failed to create habit"
          console.error("[ManageHabits] Failed to create habit:", errorMessage)
          setFormError(errorMessage)
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          })
        }
      } else if (editingHabit) {
        result = await updateHabit(editingHabit.id, formData.name, formData.category, formData.frequency)
        if (result && result.success) {
          toast({
            title: "Success",
            description: "Habit updated successfully",
          })
          await onHabitsChange()
          setEditingHabit(null)
          setFormData({ name: "", category: "fitness", frequency: "daily" })
        } else {
          const errorMessage = result?.error || "Failed to update habit"
          console.error("[ManageHabits] Failed to update habit:", errorMessage)
          setFormError(errorMessage)
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          })
        }
      } else {
        console.error("[ManageHabits] Invalid state: neither adding nor editing")
        toast({
          title: "Error",
          description: "Invalid operation state",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save habit"
      console.error("[ManageHabits] Error saving habit:", error)
      setFormError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (habitId: string) => {
    if (!confirm("Are you sure you want to delete this habit? This will also delete all associated logs.")) {
      return
    }

    try {
      const result = await deleteHabit(habitId)
      if (result.success) {
        toast({
          title: "Success",
          description: "Habit deleted successfully",
        })
        onHabitsChange()
        setEditingHabit(null)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete habit",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error deleting habit:", error)
      toast({
        title: "Error",
        description: "Failed to delete habit",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setEditingHabit(null)
    setIsAddingNew(false)
    setFormData({ name: "", category: "fitness", frequency: "daily" })
    setFormError("")
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-lg"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 500 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-accent/30 bg-black/90 backdrop-blur-lg h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-accent/20 p-4 flex-shrink-0">
              <div className="flex items-center">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                  <Edit2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Manage Habits</h2>
                  <p className="text-sm text-accent">Add, edit, or remove your habits</p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {(isAddingNew || editingHabit) && (
                <Card className="mb-4 border-accent/30 bg-accent/5 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-accent">
                    {isAddingNew ? "Add New Habit" : "Edit Habit"}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="habit-name" className="text-white">
                        Habit Name
                      </Label>
                      <Input
                        id="habit-name"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value })
                          if (formError) setFormError("")
                        }}
                        placeholder="e.g., Morning Meditation"
                        className={`mt-1 bg-black/50 border-white/20 text-white ${formError ? "border-red-500" : ""}`}
                      />
                      {formError && <p className="mt-1 text-xs text-red-400">{formError}</p>}
                    </div>
                    <div>
                      <Label htmlFor="habit-category" className="text-white">
                        Category
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className="mt-1 bg-black/50 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fitness">Fitness</SelectItem>
                          <SelectItem value="nutrition">Nutrition</SelectItem>
                          <SelectItem value="wellness">Wellness</SelectItem>
                          <SelectItem value="mindfulness">Mindfulness</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="habit-frequency" className="text-white">
                        Frequency
                      </Label>
                      <Select
                        value={formData.frequency}
                        onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                      >
                        <SelectTrigger className="mt-1 bg-black/50 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <ButtonGlow
                        variant="accent-glow"
                        size="sm"
                        onClick={handleSave}
                        isLoading={isSaving}
                        loadingText="Saving..."
                        className="flex-1"
                      >
                        <Save className="mr-1 h-4 w-4" />
                        Save
                      </ButtonGlow>
                      <ButtonGlow variant="outline-glow" size="sm" onClick={handleCancel} disabled={isSaving} className="flex-1">
                        Cancel
                      </ButtonGlow>
                    </div>
                  </div>
                </Card>
              )}

              {!isAddingNew && !editingHabit && (
                <ButtonGlow variant="accent-glow" size="sm" onClick={handleAddNew} className="mb-4 w-full">
                  <Plus className="mr-1 h-4 w-4" />
                  Add New Habit
                </ButtonGlow>
              )}

              <div className="space-y-2">
                {habits.length === 0 ? (
                  <Card className="border-white/10 bg-black/50 p-4 text-center">
                    <p className="text-white/70">No habits yet. Add your first habit to get started!</p>
                  </Card>
                ) : (
                  habits.map((habit) => (
                    <motion.div
                      key={habit.id}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Card
                        className={`border-white/10 bg-black/50 p-3 ${editingHabit?.id === habit.id ? "border-accent/50" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{habit.name}</h4>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-white/60">
                              <span className="capitalize">{habit.category}</span>
                              <span>•</span>
                              <span className="capitalize">{habit.frequency}</span>
                              <span>•</span>
                              <span>{habit.current_streak} day streak</span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <motion.button
                              onClick={() => handleEdit(habit)}
                              className="rounded-full p-2.5 text-accent transition-colors hover:bg-accent/10 active:bg-accent/20 min-w-[40px] min-h-[40px] flex items-center justify-center"
                              whileTap={{ scale: 0.9 }}
                              whileHover={{ scale: 1.05 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(habit.id)}
                              className="rounded-full p-2.5 text-red-400 transition-colors hover:bg-red-500/10 active:bg-red-500/20 min-w-[40px] min-h-[40px] flex items-center justify-center"
                              whileTap={{ scale: 0.9 }}
                              whileHover={{ scale: 1.05 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
