"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ButtonGlow } from "@/components/ui/button-glow"
import { cn } from "@/lib/utils"
import type { Achievement, UserAchievement } from "@/lib/gamification/achievements"
import { ACHIEVEMENT_CATEGORY_COLORS } from "@/lib/gamification/achievements"

interface AchievementCarouselProps {
  allAchievements: Achievement[]
  unlockedAchievements: UserAchievement[]
  className?: string
}

export function AchievementCarousel({ 
  allAchievements, 
  unlockedAchievements,
  className 
}: AchievementCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievementId))
  
  // Sort: unlocked first (most recent first), then locked
  const sortedAchievements = [...allAchievements].sort((a, b) => {
    const aUnlocked = unlockedIds.has(a.id)
    const bUnlocked = unlockedIds.has(b.id)
    
    if (aUnlocked && !bUnlocked) return -1
    if (!aUnlocked && bUnlocked) return 1
    
    // If both unlocked, sort by unlock time (most recent first)
    if (aUnlocked && bUnlocked) {
      const aTime = unlockedAchievements.find(ua => ua.achievementId === a.id)?.unlockedAt
      const bTime = unlockedAchievements.find(ua => ua.achievementId === b.id)?.unlockedAt
      if (aTime && bTime) {
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      }
    }
    
    return a.sortOrder - b.sortOrder
  })

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  // Find most recently unlocked for highlight
  const mostRecentUnlock = unlockedAchievements[0]?.achievementId

  return (
    <Card className={cn("glass-card overflow-hidden", className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <h2 className="text-lg font-bold text-foreground">Achievements</h2>
            <span className="text-sm text-muted-foreground">
              ({unlockedAchievements.length}/{allAchievements.length})
            </span>
          </div>
          
          {/* Scroll controls */}
          <div className="flex gap-1">
            <ButtonGlow
              variant="ghost"
              size="sm"
              onClick={() => scroll('left')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </ButtonGlow>
            <ButtonGlow
              variant="ghost"
              size="sm"
              onClick={() => scroll('right')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </ButtonGlow>
          </div>
        </div>

        {/* Scrollable carousel */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide py-2 -mx-1 px-3"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {sortedAchievements.map((achievement, index) => {
            const isUnlocked = unlockedIds.has(achievement.id)
            const isRecent = achievement.id === mostRecentUnlock
            const userAchievement = unlockedAchievements.find(ua => ua.achievementId === achievement.id)

            return (
              <motion.div
                key={achievement.id}
                className={cn("flex-shrink-0", isRecent && "p-2 -m-2")}
                style={{ scrollSnapAlign: 'start' }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className={cn(
                    "relative w-24 h-28 rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all",
                    isUnlocked
                      ? cn(
                          "bg-gradient-to-br",
                          ACHIEVEMENT_CATEGORY_COLORS[achievement.category],
                          isRecent && "ring-2 ring-accent ring-offset-2 ring-offset-background"
                        )
                      : "bg-muted/20 border-muted/30"
                  )}
                >
                  {/* Recent unlock glow */}
                  {isRecent && (
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-accent/20"
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}

                  {/* Icon */}
                  <div className={cn(
                    "text-3xl",
                    !isUnlocked && "grayscale opacity-40"
                  )}>
                    {isUnlocked ? achievement.icon : (
                      <div className="relative">
                        <span className="blur-sm">{achievement.icon}</span>
                        <Lock className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <p className={cn(
                    "text-[10px] font-medium text-center leading-tight line-clamp-2",
                    isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {achievement.name}
                  </p>

                  {/* XP Reward badge */}
                  {achievement.xpReward > 0 && isUnlocked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-accent text-[9px] font-bold text-black"
                    >
                      +{achievement.xpReward}
                    </motion.div>
                  )}

                  {/* Unlock date for unlocked achievements */}
                  {isUnlocked && userAchievement && (
                    <p className="absolute bottom-1 text-[8px] text-muted-foreground">
                      {new Date(userAchievement.unlockedAt).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Empty state */}
        {allAchievements.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <p>Achievements coming soon!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
