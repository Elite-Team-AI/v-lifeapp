"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { updateProfile } from "@/lib/actions/profile"
import { useAppData } from "@/lib/contexts/app-data-context"
import { useToast } from "@/hooks/use-toast"

export function FitnessSection() {
  const { appData, refresh } = useAppData()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)

  const visualCoachEnabled = appData?.profile?.visual_coach_enabled || false

  const handleToggleVisualCoach = async () => {
    setIsUpdating(true)
    try {
      const result = await updateProfile({
        visual_coach_enabled: !visualCoachEnabled
      })

      if (result.success) {
        toast({
          title: visualCoachEnabled ? "Visual AI Coach Disabled" : "Visual AI Coach Enabled",
          description: visualCoachEnabled
            ? "Visual AI Coach has been removed from your Fitness page"
            : "Visual AI Coach is now available on your Fitness page",
        })
        // Refresh app data to get updated profile
        await refresh()
      } else {
        throw new Error(result.error || "Failed to update preference")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update visual coach preference",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <AccordionItem value="fitness" className="border-white/10 rounded-lg bg-black/30 backdrop-blur-sm">
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex items-center gap-2 text-lg font-bold text-white">
          <Sparkles className="h-5 w-5 text-yellow-400" />
          Fitness Features
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-3 pt-2">
          <Card
            className={`p-4 cursor-pointer transition-all ${
              visualCoachEnabled
                ? "border-yellow-500 bg-yellow-500/10"
                : "border-white/10 bg-white/5 hover:border-yellow-500/50 hover:bg-white/10"
            } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={isUpdating ? undefined : handleToggleVisualCoach}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${visualCoachEnabled ? 'bg-yellow-500/20' : 'bg-white/10'}`}>
                <Sparkles className={`w-5 h-5 ${visualCoachEnabled ? 'text-yellow-400' : 'text-white/60'}`} />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${visualCoachEnabled ? 'text-yellow-400' : 'text-white'}`}>
                  V-Life Visual AI Coach
                </p>
                <p className="text-xs text-white/60 mt-1">
                  AI tracks your form, reps, and calories burned in real time—privately on your device
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                visualCoachEnabled ? 'border-yellow-500 bg-yellow-500' : 'border-white/30'
              }`}>
                {visualCoachEnabled && (
                  <div className="w-2 h-2 rounded-full bg-black" />
                )}
              </div>
            </div>
          </Card>
          <p className="text-white/50 text-xs">
            {visualCoachEnabled
              ? "The Visual AI Coach will appear on your Fitness page"
              : "Enable to access the Visual AI Coach on your Fitness page"}
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
