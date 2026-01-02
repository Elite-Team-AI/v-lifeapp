"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Check, 
  X, 
  Loader2, 
  Zap,
  Clock,
  ChevronRight,
  Trophy,
  Info
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { XP_REWARDS } from "@/lib/gamification"
import {
  updateSuggestionStatus,
  logHabitEvent,
  type VitalFlowSuggestion,
} from "@/lib/actions/vitalflow-habits"
import { addXP } from "@/lib/actions/gamification"

const categoryIcons: Record<string, string> = {
  movement: "🏃",
  nutrition: "🥗",
  sleep: "😴",
  mindset: "🧠",
  recovery: "💆",
  hydration: "💧",
}

const categoryColors: Record<string, string> = {
  movement: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  nutrition: "from-green-500/20 to-emerald-500/20 border-green-500/30",
  sleep: "from-purple-500/20 to-indigo-500/20 border-purple-500/30",
  mindset: "from-pink-500/20 to-rose-500/20 border-pink-500/30",
  recovery: "from-orange-500/20 to-amber-500/20 border-orange-500/30",
  hydration: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
}

interface DailyMissionsProps {
  missions: VitalFlowSuggestion[]
  onMissionComplete?: (mission: VitalFlowSuggestion, xpEarned: number) => void
  className?: string
}

