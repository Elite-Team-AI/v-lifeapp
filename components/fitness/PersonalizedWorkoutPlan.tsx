"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Calendar,
  Clock,
  Dumbbell,
  Target,
  TrendingUp,
  CheckCircle2,
  Circle,
  Play,
  SkipForward,
  Pause,
  RefreshCw,
  Zap,
  Award,
} from "lucide-react"
import type { WorkoutPlanDetails } from "@/lib/actions/personalized-workouts"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"

interface PersonalizedWorkoutPlanProps {
  plan: WorkoutPlanDetails | null
  isLoading?: boolean
  onStartWorkout?: (workoutId: string) => void
  onSkipWorkout?: (workoutId: string) => void
  onPausePlan?: () => void
  onRegeneratePlan?: () => void
}

export function PersonalizedWorkoutPlan({
  plan,
  isLoading,
  onStartWorkout,
  onSkipWorkout,
  onPausePlan,
  onRegeneratePlan,
}: PersonalizedWorkoutPlanProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>([`week-${plan?.currentWeek || 1}`])

  if (isLoading) {
    return <PersonalizedWorkoutPlanSkeleton />
  }

  if (!plan) {
    return (
      <Card className="border-white/10 backdrop-blur-xl bg-white/5">
        <CardHeader className="text-center py-12">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center">
            <Dumbbell className="h-8 w-8 text-accent" />
          </div>
          <CardTitle className="text-2xl text-white">No Active Plan</CardTitle>
          <CardDescription className="text-white/70 max-w-md mx-auto mt-2">
            Generate your personalized workout plan to get started with AI-powered training tailored to your goals and
            equipment.
          </CardDescription>
          <div className="mt-2 text-xs text-white/50 max-w-md mx-auto">
            <p>Debug info: Check browser console for detailed logs</p>
            <p>If you recently generated a plan and it's not showing, check the console logs for any errors.</p>
          </div>
          <div className="mt-6">
            <Button onClick={onRegeneratePlan} size="lg" className="bg-accent hover:bg-accent/90">
              <Zap className="h-4 w-4 mr-2" />
              Generate My Plan
            </Button>
          </div>
        </CardHeader>
      </Card>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const todaysWorkout = plan.weeks
    .flatMap(week => week.workouts)
    .find(workout => workout.scheduledDate === today)

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <Card className="border-white/10 backdrop-blur-xl bg-white/5">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                {plan.planName}
                <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
                  {plan.planType}
                </Badge>
              </CardTitle>
              <CardDescription className="text-white/70">
                {plan.splitPattern} • {plan.daysPerWeek} days per week
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {plan.status === 'active' ? (
                <Button variant="outline" size="sm" onClick={onPausePlan} className="border-white/10">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={onPausePlan} className="border-white/10">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onRegeneratePlan} className="border-white/10">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Overview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">Week {plan.currentWeek} of 4</span>
              <span className="text-white font-medium">{plan.progressPercentage}%</span>
            </div>
            <Progress value={plan.progressPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>{format(parseISO(plan.startDate), 'MMM d, yyyy')}</span>
              <span>{format(parseISO(plan.endDate), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <Calendar className="h-3 w-3" />
                Weeks Left
              </div>
              <div className="text-2xl font-bold text-white">{plan.weeksRemaining}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <Target className="h-3 w-3" />
                Current Week
              </div>
              <div className="text-2xl font-bold text-white">{plan.currentWeek}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <TrendingUp className="h-3 w-3" />
                Progress
              </div>
              <div className="text-2xl font-bold text-accent">{plan.progressPercentage}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Workout Highlight */}
      {todaysWorkout && (
        <Card className="border-accent/30 backdrop-blur-xl bg-gradient-to-br from-accent/10 to-accent/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  Today's Workout
                </CardTitle>
                <CardDescription className="text-white/70 mt-1">
                  {todaysWorkout.workoutName}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {todaysWorkout.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => onStartWorkout?.(todaysWorkout.id)}
                      className="bg-accent hover:bg-accent/90"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Workout
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSkipWorkout?.(todaysWorkout.id)}
                      className="text-white/70 hover:text-white"
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip
                    </Button>
                  </>
                )}
                {todaysWorkout.status === 'completed' && (
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {todaysWorkout.estimatedDuration} min
              </div>
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                {todaysWorkout.exercises.length} exercises
              </div>
              <div className="flex items-center gap-1">
                {todaysWorkout.focusAreas.slice(0, 3).map((area, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs border-white/10">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Breakdown */}
      <Card className="border-white/10 backdrop-blur-xl bg-white/5">
        <CardHeader>
          <CardTitle className="text-xl text-white">4-Week Mesocycle</CardTitle>
          <CardDescription className="text-white/70">
            Progressive training plan with built-in deload week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" value={expandedWeeks} onValueChange={setExpandedWeeks}>
            {plan.weeks.map((week, weekIdx) => {
              const isCurrentWeek = week.weekNumber === plan.currentWeek
              const completedWorkouts = week.workouts.filter(w => w.status === 'completed').length
              const totalWorkouts = week.workouts.length
              const weekProgress = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0

              return (
                <AccordionItem key={week.weekNumber} value={`week-${week.weekNumber}`} className="border-white/10">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center font-bold",
                            isCurrentWeek
                              ? "bg-accent/20 text-accent"
                              : weekProgress === 100
                                ? "bg-green-500/20 text-green-400"
                                : "bg-white/10 text-white/70"
                          )}
                        >
                          {week.weekNumber}
                        </div>
                        <div className="text-left">
                          <div className="text-white font-medium flex items-center gap-2">
                            Week {week.weekNumber}
                            {isCurrentWeek && (
                              <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30 text-xs">
                                Current
                              </Badge>
                            )}
                            {week.weekNumber === 4 && (
                              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                Deload
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-white/50">
                            {completedWorkouts} of {totalWorkouts} workouts completed
                          </div>
                        </div>
                      </div>
                      {weekProgress > 0 && (
                        <div className="flex items-center gap-2">
                          <Progress value={weekProgress} className="w-24 h-2" />
                          <span className="text-sm text-white/70 min-w-[3ch]">{Math.round(weekProgress)}%</span>
                        </div>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-3 pt-2">
                      {week.workouts.map((workout, workoutIdx) => (
                        <WorkoutCard
                          key={workout.id}
                          workout={workout}
                          weekNumber={week.weekNumber}
                          onStartWorkout={onStartWorkout}
                          onSkipWorkout={onSkipWorkout}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}

// ========================
// WORKOUT CARD COMPONENT
// ========================

interface WorkoutCardProps {
  workout: WorkoutPlanDetails['weeks'][0]['workouts'][0]
  weekNumber: number
  onStartWorkout?: (workoutId: string) => void
  onSkipWorkout?: (workoutId: string) => void
}

function WorkoutCard({ workout, weekNumber, onStartWorkout, onSkipWorkout }: WorkoutCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isToday = workout.scheduledDate === new Date().toISOString().split('T')[0]
  const isPast = new Date(workout.scheduledDate) < new Date()
  const completedExercises = workout.exercises.filter(ex => ex.isCompleted).length

  const statusConfig = {
    completed: { icon: CheckCircle2, color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30' },
    in_progress: { icon: Play, color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30' },
    skipped: { icon: SkipForward, color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30' },
    pending: { icon: Circle, color: 'text-white/40', bgColor: 'bg-white/5', borderColor: 'border-white/10' },
  }

  const status = statusConfig[workout.status]
  const StatusIcon = status.icon

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all",
        isToday ? "border-accent/50 bg-accent/5" : "border-white/10 bg-white/5"
      )}
    >
      <div className="space-y-3">
        {/* Workout Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", status.bgColor)}>
              <StatusIcon className={cn("h-4 w-4", status.color)} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-white font-medium">{workout.workoutName}</h4>
                {isToday && (
                  <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30 text-xs">
                    Today
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-white/70">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(parseISO(workout.scheduledDate), 'MMM d')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {workout.estimatedDuration} min
                </span>
                <span className="flex items-center gap-1">
                  <Dumbbell className="h-3 w-3" />
                  {workout.exercises.length} exercises
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {workout.status === 'pending' && (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => onStartWorkout?.(workout.id)} className="bg-accent hover:bg-accent/90">
                <Play className="h-3 w-3 mr-1" />
                Start
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSkipWorkout?.(workout.id)}
                className="text-white/70 hover:text-white"
              >
                Skip
              </Button>
            </div>
          )}
        </div>

        {/* Focus Areas */}
        {workout.focusAreas.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {workout.focusAreas.map((area, idx) => (
              <Badge key={idx} variant="outline" className="text-xs border-white/10 capitalize">
                {area}
              </Badge>
            ))}
          </div>
        )}

        {/* Exercise List (Expandable) */}
        {workout.exercises.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white/70 hover:text-white p-0 h-auto"
            >
              {isExpanded ? '− Hide' : '+ View'} {workout.exercises.length} exercises
              {completedExercises > 0 && ` (${completedExercises} completed)`}
            </Button>

            {isExpanded && (
              <div className="space-y-2 pl-4 border-l border-white/10">
                {workout.exercises.map((exercise, idx) => (
                  <div key={exercise.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {exercise.isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : (
                        <Circle className="h-4 w-4 text-white/40" />
                      )}
                      <span className="text-white">{exercise.exerciseName}</span>
                      <Badge variant="outline" className="text-xs border-white/10 capitalize">
                        {exercise.category}
                      </Badge>
                    </div>
                    <span className="text-white/50 font-mono">
                      {exercise.targetSets} × {exercise.targetRepsMin}
                      {exercise.targetRepsMax !== exercise.targetRepsMin && `-${exercise.targetRepsMax}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ========================
// LOADING SKELETON
// ========================

function PersonalizedWorkoutPlanSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border-white/10 backdrop-blur-xl bg-white/5">
        <CardHeader>
          <Skeleton className="h-8 w-64 bg-white/10" />
          <Skeleton className="h-4 w-48 bg-white/10 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-2 w-full bg-white/10" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16 bg-white/10" />
            <Skeleton className="h-16 bg-white/10" />
            <Skeleton className="h-16 bg-white/10" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-white/10 backdrop-blur-xl bg-white/5">
        <CardHeader>
          <Skeleton className="h-6 w-48 bg-white/10" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20 w-full bg-white/10" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
