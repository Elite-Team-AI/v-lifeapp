"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, RefreshCw, AlertTriangle, Dumbbell, Utensils, Target, Calendar, Zap } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card, CardContent } from "@/components/ui/card"

interface RefreshPlanModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  userName: string
}

export function RefreshPlanModal({ isOpen, onClose, onConfirm, userName }: RefreshPlanModalProps) {
  const dataToRefresh = [
    {
      icon: Dumbbell,
      title: "Workout Plans",
      description: "New exercise routines, sets, reps, and progression schedules",
      color: "text-red-400",
    },
    {
      icon: Utensils,
      title: "Nutrition Plan",
      description: "Updated meal plans, calorie targets, and macro distributions",
      color: "text-green-400",
    },
    {
      icon: Target,
      title: "Goal Adjustments",
      description: "Refined targets based on your current progress and performance",
      color: "text-blue-400",
    },
    {
      icon: Calendar,
      title: "Schedule Optimization",
      description: "Improved workout timing and rest day recommendations",
      color: "text-purple-400",
    },
    {
      icon: Zap,
      title: "AI Recommendations",
      description: "Fresh insights, tips, and personalized suggestions",
      color: "text-yellow-400",
    },
  ]

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

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
            className="w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-accent/30 bg-black/90 backdrop-blur-lg flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between border-b border-accent/20 p-4 flex-shrink-0">
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20">
                    <AlertTriangle className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Start Fresh</h3>
                    <p className="text-xs text-accent">Regenerate your entire fitness strategy</p>
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

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-center">
                  <h4 className="text-lg font-bold text-white mb-2">Hey {userName}! 👋</h4>
                  <p className="text-white/80 text-sm">
                    Our AI will analyze your current progress and generate a completely new personalized plan. This will
                    replace your existing recommendations.
                  </p>
                </div>

                <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400 mr-2" />
                    <span className="text-orange-400 font-medium text-sm">What will be updated:</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {dataToRefresh.map((item, index) => (
                    <Card key={index} className="border-white/10 bg-black/30">
                      <CardContent className="p-3">
                        <div className="flex items-start">
                          <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50">
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-white text-sm">{item.title}</h5>
                            <p className="text-xs text-white/70 mt-1">{item.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="rounded-lg border border-accent/30 bg-accent/10 p-3">
                  <div className="flex items-center mb-2">
                    <Zap className="h-4 w-4 text-accent mr-2" />
                    <span className="text-accent font-medium text-sm">What stays the same:</span>
                  </div>
                  <ul className="text-xs text-white/80 space-y-1">
                    <li>• Your profile information and preferences</li>
                    <li>• Progress tracking and historical data</li>
                    <li>• Habit streaks and achievements</li>
                    <li>• Photos and weight entries</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                  <div className="flex items-center mb-2">
                    <RefreshCw className="h-4 w-4 text-blue-400 mr-2" />
                    <span className="text-blue-400 font-medium text-sm">Why start fresh?</span>
                  </div>
                  <p className="text-xs text-white/80">
                    Based on your recent progress and performance, our AI can create more effective workouts, better
                    meal plans, and smarter recommendations tailored to your current fitness level.
                  </p>
                </div>
              </div>

              <div className="border-t border-accent/20 p-4 flex gap-3 flex-shrink-0">
                <ButtonGlow variant="outline-glow" onClick={onClose} className="flex-1">
                  Cancel
                </ButtonGlow>
                <ButtonGlow variant="accent-glow" onClick={handleConfirm} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Yes, Start Fresh
                </ButtonGlow>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
