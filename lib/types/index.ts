// ============================================
// Core Domain Types for V-Life Fitness App
// ============================================

// Voice/TTS Types (must be defined before Profile which references them)
export type GeminiVoiceName = 
  | 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Leda'
  | 'Orus' | 'Aoede' | 'Callirrhoe' | 'Autonoe' | 'Enceladus' | 'Iapetus'
  | 'Umbriel' | 'Algieba' | 'Despina' | 'Erinome' | 'Algenib' | 'Rasalgethi'
  | 'Laomedeia' | 'Achernar' | 'Alnilam' | 'Schedar' | 'Gacrux' | 'Pulcherrima'
  | 'Achird' | 'Zubenelgenubi' | 'Vindemiatrix' | 'Sadachbia' | 'Sadaltager' | 'Sulafat'

export interface VoicePreferences {
  selectedVoice: GeminiVoiceName
  voiceEnabled: boolean
  autoPlayResponses: boolean
}

export interface VoiceOption {
  name: GeminiVoiceName
  style: string
}

// All 30 Gemini TTS voice options
export const GEMINI_VOICES: VoiceOption[] = [
  { name: 'Zephyr', style: 'Bright' },
  { name: 'Puck', style: 'Upbeat' },
  { name: 'Charon', style: 'Informative' },
  { name: 'Kore', style: 'Firm' },
  { name: 'Fenrir', style: 'Excitable' },
  { name: 'Leda', style: 'Youthful' },
  { name: 'Orus', style: 'Firm' },
  { name: 'Aoede', style: 'Breezy' },
  { name: 'Callirrhoe', style: 'Easy-going' },
  { name: 'Autonoe', style: 'Bright' },
  { name: 'Enceladus', style: 'Breathy' },
  { name: 'Iapetus', style: 'Clear' },
  { name: 'Umbriel', style: 'Easy-going' },
  { name: 'Algieba', style: 'Smooth' },
  { name: 'Despina', style: 'Smooth' },
  { name: 'Erinome', style: 'Clear' },
  { name: 'Algenib', style: 'Gravelly' },
  { name: 'Rasalgethi', style: 'Informative' },
  { name: 'Laomedeia', style: 'Upbeat' },
  { name: 'Achernar', style: 'Soft' },
  { name: 'Alnilam', style: 'Firm' },
  { name: 'Schedar', style: 'Even' },
  { name: 'Gacrux', style: 'Mature' },
  { name: 'Pulcherrima', style: 'Forward' },
  { name: 'Achird', style: 'Friendly' },
  { name: 'Zubenelgenubi', style: 'Casual' },
  { name: 'Vindemiatrix', style: 'Gentle' },
  { name: 'Sadachbia', style: 'Lively' },
  { name: 'Sadaltager', style: 'Knowledgeable' },
  { name: 'Sulafat', style: 'Warm' },
]

// User & Profile Types
export interface Profile {
  id: string
  name: string | null
  avatar_url: string | null
  age: number | null
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
  height_feet: number | null
  height_inches: number | null
  weight: number | null
  goal_weight: number | null
  primary_goal: 'lose-weight' | 'tone-up' | 'build-muscle' | 'lifestyle' | null
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active' | null
  gym_access: 'yes' | 'no' | 'sometimes' | 'home' | 'hotel' | 'commercial' | 'gym' | 'custom' | 'none' | null
  selected_gym: string | null
  custom_equipment: string | null
  allergies: string[] | null
  custom_restrictions: string[] | null
  timezone: string | null
  referral_code: string | null
  credits: number
  onboarding_completed: boolean | null
  is_admin: boolean | null
  voice_preferences?: VoicePreferences | null
  created_at: string
  updated_at: string
}

export interface ProfileFormData {
  name: string
  avatar_url?: string
  age: string
  gender: string
  heightFeet: string
  heightInches: string
  weight: string
  goalWeight: string
  primaryGoal: string
  activityLevel: number | string
  gymAccess: string
  selectedGym: string
  customEquipment: string
  allergies: string[]
  customRestrictions: string[]
  timezone?: string
}

// Habit Types
export interface Habit {
  id: string
  user_id: string
  name: string
  category: 'fitness' | 'nutrition' | 'wellness' | 'other'
  frequency: 'daily' | 'weekly' | 'custom'
  current_streak: number
  best_streak: number
  created_at: string
  updated_at?: string
}

export interface HabitWithStatus extends Habit {
  completed: boolean
  logId: string | null
}

export interface HabitLog {
  id: string
  user_id: string
  habit_id: string
  completed: boolean
  logged_at: string
  created_at?: string
}

// Workout Types
export interface Exercise {
  id: string
  name: string
  description: string | null
  muscle_group: string | null
  equipment: string | null
  image_url: string | null
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  sets: number
  reps: string
  rest_seconds: number
  order_index: number
  exercises?: Exercise
}

export interface Workout {
  id: string
  user_id: string
  name: string
  workout_type: 'strength' | 'cardio' | 'flexibility' | 'hiit' | 'custom' | null
  duration_minutes: number | null
  completed: boolean
  scheduled_date: string | null
  completed_at: string | null
  created_at: string
  workout_exercises?: WorkoutExercise[]
}