export function DailyMissions({ missions: initialMissions, onMissionComplete, className }: DailyMissionsProps) {
  const { toast } = useToast()
  const [missions, setMissions] = useState(initialMissions)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [celebratingId, setCelebratingId] = useState<string | null>(null)
  const [showInfoModal, setShowInfoModal] = useState(false)

  const activeMissions = missions.filter(m => m.status === 'suggested' || m.status === 'accepted')
  const completedMissions = missions.filter(m => m.status === 'completed')
  const completedCount = completedMissions.length
  const totalCount = missions.length
  const allComplete = totalCount > 0 && completedCount === totalCount

  // Calculate XP for a mission based on energy
  const getMissionXP = (mission: VitalFlowSuggestion): number => {
    if (mission.energy_delta_kcal > 50) {
      return XP_REWARDS.mission_complete_bonus
    }
    return XP_REWARDS.mission_complete
  }

  const handleAccept = async (mission: VitalFlowSuggestion) => {
    setProcessingId(mission.id)
    try {
      const result = await updateSuggestionStatus(mission.id, 'accepted')
      if (result.success) {
        setMissions(prev =>
          prev.map(m => m.id === mission.id ? { ...m, status: 'accepted' } : m)
        )
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to accept mission",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[DailyMissions] Error accepting:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleSkip = async (mission: VitalFlowSuggestion) => {
    setProcessingId(mission.id)
    try {
      const result = await updateSuggestionStatus(mission.id, 'skipped', "Not today")
      if (result.success) {
        setMissions(prev =>
          prev.map(m => m.id === mission.id ? { ...m, status: 'skipped' } : m)
        )
        toast({
          title: "Mission skipped",
          description: "No worries, focus on what matters!",
        })
      }
    } catch (error) {
      console.error("[DailyMissions] Error skipping:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleComplete = async (mission: VitalFlowSuggestion) => {
    setProcessingId(mission.id)
    setCelebratingId(mission.id)
    
    try {
      const result = await updateSuggestionStatus(mission.id, 'completed', undefined, 1.0)
      
      if (result.success) {
        await logHabitEvent(mission.id, 'completed', 1.0)
        
        // Award XP
        const xpEarned = getMissionXP(mission)
        await addXP('mission_complete', mission.id, 'vitalflow_suggestion', xpEarned, {
          mission_title: mission.title,
          category: mission.category
        })
        
        setMissions(prev =>
          prev.map(m => m.id === mission.id ? { ...m, status: 'completed', completion_ratio: 1.0 } : m)
        )
        
        toast({
          title: `+${xpEarned} XP! 🎉`,
          description: `Mission "${mission.title}" complete!`,
        })
        
        onMissionComplete?.(mission, xpEarned)
        
        // Check if all missions are now complete
        const newCompletedCount = missions.filter(m => 
          m.id === mission.id || m.status === 'completed'
        ).length
        
        if (newCompletedCount === totalCount && totalCount > 0) {
          // All missions complete bonus!
          setTimeout(async () => {
            await addXP('all_missions_complete', undefined, 'daily_bonus', XP_REWARDS.all_missions_complete)
            toast({
              title: `BONUS: +${XP_REWARDS.all_missions_complete} XP! 🏆`,
              description: "All daily missions complete!",
            })
          }, 1500)
        }
      }
    } catch (error) {
      console.error("[DailyMissions] Error completing:", error)
    } finally {
      setProcessingId(null)
      setTimeout(() => setCelebratingId(null), 2000)
    }
  }

  const totalXPAvailable = activeMissions.reduce((sum, m) => sum + getMissionXP(m), 0)
  const xpEarnedToday = completedMissions.reduce((sum, m) => sum + getMissionXP(m), 0)

  return (
    <Card className={cn("glass-card overflow-hidden", className)}>
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/10 to-transparent rounded-bl-full pointer-events-none" />
      
      <CardContent className="p-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <Trophy className="h-5 w-5 text-accent" />
            </motion.div>
            <h2 className="text-lg font-bold text-foreground">Daily Missions</h2>
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-1 rounded-full hover:bg-accent/10 transition-colors"
              aria-label="What are Daily Missions?"
            >
              <Info className="h-4 w-4 text-muted-foreground hover:text-accent" />
            </button>
          </div>
          
          {/* XP Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
            <Zap className="h-4 w-4 text-accent" />
            <span className="text-sm font-bold text-accent">
              {xpEarnedToday > 0 && `+${xpEarnedToday}`}
              {xpEarnedToday > 0 && totalXPAvailable > 0 && " / "}
              {totalXPAvailable > 0 && `${totalXPAvailable + xpEarnedToday} XP`}
              {totalXPAvailable === 0 && xpEarnedToday === 0 && "0 XP"}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {completedCount}/{totalCount} missions
            </span>
            {allComplete && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-accent font-semibold"
              >
                All Complete! 🎉
              </motion.span>
            )}
          </div>
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent via-yellow-400 to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / Math.max(totalCount, 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Missions List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {activeMissions.length === 0 && totalCount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <Trophy className="h-12 w-12 text-accent mx-auto mb-3" />
                <p className="text-lg font-semibold text-foreground mb-1">All Missions Complete!</p>
                <p className="text-sm text-muted-foreground">Amazing work today! 🏆</p>
              </motion.div>
            )}

            {activeMissions.map((mission, index) => {
              const isProcessing = processingId === mission.id
              const isCelebrating = celebratingId === mission.id
              const xpReward = getMissionXP(mission)

              return (
                <motion.div
                  key={mission.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: isCelebrating ? [1, 1.02, 1] : 1
                  }}
                  exit={{ opacity: 0, x: -100, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "relative rounded-xl border bg-gradient-to-br p-4",
                    categoryColors[mission.category],
                    isCelebrating && "ring-2 ring-accent ring-offset-2 ring-offset-background"
                  )}
                >
                  {/* Celebration particles */}
                  {isCelebrating && (
                    <>
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 rounded-full bg-accent"
                          initial={{ 
                            top: "50%", 
                            left: "50%",
                            scale: 0 
                          }}
                          animate={{ 
                            top: `${20 + Math.random() * 60}%`,
                            left: `${10 + Math.random() * 80}%`,
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0]
                          }}
                          transition={{ duration: 0.8, delay: i * 0.05 }}
                        />
                      ))}
                    </>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div className="text-2xl flex-shrink-0">
                      {categoryIcons[mission.category]}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground text-sm truncate pr-2">
                          {mission.title}
                        </h3>
                        {/* XP Reward Badge */}
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 flex-shrink-0">
                          <Zap className="h-3 w-3 text-accent" />
                          <span className="text-xs font-bold text-accent">+{xpReward}</span>
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{mission.time_minutes} min</span>
                        </div>
                        {mission.status === 'accepted' && (
                          <span className="text-accent font-medium">Ready to complete</span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {mission.status === 'suggested' && (
                          <>
                            <ButtonGlow
                              variant="accent-glow"
                              size="sm"
                              onClick={() => handleAccept(mission)}
                              disabled={isProcessing}
                              className="flex-1 h-8 text-xs"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Accept
                                </>
                              )}
                            </ButtonGlow>
                            <ButtonGlow
                              variant="outline-glow"
                              size="sm"
                              onClick={() => handleSkip(mission)}
                              disabled={isProcessing}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-3 w-3" />
                            </ButtonGlow>
                          </>
                        )}
                        
                        {mission.status === 'accepted' && (
                          <ButtonGlow
                            variant="accent-glow"
                            size="sm"
                            onClick={() => handleComplete(mission)}
                            disabled={isProcessing}
                            className="w-full h-9 text-sm font-semibold"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Complete Mission
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </>
                            )}
                          </ButtonGlow>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Completed missions summary */}
        {completedCount > 0 && activeMissions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 pt-4 border-t border-border/50"
          >
            <p className="text-sm text-muted-foreground text-center">
              ✅ {completedCount} mission{completedCount !== 1 ? 's' : ''} completed today
            </p>
          </motion.div>
        )}
      </CardContent>
      
      {/* Info Modal */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="max-w-md bg-black/95 border-accent/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              What are Daily Missions?
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Your personalized daily wellness challenges
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="font-semibold text-accent mb-1">🎯 Personalized Goals</p>
              <p className="text-white/70">
                Daily Missions are AI-generated tasks tailored to your fitness goals, schedule, and preferences.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="font-semibold text-accent mb-1">⚡ Earn XP</p>
              <p className="text-white/70">
                Complete missions to earn XP (experience points). The more you complete, the more you level up!
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="font-semibold text-accent mb-1">🔥 Build Streaks</p>
              <p className="text-white/70">
                Consistent mission completion builds your streak and unlocks bonus XP rewards.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="font-semibold text-accent mb-1">🏆 All Complete Bonus</p>
              <p className="text-white/70">
                Complete all daily missions for a special bonus of +{XP_REWARDS.all_missions_complete} XP!
              </p>
            </div>
          </div>
          <ButtonGlow 
            variant="accent-glow" 
            className="w-full mt-2"
            onClick={() => setShowInfoModal(false)}
          >
            Got it!
          </ButtonGlow>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
