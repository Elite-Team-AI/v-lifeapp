"use client"

import { motion } from "framer-motion"
import { Dumbbell, CalendarCheck, Target, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatData {
  current: number
  previous: number
  label: string
  suffix?: string
}

interface PowerStatsProps {
  workoutStreak: StatData
  nutritionScore: StatData
  habitCompletion: StatData
  className?: string
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous
  const percentChange = previous > 0 ? Math.round((diff / previous) * 100) : 0

  if (diff === 0 || previous === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span className="text-xs">—</span>
      </div>
    )
  }

  const isPositive = diff > 0

  return (
    <div className={cn(
      "flex items-center gap-1",
      isPositive ? "text-green-400" : "text-red-400"
    )}>
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span className="text-xs font-medium">
        {isPositive ? "+" : ""}{percentChange}%
      </span>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  suffix?: string
  current: number
  previous: number
  color: string
  delay: number
}

function StatCard({ icon, label, value, suffix, current, previous, color, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className={cn(
        "border-white/10 bg-black/50 backdrop-blur-sm overflow-hidden relative",
        "hover:border-white/20 transition-colors"
      )}>
        {/* Background gradient accent */}
        <div className={cn(
          "absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-20",
          color
        )} />
        
        <CardContent className="p-4 relative">
          <div className="flex items-start justify-between mb-2">
            <div className={cn("p-2 rounded-lg", color.replace("bg-", "bg-").replace("500", "500/20"))}>
              {icon}
            </div>
            <TrendIndicator current={current} previous={previous} />
          </div>
          
          <div className="space-y-0.5">
            <motion.p
              className="text-2xl font-black text-foreground"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: delay + 0.2 }}
            >
              {value}
              {suffix && <span className="text-sm font-normal text-muted-foreground ml-0.5">{suffix}</span>}
            </motion.p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function PowerStats({ workoutStreak, nutritionScore, habitCompletion, className }: PowerStatsProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      <StatCard
        icon={<Dumbbell className="h-4 w-4 text-blue-400" />}
        label={workoutStreak.label}
        value={workoutStreak.current}
        suffix={workoutStreak.suffix}
        current={workoutStreak.current}
        previous={workoutStreak.previous}
        color="bg-blue-500"
        delay={0}
      />
      
      <StatCard
        icon={<CalendarCheck className="h-4 w-4 text-green-400" />}
        label={nutritionScore.label}
        value={nutritionScore.current}
        suffix={nutritionScore.suffix}
        current={nutritionScore.current}
        previous={nutritionScore.previous}
        color="bg-green-500"
        delay={0.1}
      />
      
      <StatCard
        icon={<Target className="h-4 w-4 text-purple-400" />}
        label={habitCompletion.label}
        value={habitCompletion.current}
        suffix={habitCompletion.suffix}
        current={habitCompletion.current}
        previous={habitCompletion.previous}
        color="bg-purple-500"
        delay={0.2}
      />
    </div>
  )
}

export { PowerStats }
