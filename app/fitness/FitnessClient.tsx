"use client"

import { useState, useEffect, Suspense, lazy } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dumbbell,
  Sparkles,
  BarChart3,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  MapPin,
  Target,
  User,
  Zap,
  Trophy,
  Activity,
  CheckCircle,
  Award,
  Edit2,
  X,
  Check
} from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton-loaders"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/hooks/use-auth"
import { useAppData } from "@/lib/contexts/app-data-context"
import { useToast } from "@/hooks/use-toast"
import { toast } from "@/components/ui/use-toast"
import { updateProfile } from "@/lib/actions/profile"

// Lazy load components
const WorkoutPlanGeneratorModal = lazy(() =>
  import("@/app/workout-plan-generator-modal").then((mod) => ({ default: mod.WorkoutPlanGeneratorModal }))
)
const WorkoutSession = lazy(() =>
  import("@/components/workout-session").then((mod) => ({ default: mod.WorkoutSession }))
)
const PersonalizedWorkoutPlan = lazy(() =>
  import("@/components/personalized-workout-plan").then((mod) => ({ default: mod.PersonalizedWorkoutPlan }))
)

type Tab = 'workouts' | 'analytics' | 'progress'

// Comprehensive list of common gym equipment
const COMMON_EQUIPMENT = [
  // Free Weights
  'Dumbbells',
  'Barbell',
  'Kettlebell',
  'Weight Plates',
  'EZ Curl Bar',
  'Trap Bar',

  // Machines
  'Cable Machine',
  'Smith Machine',
  'Leg Press',
  'Leg Curl Machine',
  'Leg Extension',
  'Lat Pulldown',
  'Seated Row',
  'Chest Press Machine',
  'Shoulder Press Machine',
  'Pec Fly Machine',

  // Cardio Equipment
  'Treadmill',
  'Stationary Bike',
  'Rowing Machine',
  'Elliptical',
  'Stair Climber',
  'Assault Bike',

  // Functional Training
  'Pull-up Bar',
  'Dip Station',
  'Suspension Trainer (TRX)',
  'Medicine Ball',
  'Slam Ball',
  'Wall Ball',
  'Battle Ropes',
  'Plyo Box',
  'Agility Ladder',
  'Speed Parachute',

  // Resistance & Bands
  'Resistance Bands',
  'Resistance Loops',
  'Resistance Tubes',

  // Core & Flexibility
  'Ab Wheel',
  'Exercise Ball (Stability Ball)',
  'Foam Roller',
  'Yoga Mat',
  'Bosu Ball',

  // Bodyweight
  'Gymnastics Rings',
  'Parallettes',
  'Push-up Bars',

  // Other
  'Bench (Flat/Incline/Decline)',
  'Squat Rack',
  'Power Rack',
  'Sandbag',
  'Weighted Vest',
  'Ankle Weights',
  'Wrist Weights',
  'Jump Rope',
  'Glute Ham Developer (GHD)',
]

export function FitnessClient() {
  const router = useRouter()
  const { user } = useAuth()
  const { appData } = useAppData()
  const [activeTab, setActiveTab] = useState<Tab>('workouts')
  const [showPlanGenerator, setShowPlanGenerator] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefreshPlan = () => {
    setRefreshKey(prev => prev + 1)
  }

  const tabs = [
    { id: 'workouts' as Tab, label: 'Workouts', icon: Dumbbell },
    { id: 'analytics' as Tab, label: 'Analytics', icon: BarChart3 },
    { id: 'progress' as Tab, label: 'Progress', icon: TrendingUp },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5"
      >
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <Dumbbell className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Fitness</h1>
                <p className="text-xs text-neutral-400">AI-Powered Workouts</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold'
                      : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'workouts' && (
            <WorkoutsTab
              key="workouts"
              refreshKey={refreshKey}
              onRefresh={handleRefreshPlan}
              onOpenGenerator={() => setShowPlanGenerator(true)}
            />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsTab key="analytics" />
          )}
          {activeTab === 'progress' && (
            <ProgressTab key="progress" />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Modals */}
      <Suspense fallback={null}>
        {showPlanGenerator && (
          <WorkoutPlanGeneratorModal
            isOpen={showPlanGenerator}
            onClose={() => {
              setShowPlanGenerator(false)
              handleRefreshPlan()
            }}
          />
        )}
      </Suspense>
    </div>
  )
}

