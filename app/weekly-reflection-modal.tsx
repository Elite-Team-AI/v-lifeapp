"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { saveWeeklyReflection, dismissWeeklyReflection } from "@/lib/actions/weekly-reflections"

interface WeeklyReflectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WeeklyReflectionModal({ isOpen, onClose }: WeeklyReflectionModalProps) {
  const { toast } = useToast()
  const [fatigueLevel, setFatigueLevel] = useState(5)
  const [enjoymentLevel, setEnjoymentLevel] = useState(7)
  const [difficultyLevel, setDifficultyLevel] = useState(5)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const result = await saveWeeklyReflection(
        fatigueLevel,
        enjoymentLevel,
        difficultyLevel,
        notes
      )

      if (result.success) {
        toast({
          title: "Reflection saved!",
          description: "This will help personalize your VitalFlow habits.",
        })
        onClose()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save reflection",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[WeeklyReflection] Error:", error)
      toast({
        title: "Error",
        description: "Failed to save reflection",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    setSaving(true)
    try {
      await dismissWeeklyReflection()
      toast({
        title: "Skipped for now",
        description: "We'll ask again next week. You can complete reflections in Settings anytime.",
      })
      onClose()
    } catch (error) {
      console.error("[WeeklyReflection] Skip error:", error)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Weekly Reflection</DialogTitle>
          <DialogDescription>
            Help us personalize your VitalFlow habits by sharing how this week felt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Fatigue Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="fatigue">Fatigue Level</Label>
              <span className="text-sm font-medium text-muted-foreground">{fatigueLevel}/10</span>
            </div>
            <Slider
              id="fatigue"
              min={1}
              max={10}
              step={1}
              value={[fatigueLevel]}
              onValueChange={(value) => setFatigueLevel(value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very fresh</span>
              <span>Extremely tired</span>
            </div>
          </div>

          {/* Enjoyment Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="enjoyment">Enjoyment Level</Label>
              <span className="text-sm font-medium text-muted-foreground">{enjoymentLevel}/10</span>
            </div>
            <Slider
              id="enjoyment"
              min={1}
              max={10}
              step={1}
              value={[enjoymentLevel]}
              onValueChange={(value) => setEnjoymentLevel(value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Not enjoying</span>
              <span>Loving it!</span>
            </div>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <span className="text-sm font-medium text-muted-foreground">{difficultyLevel}/10</span>
            </div>
            <Slider
              id="difficulty"
              min={1}
              max={10}
              step={1}
              value={[difficultyLevel]}
              onValueChange={(value) => setDifficultyLevel(value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Too easy</span>
              <span>Too hard</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any thoughts on this week? What worked well? What was challenging?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <ButtonGlow
            variant="outline-glow"
            onClick={handleSkip}
            className="flex-1"
            isLoading={saving}
            loadingText="Skipping..."
          >
            Skip for now
          </ButtonGlow>
          <ButtonGlow
            variant="accent-glow"
            onClick={handleSubmit}
            className="flex-1"
            isLoading={saving}
            loadingText="Saving..."
          >
            Save Reflection
          </ButtonGlow>
        </div>
      </DialogContent>
    </Dialog>
  )
}