// UI Exercise Types (for local state)
export interface UIExercise {
  id: number
  name: string
  sets: number
  reps: string
  rest: string
  completed: boolean
}

export interface UICardioExercise {
  id: number
  name: string
  duration: string
  distance?: string
  pace?: string
  calories?: string
  completed: boolean
}

// Meal & Nutrition Types
export interface Meal {
  id: string
  user_id: string
  name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  image_url: string | null
  created_at: string
}

export interface UIMeal {
  id: number
  type: string
  name: string
  calories: number
  image: string | null
}

export interface Macros {
  calories: { current: number; target: number }
  protein: { current: number; target: number; unit: string }
  carbs: { current: number; target: number; unit: string }
  fat: { current: number; target: number; unit: string }
}

export interface MealAlternative {
  name: string
  calories: number
  description: string
}

// Community Types
export interface Post {
  id: string
  user_id: string
  title: string
  content: string
  image_url: string | null
  category: string
  likes_count: number
  comments_count: number
  created_at: string
}

export interface PostReaction {
  id: string
  post_id: string
  user_id: string
  reaction_type: 'heart' | 'celebrate' | 'support' | 'fire'
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  likes_count: number
  created_at: string
}

export interface TransformedPost {
  id: string
  user: {
    id: string
    name: string
    avatar: string
    isFollowing: boolean
  }
  title: string
  content: string
  image: string | null
  likes: number
  comments: number
  time: string
  category: string
  reactions: {
    heart: number
    celebrate: number
    support: number
    fire: number
  }
  userReaction: 'heart' | 'celebrate' | 'support' | 'fire' | null
}

export interface TransformedComment {
  id: string
  user: {
    name: string
    avatar: string
  }
  content: string
  time: string
  likes: number
}

// Streak Types
export interface StreakStats {
  overallStreak: number
  longestStreak: number
  totalDaysActive: number
  habitStreaks: HabitStreakDetail[]
  weeklyActivity: WeeklyActivityDay[]
}

export interface HabitStreakDetail {
  id: string
  name: string
  currentStreak: number
  longestStreak: number
  category: string
  lastCompleted: string
  completionRate: number
  totalCompletions: number
}

export interface WeeklyActivityDay {
  day: string
  active: boolean
  date: string
}

export interface Milestone {
  id: number
  name: string
  achieved: boolean
  icon: string
  color: string
}

// Referral Types
export interface ReferralStats {
  referralCode: string
  creditsBalance: number
  referralsCount: number
  creditsEarned: number
}

// Notification Types
export interface NotificationPreferences {
  notificationsEnabled: boolean
  workoutReminders: boolean
  workoutReminderTime: string
  mealReminders: boolean
  breakfastReminderTime: string
  lunchReminderTime: string
  dinnerReminderTime: string
  progressUpdates: boolean
  streakWarnings: boolean
  achievementNotifications: boolean
  habitReminders: boolean
}

// Weight Tracking Types
export interface WeightEntry {
  id: string
  user_id: string
  weight: number
  change: number | null
  note?: string | null
  logged_at: string
  created_at?: string
}

// Progress Photo Types
export interface ProgressPhoto {
  id: string
  user_id: string
  image_url: string
  notes: string | null
  taken_at: string
  created_at?: string
}

// API Response Types
export interface ApiResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface ProfileResult {
  profile: Profile | null
  error?: string
}

export interface HabitsResult {
  habits: HabitWithStatus[]
  error: string | null
}

export interface ProgressResult {
  progress: number
  error: string | null
}

// Onboarding Types
export interface OnboardingData {
  // Profile data
  name: string
  age: string
  gender: string
  heightFeet: string
  heightInches: string
  weight: string
  goalWeight: string
  gymAccess: string
  selectedGym: string
  customEquipment: string
  activityLevel: number

  // Goals data
  primaryGoal: string

  // Training preferences
  trainingStyle: string
  availableTimeMinutes: number
  trainingDaysPerWeek: number

  // Preferences data
  allergies: string[]
  customRestrictions: string[]
}

// VBot/AI Types
export interface VBotMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt?: Date
}

// Supplement Types
export interface Supplement {
  id: string
  name: string
  category?: string | null
  description: string | null
  benefits?: string[] | null
  recommended_dosage?: string | null
  recommended_time?: string | null
  featured?: boolean
  product_url?: string | null
  created_at?: string
}

export interface SupplementLog {
  id: string
  user_id: string
  supplement_id: string
  taken: boolean
  logged_at: string
  supplements?: Supplement
}

// Daily Insights Types
export interface DailyInsight {
  id: string
  user_id: string
  local_date: string
  timezone: string
  insight: string
  generated_at: string
  meta?: Record<string, unknown>
  created_at: string
}

export interface DailyInsightResult {
  insight: string | null
  error: string | null
}

// User Dashboard Snapshot for AI generation
export interface UserDashboardSnapshot {
  userId: string
  userName: string | null
  progress: number
  habits: Array<{
    id: string
    name: string
    category: string
    frequency: string
    currentStreak: number
    bestStreak: number
    completed: boolean
  }>
  totalHabits: number
  completedToday: number
  avgWeeklyProgress: number
  primaryGoal: string | null
  activityLevel: string | null
}

// Export app-data types for global context
export type { AppData, AppDataUpdate, UseAppDataReturn } from './app-data'