// Workouts Tab Component
function WorkoutsTab({
  refreshKey,
  onRefresh,
  onOpenGenerator
}: {
  refreshKey: number
  onRefresh: () => void
  onOpenGenerator: () => void
}) {
  const router = useRouter()
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null)

  // Show workout session if a workout is selected
  if (selectedWorkout) {
    return (
      <Suspense fallback={<WorkoutSessionSkeleton />}>
        <WorkoutSession
          workout={selectedWorkout}
          onComplete={() => {
            setSelectedWorkout(null)
            onRefresh()
          }}
          onCancel={() => {
            setSelectedWorkout(null)
            onRefresh()
          }}
        />
      </Suspense>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Access Reborn Visual AI Coach Card */}
      <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/20">
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                Reborn Visual AI Coach
              </h3>
              <p className="text-sm text-neutral-300 mb-4">
                Corrects form. And counts reps.
              </p>
              <p className="text-xs text-neutral-400 mb-4">
                AI tracks your form, reps, and calories burned in real time—so you train smarter,
                avoid injury, and see real results, all privately on your device.
              </p>
              <ButtonGlow
                onClick={() => router.push("/ai-coach")}
                className="gap-2 bg-yellow-500 hover:bg-yellow-400 text-black w-full"
                size="sm"
              >
                <Sparkles className="w-4 h-4" />
                Access Reborn Visual AI Coach
              </ButtonGlow>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalized Workout Plan Component */}
      <Suspense fallback={<WorkoutPlanSkeleton />}>
        <PersonalizedWorkoutPlan
          key={refreshKey}
          onStartWorkout={(workout) => setSelectedWorkout(workout)}
        />
      </Suspense>

      {/* Your Fitness Profile */}
      <FitnessProfileSection />

      {/* How AI Workouts Work */}
      <HowAIWorksSection />
    </motion.div>
  )
}

