import { z } from "zod"

// ============================================
// API Request Validation Schemas
// ============================================

// VBot/Chat API
export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "Message content is required"),
})

export const vbotRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, "At least one message is required"),
})

export type VBotRequest = z.infer<typeof vbotRequestSchema>

// Affiliate Application API
export const affiliateApplicationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
})

export type AffiliateApplication = z.infer<typeof affiliateApplicationSchema>

// Transform Body API
export const transformBodySchema = z.object({
  imageUrl: z.string().url("Invalid image URL"),
  preset: z.enum(["lean", "muscular", "athletic", "slim"]).optional(),
})

export type TransformBodyRequest = z.infer<typeof transformBodySchema>

// Profile Update
export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  age: z.number().int().min(13).max(120).optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  heightFeet: z.number().int().min(1).max(8).optional(),
  heightInches: z.number().int().min(0).max(11).optional(),
  weight: z.number().positive().max(1000).optional(),
  goalWeight: z.number().positive().max(1000).optional(),
  primaryGoal: z.enum(["lose_weight", "build_muscle", "maintain", "improve_health"]).optional(),
  activityLevel: z.enum(["sedentary", "lightly_active", "moderately_active", "very_active", "extremely_active"]).optional(),
  gymAccess: z.enum(["yes", "no", "sometimes", "home", "hotel", "commercial", "gym", "custom", "none"]).optional(),
  selectedGym: z.string().max(200).optional(),
  customEquipment: z.string().max(500).optional(),
  allergies: z.array(z.string()).optional(),
  customRestrictions: z.array(z.string()).optional(),
  timezone: z.string().optional(),
})

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>

// Habit Creation
export const createHabitSchema = z.object({
  name: z.string().min(1, "Habit name is required").max(100),
  category: z.enum(["fitness", "nutrition", "wellness", "other"]),
  frequency: z.enum(["daily", "weekly", "custom"]),
})

export type CreateHabit = z.infer<typeof createHabitSchema>

// Post Creation
export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required").max(5000),
  image: z.string().url().optional(),
  category: z.string().min(1, "Category is required"),
})

export type CreatePost = z.infer<typeof createPostSchema>

// Comment Creation
export const createCommentSchema = z.object({
  postId: z.string().uuid("Invalid post ID"),
  content: z.string().min(1, "Comment is required").max(1000),
})

export type CreateComment = z.infer<typeof createCommentSchema>

// Weight Entry
export const weightEntrySchema = z.object({
  weight: z.number().positive().max(1000),
  notes: z.string().max(500).optional(),
})

export type WeightEntry = z.infer<typeof weightEntrySchema>

// ============================================
// Validation Helper Functions
// ============================================

/**
 * Validates request body against a schema.
 * Returns parsed data or throws with validation errors.
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    const errors = result.error.flatten()
    throw new ValidationError(
      "Validation failed",
      errors.fieldErrors as Record<string, string[]>
    )
  }
  
  return result.data
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  public readonly fieldErrors: Record<string, string[]>
  
  constructor(message: string, fieldErrors: Record<string, string[]>) {
    super(message)
    this.name = "ValidationError"
    this.fieldErrors = fieldErrors
  }
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(error: unknown, status = 400) {
  if (error instanceof ValidationError) {
    return Response.json(
      {
        error: error.message,
        fieldErrors: error.fieldErrors
      },
      { status }
    )
  }

  if (error instanceof Error) {
    return Response.json(
      { error: error.message },
      { status }
    )
  }

  return Response.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  )
}

/**
 * Safe validation that returns success/error structure
 * Compatible with existing error handling patterns
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data)

  if (result.success) {
    return {
      success: true as const,
      data: result.data,
    }
  }

  return {
    success: false as const,
    details: {
      issues: result.error.issues.map(issue => ({
        path: issue.path,
        message: issue.message,
      })),
    },
  }
}

// ============================================
// Workout Generation API
// ============================================

export const workoutGenerationSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  preferences: z.object({
    trainingStyle: z.enum(["strength", "hypertrophy", "endurance", "mixed"]).optional(),
    splitPreference: z.enum(["push_pull_legs", "upper_lower", "full_body", "auto"]).optional(),
    exercisesToAvoid: z.array(z.string()).optional(),
    specificGoals: z.string().max(500).optional(),
  }).optional(),
})

export type WorkoutGenerationRequest = z.infer<typeof workoutGenerationSchema>

// Workout Logging API Schemas
export const workoutLogStartSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  workoutId: z.string().uuid("Invalid workout ID"),
})

export type WorkoutLogStart = z.infer<typeof workoutLogStartSchema>

export const workoutLogCompleteSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  workoutLogId: z.string().uuid("Invalid workout log ID"),
  notes: z.string().max(1000).optional(),
  perceivedDifficulty: z.number().int().min(1).max(10).optional(),
  energyLevel: z.number().int().min(1).max(10).optional(),
})

export type WorkoutLogComplete = z.infer<typeof workoutLogCompleteSchema>

export const exerciseLogSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  workoutLogId: z.string().uuid("Invalid workout log ID"),
  exerciseId: z.string().uuid("Invalid exercise ID"),
  exerciseType: z.enum(["strength", "cardio", "flexibility", "bodyweight", "plyometric", "swimming", "sports"]),
  planExerciseId: z.string().uuid("Invalid plan exercise ID").optional(),
  // Strength/Bodyweight/Plyometric
  sets: z.array(z.object({
    reps: z.number().int().positive(),
    weight: z.number().nonnegative(),
    rpe: z.number().int().min(1).max(10).optional(),
  })).optional(),
  // Cardio
  durationSeconds: z.number().int().positive().optional(),
  distanceMiles: z.number().positive().optional(),
  avgHeartRate: z.number().int().positive().optional(),
  caloriesBurned: z.number().int().positive().optional(),
  pacePerMileSeconds: z.number().int().positive().optional(),
  // Swimming
  swimStroke: z.string().max(50).optional(),
  lapsCompleted: z.number().int().positive().optional(),
  poolLengthMeters: z.number().positive().optional(),
  pacePer100mSeconds: z.number().int().positive().optional(),
  // Flexibility
  holdTimeSeconds: z.number().int().positive().optional(),
  stretchIntensity: z.number().int().min(1).max(10).optional(),
  // Common fields
  notes: z.string().max(1000).optional(),
  formQuality: z.number().int().min(1).max(5).optional(),
  difficultyAdjustment: z.enum(["easier", "same", "harder"]).optional(),
  perceivedExertion: z.number().int().min(1).max(10).optional(),
})

export type ExerciseLog = z.infer<typeof exerciseLogSchema>

export const weeklyAdjustmentsSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  planId: z.string().uuid("Invalid plan ID"),
  weeks: z.number().int().min(1).max(12).optional().default(1),
})

export type WeeklyAdjustments = z.infer<typeof weeklyAdjustmentsSchema>

/**
 * Helper to validate query parameters from URLSearchParams
 */
export function validateQueryParams<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): T {
  const params: Record<string, string | number> = {}

  searchParams.forEach((value, key) => {
    // Try to parse numeric values
    const numValue = Number(value)
    params[key] = isNaN(numValue) ? value : numValue
  })

  const result = schema.safeParse(params)

  if (!result.success) {
    const errors = result.error.flatten()
    throw new ValidationError(
      "Query parameter validation failed",
      errors.fieldErrors as Record<string, string[]>
    )
  }

  return result.data
}