// Analytics Tab Component
function AnalyticsTab() {
  const { user } = useAuth()
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([])
  const [personalRecords, setPersonalRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchAnalyticsData()
    }
  }, [user?.id])

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)

      // Fetch workout logs and PRs in parallel
      const [logsRes, prsRes] = await Promise.all([
        fetch(`/api/workouts/logs?userId=${user?.id}&limit=10`),
        fetch(`/api/workouts/personal-records?userId=${user?.id}&limit=10`)
      ])

      const logsData = await logsRes.json()
      const prsData = await prsRes.json()

      setWorkoutLogs(logsData.logs || [])
      setPersonalRecords(prsData.records || [])
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Overview Stats */}
      <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <BarChart3 className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Performance Overview</h3>
              <p className="text-xs text-neutral-400">Last 30 days</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">
                {workoutLogs.length}
              </div>
              <div className="text-xs text-neutral-400 mt-1">Workouts Completed</div>
            </div>
            <div className="bg-neutral-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">
                {personalRecords.length}
              </div>
              <div className="text-xs text-neutral-400 mt-1">Personal Records</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Records */}
      <Card className="bg-neutral-900/50 border-white/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Trophy className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Personal Records</h3>
              <p className="text-xs text-neutral-400">Your best lifts and performances</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : personalRecords.length > 0 ? (
            <div className="space-y-3">
              {personalRecords.map((pr: any, index: number) => (
                <div
                  key={pr.id || index}
                  className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Trophy className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {pr.exercise_name || pr.exerciseName}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {new Date(pr.achieved_at || pr.achievedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-400">
                      {pr.weight ? `${pr.weight}kg` : pr.value}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {pr.reps ? `${pr.reps} reps` : pr.metric}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">No personal records yet</p>
              <p className="text-xs text-neutral-500 mt-1">
                Complete workouts to track your best performances
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Workouts */}
      <Card className="bg-neutral-900/50 border-white/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Dumbbell className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Workout History</h3>
              <p className="text-xs text-neutral-400">Your recent training sessions</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : workoutLogs.length > 0 ? (
            <div className="space-y-3">
              {workoutLogs.map((log: any, index: number) => (
                <div
                  key={log.id || index}
                  className="p-4 bg-neutral-800/50 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {log.workout_name || log.workoutName || 'Workout'}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {new Date(log.completed_at || log.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-cyan-400">
                        {log.duration ? `${log.duration} min` : 'Completed'}
                      </p>
                    </div>
                  </div>

                  {log.exercises_completed && (
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-2">
                      <Zap className="w-3 h-3" />
                      <span>{log.exercises_completed} exercises</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Dumbbell className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">No workout history yet</p>
              <p className="text-xs text-neutral-500 mt-1">
                Start your first workout to see analytics
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Volume Trends Placeholder */}
      <Card className="bg-neutral-900/50 border-white/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Volume Trends</h3>
              <p className="text-xs text-neutral-400">Training volume over time</p>
            </div>
          </div>

          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <p className="text-sm text-neutral-400">Volume charts coming soon</p>
            <p className="text-xs text-neutral-500 mt-1">
              Track your weekly training volume and progression
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Progress Tab Component
function ProgressTab() {
  const { user } = useAuth()
  const [personalRecords, setPersonalRecords] = useState<any[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchProgressData()
    }
  }, [user?.id])

  const fetchProgressData = async () => {
    try {
      setIsLoading(true)

      // Fetch PRs and recent workout logs in parallel
      const [prsRes, logsRes] = await Promise.all([
        fetch(`/api/workouts/personal-records?userId=${user?.id}&limit=5`),
        fetch(`/api/workouts/logs?userId=${user?.id}&limit=7`)
      ])

      const prsData = await prsRes.json()
      const logsData = await logsRes.json()

      setPersonalRecords(prsData.records || [])
      setWorkoutLogs(logsData.logs || [])
    } catch (error) {
      console.error('Error fetching progress data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate weekly stats
  const weeklyWorkoutsCompleted = workoutLogs.length
  const totalWeeklyVolume = workoutLogs.reduce((sum, log) => sum + (log.totalVolume || 0), 0)
  const averageRpe = workoutLogs.length > 0
    ? workoutLogs.reduce((sum, log) => sum + (log.averageRpe || 0), 0) / workoutLogs.length
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Weekly Stats Overview */}
      <Card className="bg-neutral-900/50 border-white/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Weekly Progress</h3>
              <p className="text-xs text-neutral-400">Last 7 days of training</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {/* Workouts Completed */}
              <div className="p-4 bg-neutral-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-xs text-neutral-400">Workouts</p>
                </div>
                <p className="text-2xl font-bold text-white">{weeklyWorkoutsCompleted}</p>
                <p className="text-xs text-neutral-500 mt-1">completed</p>
              </div>

              {/* Total Volume */}
              <div className="p-4 bg-neutral-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-4 h-4 text-cyan-400" />
                  <p className="text-xs text-neutral-400">Volume</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {(totalWeeklyVolume / 1000).toFixed(1)}
                </p>
                <p className="text-xs text-neutral-500 mt-1">tons lifted</p>
              </div>

              {/* Average RPE */}
              <div className="p-4 bg-neutral-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-orange-400" />
                  <p className="text-xs text-neutral-400">Avg RPE</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {averageRpe > 0 ? averageRpe.toFixed(1) : '--'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">intensity</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card className="bg-neutral-900/50 border-white/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/20">
              <Award className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Recent Achievements</h3>
              <p className="text-xs text-neutral-400">Your latest milestones</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : personalRecords.length > 0 ? (
            <div className="space-y-3">
              {personalRecords.slice(0, 3).map((pr: any, index: number) => (
                <div
                  key={pr.id || index}
                  className="p-4 bg-neutral-800/50 rounded-lg flex items-center gap-4"
                >
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      New PR: {pr.exerciseName}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {new Date(pr.achievedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-400">
                      {pr.weight ? `${pr.weight}kg` : pr.value}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {pr.reps ? `${pr.reps} reps` : pr.metric}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">No achievements yet</p>
              <p className="text-xs text-neutral-500 mt-1">
                Complete workouts to unlock achievements
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Records Progress */}
      <Card className="bg-neutral-900/50 border-white/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Trophy className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Personal Records</h3>
              <p className="text-xs text-neutral-400">Your strongest lifts</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : personalRecords.length > 0 ? (
            <div className="space-y-3">
              {personalRecords.map((pr: any, index: number) => (
                <div
                  key={pr.id || index}
                  className="p-4 bg-neutral-800/50 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-purple-400">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{pr.exerciseName}</p>
                      <p className="text-xs text-neutral-400">
                        {new Date(pr.achievedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-400">
                      {pr.weight ? `${pr.weight}kg` : pr.value}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {pr.reps ? `${pr.reps} reps` : pr.metric}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">No personal records yet</p>
              <p className="text-xs text-neutral-500 mt-1">
                Start tracking your lifts to see your progress
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Fitness Profile Section with Inline Editing
function FitnessProfileSection() {
  const { user } = useAuth()
  const { appData, refresh } = useAppData()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEquipmentExpanded, setIsEquipmentExpanded] = useState(false)
  const [customEquipmentInput, setCustomEquipmentInput] = useState('')

  const profile = appData?.profile

  // Parse equipment array from profile
  const parseEquipment = (equipment: any): string[] => {
    if (Array.isArray(equipment)) return equipment
    if (typeof equipment === 'string') {
      return equipment.split(',').map(item => item.trim()).filter(item => item.length > 0)
    }
    return []
  }

  // Form state
  const [formData, setFormData] = useState({
    primaryGoal: profile?.primary_goal || '',
    trainingStyle: profile?.training_style || '',
    experienceLevel: profile?.experience_level || '',
    gymAccess: profile?.gym_access || '',
    trainingDaysPerWeek: profile?.training_days_per_week?.toString() || '',
    availableTimeMinutes: profile?.available_time_minutes?.toString() || '45',
    selectedEquipment: parseEquipment(profile?.custom_equipment),
    preferredWorkoutTime: profile?.preferred_workout_time || '',
    shoulderMobility: profile?.shoulder_mobility?.toString() || '',
    hipMobility: profile?.hip_mobility?.toString() || '',
    ankleMobility: profile?.ankle_mobility?.toString() || '',
    pushUps: profile?.push_ups?.toString() || '',
    pullUps: profile?.pull_ups?.toString() || '',
    squatDepth: profile?.squat_depth || '',
    plankTime: profile?.plank_time?.toString() || ''
  })

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        primaryGoal: profile.primary_goal || '',
        trainingStyle: profile.training_style || '',
        experienceLevel: profile.experience_level || '',
        gymAccess: profile.gym_access || '',
        trainingDaysPerWeek: profile.training_days_per_week?.toString() || '',
        availableTimeMinutes: profile.available_time_minutes?.toString() || '45',
        selectedEquipment: parseEquipment(profile.custom_equipment),
        preferredWorkoutTime: profile.preferred_workout_time || '',
        shoulderMobility: profile.shoulder_mobility?.toString() || '',
        hipMobility: profile.hip_mobility?.toString() || '',
        ankleMobility: profile.ankle_mobility?.toString() || '',
        pushUps: profile.push_ups?.toString() || '',
        pullUps: profile.pull_ups?.toString() || '',
        squatDepth: profile.squat_depth || '',
        plankTime: profile.plank_time?.toString() || ''
      })
    }
  }, [profile])

  // Helper function to format primary goal
  const formatGoal = (goal?: string): string => {
    if (!goal) return 'Not Set'
    const goalMap: Record<string, string> = {
      'lose-weight': 'Weight Loss',
      'tone-up': 'Tone Up',
      'build-muscle': 'Build Muscle',
      'lifestyle': 'Lifestyle'
    }
    return goalMap[goal] || goal.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  // Helper function to format gym access
  const formatGymAccess = (gymAccess?: string): string => {
    if (!gymAccess) return 'Not Set'
    const gymMap: Record<string, string> = {
      'yes': 'Gym Access',
      'no': 'No Gym',
      'home': 'Home',
      'commercial': 'Commercial Gym',
      'hotel': 'Hotel Gym',
      'custom': 'Custom'
    }
    return gymMap[gymAccess] || gymAccess.charAt(0).toUpperCase() + gymAccess.slice(1)
  }

  // Helper function to format training style
  const formatTrainingStyle = (style?: string): string => {
    if (!style) return 'Not Set'
    const styleMap: Record<string, string> = {
      'aesthetics': 'Aesthetics',
      'strength': 'Strength',
      'athletic': 'Athletic',
      'endurance': 'Endurance',
      'functional': 'Functional',
      'powerlifting': 'Powerlifting',
      'bodybuilding': 'Bodybuilding',
      'crossfit': 'CrossFit'
    }
    return styleMap[style] || style.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  // Helper function to format available time
  const formatAvailableTime = (minutes?: number): string => {
    if (!minutes) return 'Not Set'
    if (minutes >= 60) return '60+ min'
    return `${minutes} min`
  }

  // Equipment handlers
  const toggleEquipment = (item: string) => {
    const current = formData.selectedEquipment
    const isSelected = current.includes(item)
    const updated = isSelected
      ? current.filter(e => e !== item)
      : [...current, item]
    setFormData({ ...formData, selectedEquipment: updated })
  }

  const addCustomEquipment = () => {
    const trimmed = customEquipmentInput.trim()
    if (trimmed && !formData.selectedEquipment.includes(trimmed)) {
      setFormData({
        ...formData,
        selectedEquipment: [...formData.selectedEquipment, trimmed]
      })
      setCustomEquipmentInput('')
    }
  }

  const handleCustomEquipmentKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomEquipment()
    }
  }

  const removeEquipment = (item: string) => {
    setFormData({
      ...formData,
      selectedEquipment: formData.selectedEquipment.filter(e => e !== item)
    })
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const result = await updateProfile({
        primaryGoal: formData.primaryGoal,
        programType: formData.trainingStyle,
        experienceLevel: formData.experienceLevel,
        gymAccess: formData.gymAccess,
        trainingDaysPerWeek: formData.trainingDaysPerWeek ? parseInt(formData.trainingDaysPerWeek) : undefined,
        availableTimeMinutes: formData.availableTimeMinutes ? parseInt(formData.availableTimeMinutes) : undefined,
        customEquipment: formData.selectedEquipment.length > 0 ? formData.selectedEquipment.join(',') : undefined,
        preferredWorkoutTime: formData.preferredWorkoutTime || undefined,
        shoulderMobility: formData.shoulderMobility ? parseInt(formData.shoulderMobility) : undefined,
        hipMobility: formData.hipMobility ? parseInt(formData.hipMobility) : undefined,
        ankleMobility: formData.ankleMobility ? parseInt(formData.ankleMobility) : undefined,
        pushUps: formData.pushUps ? parseInt(formData.pushUps) : undefined,
        pullUps: formData.pullUps ? parseInt(formData.pullUps) : undefined,
        squatDepth: formData.squatDepth || undefined,
        plankTime: formData.plankTime ? parseInt(formData.plankTime) : undefined
      })

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Success",
          description: "Fitness profile updated successfully"
        })
        setIsEditing(false)
        // Refresh app data to show updated profile
        await refresh()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update fitness profile",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to current profile
    setFormData({
      primaryGoal: profile?.primary_goal || '',
      trainingStyle: profile?.training_style || '',
      experienceLevel: profile?.experience_level || '',
      gymAccess: profile?.gym_access || '',
      trainingDaysPerWeek: profile?.training_days_per_week?.toString() || '',
      availableTimeMinutes: profile?.available_time_minutes?.toString() || '45',
      selectedEquipment: parseEquipment(profile?.custom_equipment),
      preferredWorkoutTime: profile?.preferred_workout_time || '',
      shoulderMobility: profile?.shoulder_mobility?.toString() || '',
      hipMobility: profile?.hip_mobility?.toString() || '',
      ankleMobility: profile?.ankle_mobility?.toString() || '',
      pushUps: profile?.push_ups?.toString() || '',
      pullUps: profile?.pull_ups?.toString() || '',
      squatDepth: profile?.squat_depth || '',
      plankTime: profile?.plank_time?.toString() || ''
    })
    setCustomEquipmentInput('')
    setIsEditing(false)
  }

  const equipment = parseEquipment(profile?.custom_equipment)

  return (
    <Card className="bg-neutral-900/50 border-white/5">
      <CardContent className="p-6">
        <div
          className="flex items-center justify-between mb-4 cursor-pointer"
          onClick={() => !isEditing && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800">
              <User className="w-5 h-5 text-neutral-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Your Custom Fitness Profile</h3>
              <p className="text-xs text-neutral-400">AI uses this to customize workouts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {!isEditing && (
              <button
                className="p-1 rounded-lg hover:bg-neutral-800 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-neutral-400" />
                )}
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 mt-4">
                {/* Primary Goal */}
                <div className="p-3 bg-neutral-800/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-neutral-400">Primary Goal</span>
                  </div>
                  {isEditing ? (
                    <Select value={formData.primaryGoal} onValueChange={(value) => setFormData({...formData, primaryGoal: value})}>
                      <SelectTrigger className="w-full bg-neutral-900 border-white/10">
                        <SelectValue placeholder="Select goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lose-weight">Weight Loss</SelectItem>
                        <SelectItem value="tone-up">Tone Up</SelectItem>
                        <SelectItem value="build-muscle">Build Muscle</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm font-medium text-white block mt-1">{formatGoal(profile?.primary_goal)}</span>
                  )}
                </div>

          {/* Training Style */}
          <div className="p-3 bg-neutral-800/50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-neutral-400">Training Style</span>
            </div>
            {isEditing ? (
              <Select value={formData.trainingStyle} onValueChange={(value) => setFormData({...formData, trainingStyle: value})}>
                <SelectTrigger className="w-full bg-neutral-900 border-white/10">
                  <SelectValue placeholder="Select training style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aesthetics">Aesthetics</SelectItem>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="athletic">Athletic</SelectItem>
                  <SelectItem value="endurance">Endurance</SelectItem>
                  <SelectItem value="functional">Functional</SelectItem>
                  <SelectItem value="powerlifting">Powerlifting</SelectItem>
                  <SelectItem value="bodybuilding">Bodybuilding</SelectItem>
                  <SelectItem value="crossfit">CrossFit</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm font-medium text-white block mt-1">{formatTrainingStyle(profile?.training_style)}</span>
            )}
          </div>

          {/* Experience Level */}
          <div className="p-3 bg-neutral-800/50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-neutral-400">Experience Level</span>
            </div>
            {isEditing ? (
              <Select value={formData.experienceLevel} onValueChange={(value) => setFormData({...formData, experienceLevel: value})}>
                <SelectTrigger className="w-full bg-neutral-900 border-white/10">
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm font-medium text-white block mt-1">
                {profile?.experience_level ? profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1) : 'Not Set'}
              </span>
            )}
          </div>

          {/* Workout Location */}
          <div className="p-3 bg-neutral-800/50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-neutral-400">Workout Location</span>
            </div>
            {isEditing ? (
              <Select value={formData.gymAccess} onValueChange={(value) => setFormData({...formData, gymAccess: value})}>
                <SelectTrigger className="w-full bg-neutral-900 border-white/10">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="commercial">Commercial Gym</SelectItem>
                  <SelectItem value="hotel">Hotel Gym</SelectItem>
                  <SelectItem value="yes">Gym Access</SelectItem>
                  <SelectItem value="no">No Gym</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm font-medium text-white block mt-1">{formatGymAccess(profile?.gym_access)}</span>
            )}
          </div>

          {/* Weekly Frequency */}
          <div className="p-3 bg-neutral-800/50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-neutral-400">Weekly Frequency</span>
            </div>
            {isEditing ? (
              <Select value={formData.trainingDaysPerWeek} onValueChange={(value) => setFormData({...formData, trainingDaysPerWeek: value})}>
                <SelectTrigger className="w-full bg-neutral-900 border-white/10">
                  <SelectValue placeholder="Select days per week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day per week</SelectItem>
                  <SelectItem value="2">2 days per week</SelectItem>
                  <SelectItem value="3">3 days per week</SelectItem>
                  <SelectItem value="4">4 days per week</SelectItem>
                  <SelectItem value="5">5 days per week</SelectItem>
                  <SelectItem value="6">6 days per week</SelectItem>
                  <SelectItem value="7">7 days per week</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm font-medium text-white block mt-1">
                {profile?.training_days_per_week ? `${profile.training_days_per_week} days per week` : 'Not Set'}
              </span>
            )}
          </div>

          {/* Available Workout Time */}
          <div className="p-3 bg-neutral-800/50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-4 h-4 text-green-400" />
              <span className="text-sm text-neutral-400">Available Workout Time</span>
            </div>
            {isEditing ? (
              <Select value={formData.availableTimeMinutes} onValueChange={(value) => setFormData({...formData, availableTimeMinutes: value})}>
                <SelectTrigger className="w-full bg-neutral-900 border-white/10">
                  <SelectValue placeholder="Select workout time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60+ min</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm font-medium text-white block mt-1">
                {formatAvailableTime(profile?.available_time_minutes)}
              </span>
            )}
          </div>

          {/* Available Equipment */}
          <div className="p-3 bg-neutral-800/50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Dumbbell className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-neutral-400">Available Equipment</span>
            </div>
            {isEditing ? (
              <div className="space-y-3">
                {/* Selected Equipment Tags */}
                {formData.selectedEquipment.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedEquipment.map((item) => (
                      <span
                        key={item}
                        className="px-2 py-1 text-xs rounded-md bg-cyan-500/20 text-cyan-300 flex items-center gap-1"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeEquipment(item)}
                          className="hover:text-cyan-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Common Equipment Checkboxes */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsEquipmentExpanded(!isEquipmentExpanded)}
                    className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    <span>Quick Select ({COMMON_EQUIPMENT.length} options)</span>
                    {isEquipmentExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isEquipmentExpanded && (
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-3 bg-neutral-900/50 rounded-lg">
                      {COMMON_EQUIPMENT.map((item) => (
                        <label
                          key={item}
                          className="flex items-center gap-2 text-xs text-white/80 hover:text-white cursor-pointer"
                        >
                          <Checkbox
                            checked={formData.selectedEquipment.includes(item)}
                            onCheckedChange={() => toggleEquipment(item)}
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Equipment Input */}
                <div className="space-y-2">
                  <Label className="text-xs text-neutral-400">Add Custom Equipment</Label>
                  <div className="flex gap-2">
                    <Input
                      value={customEquipmentInput}
                      onChange={(e) => setCustomEquipmentInput(e.target.value)}
                      onKeyPress={handleCustomEquipmentKeyPress}
                      placeholder="Type and press Enter..."
                      className="bg-neutral-900 border-white/10 text-white text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomEquipment}
                      className="border-cyan-500/30 hover:border-cyan-500/50 hover:bg-cyan-500/10"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {equipment.length > 0 ? (
                  equipment.map((item: string) => (
                    <span key={item} className="px-2 py-1 text-xs rounded-md bg-purple-500/20 text-purple-300">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-neutral-500">No equipment specified</span>
                )}
              </div>
            )}
          </div>

          {/* Preferred Workout Time */}
          <div className="p-3 bg-neutral-800/50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-4 h-4 text-pink-400" />
              <span className="text-sm text-neutral-400">Preferred Workout Time</span>
            </div>
            {isEditing ? (
              <Select value={formData.preferredWorkoutTime} onValueChange={(value) => setFormData({...formData, preferredWorkoutTime: value})}>
                <SelectTrigger className="w-full bg-neutral-900 border-white/10">
                  <SelectValue placeholder="Select preferred time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm font-medium text-white block mt-1">
                {profile?.preferred_workout_time ? profile.preferred_workout_time.charAt(0).toUpperCase() + profile.preferred_workout_time.slice(1) : 'Not Set'}
              </span>
            )}
          </div>

          {/* Mobility Assessment */}
          <div className="p-3 bg-neutral-800/50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-neutral-400">Mobility Assessment (1-10 scale)</span>
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-neutral-400 mb-1">Shoulder Mobility</Label>
                  <Select value={formData.shoulderMobility} onValueChange={(value) => setFormData({...formData, shoulderMobility: value})}>
                    <SelectTrigger className="w-full bg-neutral-900 border-white/10 mt-1">
                      <SelectValue placeholder="Select score" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-neutral-400 mb-1">Hip Mobility</Label>
                  <Select value={formData.hipMobility} onValueChange={(value) => setFormData({...formData, hipMobility: value})}>
                    <SelectTrigger className="w-full bg-neutral-900 border-white/10 mt-1">
                      <SelectValue placeholder="Select score" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-neutral-400 mb-1">Ankle Mobility</Label>
                  <Select value={formData.ankleMobility} onValueChange={(value) => setFormData({...formData, ankleMobility: value})}>
                    <SelectTrigger className="w-full bg-neutral-900 border-white/10 mt-1">
                      <SelectValue placeholder="Select score" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center">
                  <div className="text-xs text-neutral-500 mb-1">Shoulder</div>
                  <div className="text-sm font-medium text-white">
                    {profile?.shoulder_mobility || 'N/A'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-neutral-500 mb-1">Hip</div>
                  <div className="text-sm font-medium text-white">
                    {profile?.hip_mobility || 'N/A'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-neutral-500 mb-1">Ankle</div>
                  <div className="text-sm font-medium text-white">
                    {profile?.ankle_mobility || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fitness Assessment */}
          <div className="p-3 bg-neutral-800/50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-neutral-400">Fitness Assessment</span>
            </div>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-neutral-400 mb-1">Push-ups</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.pushUps}
                    onChange={(e) => setFormData({...formData, pushUps: e.target.value})}
                    placeholder="0"
                    className="bg-neutral-900 border-white/10 text-white text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-neutral-400 mb-1">Pull-ups</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.pullUps}
                    onChange={(e) => setFormData({...formData, pullUps: e.target.value})}
                    placeholder="0"
                    className="bg-neutral-900 border-white/10 text-white text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-neutral-400 mb-1">Squat Depth</Label>
                  <Select value={formData.squatDepth} onValueChange={(value) => setFormData({...formData, squatDepth: value})}>
                    <SelectTrigger className="w-full bg-neutral-900 border-white/10 mt-1">
                      <SelectValue placeholder="Select depth" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parallel">Parallel</SelectItem>
                      <SelectItem value="below_parallel">Below Parallel</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-neutral-400 mb-1">Plank Time (sec)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.plankTime}
                    onChange={(e) => setFormData({...formData, plankTime: e.target.value})}
                    placeholder="0"
                    className="bg-neutral-900 border-white/10 text-white text-sm mt-1"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Push-ups</div>
                  <div className="text-sm font-medium text-white">
                    {profile?.push_ups || 'Not Set'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Pull-ups</div>
                  <div className="text-sm font-medium text-white">
                    {profile?.pull_ups || 'Not Set'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Squat Depth</div>
                  <div className="text-sm font-medium text-white">
                    {profile?.squat_depth ? profile.squat_depth.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Not Set'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Plank Time</div>
                  <div className="text-sm font-medium text-white">
                    {profile?.plank_time ? `${profile.plank_time}s` : 'Not Set'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-2 mt-4">
              <Button
                variant="default"
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-white/10 hover:bg-white/5"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </motion.div>
        )}
      </AnimatePresence>
      </CardContent>
    </Card>
  )
}

// Your Progress Section
function YourProgressSection() {
  return (
    <Card className="bg-neutral-900/50 border-white/5">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-yellow-500/20">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Your Progress</h3>
            <p className="text-xs text-neutral-400">This week's achievements</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">0</div>
            <div className="text-xs text-neutral-400 mt-1">Workouts</div>
            <div className="text-xs text-neutral-500">This week</div>
          </div>
          <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">0.0h</div>
            <div className="text-xs text-neutral-400 mt-1">Total Time</div>
            <div className="text-xs text-neutral-500">This week</div>
          </div>
          <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">0</div>
            <div className="text-xs text-neutral-400 mt-1">Calories</div>
            <div className="text-xs text-neutral-500">Burned today</div>
          </div>
          <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-cyan-400">0</div>
            <div className="text-xs text-neutral-400 mt-1">Day Streak</div>
            <div className="text-xs text-neutral-500">Keep it up!</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// How AI Workouts Work Section
function HowAIWorksSection() {
  return (
    <Card className="bg-neutral-900/50 border-white/5">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">How AI Workouts Work</h3>
            <p className="text-xs text-neutral-400">Personalized fitness made simple</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">
              1
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-1">AI Analyzes Your Profile</h4>
              <p className="text-xs text-neutral-400">
                Goals, equipment, fitness level, and preferences
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
              2
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-1">Creates Custom Workouts</h4>
              <p className="text-xs text-neutral-400">
                Exercises tailored to your specific needs and equipment
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold">
              3
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-1">Adapts Over Time</h4>
              <p className="text-xs text-neutral-400">
                Workouts evolve as you progress and get stronger
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeletons
function WorkoutPlanSkeleton() {
  return (
    <Card className="bg-neutral-900/50 border-white/5">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function WorkoutSessionSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black p-6">
      <Skeleton className="h-12 w-full mb-6" />
      <Skeleton className="h-64 w-full mb-4" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}
