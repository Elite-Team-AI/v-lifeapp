import { z } from 'zod'

/**
 * Common validation schemas for API routes
 * These schemas can be imported and used across different API endpoints
 * to ensure consistent validation and type safety
 */

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format')

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  pageSize: z.number().int().min(1).max(100, 'Page size must be between 1 and 100').default(50),
  limit: z.number().int().min(1).max(100, 'Limit must be between 1 and 100').optional(),
  offset: z.number().int().min(0, 'Offset must be non-negative').default(0).optional(),
})

// Common field validations
export const emailSchema = z.string().email('Invalid email format')
export const urlSchema = z.string().url('Invalid URL format')
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid ISO date format (YYYY-MM-DD)')
export const isoDateTimeSchema = z.string().datetime('Invalid ISO datetime format')

// Numeric range validations
export const positiveNumber = z.number().positive('Must be a positive number')
export const weightSchema = z.number().positive().max(1000, 'Weight must be less than 1000 lbs')
export const rpeSchema = z.number().int().min(1).max(10, 'RPE must be between 1 and 10')
export const ratingSchema = z.number().int().min(1).max(5, 'Rating must be between 1 and 5')
export const difficultySchema = z.number().int().min(1).max(10, 'Difficulty must be between 1 and 10')

// String validations with length limits
export const shortTextSchema = z.string().max(100, 'Text must be less than 100 characters')
export const mediumTextSchema = z.string().max(500, 'Text must be less than 500 characters')
export const longTextSchema = z.string().max(1000, 'Text must be less than 1000 characters')
export const veryLongTextSchema = z.string().max(5000, 'Text must be less than 5000 characters')

// Array validations
export const limitedArraySchema = <T extends z.ZodTypeAny>(itemSchema: T, maxLength: number = 50) =>
  z.array(itemSchema).max(maxLength, `Array must contain no more than ${maxLength} items`)

// Exercise type enum
export const exerciseTypeSchema = z.enum([
  'strength',
  'cardio',
  'flexibility',
  'bodyweight',
  'plyometric',
  'swimming',
  'sports'
])

// Workout-specific schemas
export const setSchema = z.object({
  reps: z.number().int().min(1).max(500, 'Reps must be between 1 and 500'),
  weight: z.number().min(0).max(1000, 'Weight must be between 0 and 1000 lbs').optional(),
  rpe: rpeSchema.optional(),
})

export const setsArraySchema = limitedArraySchema(setSchema, 50)

// Workout log schemas
export const workoutLogStartSchema = z.object({
  userId: uuidSchema,
  workoutId: uuidSchema,
})

export const workoutLogCompleteSchema = z.object({
  userId: uuidSchema,
  workoutLogId: uuidSchema,
  notes: longTextSchema.optional(),
  perceivedDifficulty: difficultySchema.optional(),
  energyLevel: difficultySchema.optional(),
})

export const exerciseLogSchema = z.object({
  userId: uuidSchema,
  workoutLogId: uuidSchema,
  exerciseId: uuidSchema,
  exerciseType: exerciseTypeSchema,
  planExerciseId: uuidSchema.optional(),
  // Strength/bodyweight/plyometric
  sets: setsArraySchema.optional(),
  // Cardio
  durationSeconds: z.number().int().min(1).max(86400).optional(), // Max 24 hours
  distanceMiles: z.number().min(0).max(1000).optional(),
  avgHeartRate: z.number().int().min(30).max(250).optional(),
  caloriesBurned: z.number().int().min(0).max(10000).optional(),
  pacePerMileSeconds: z.number().int().min(0).optional(),
  // Swimming
  swimStroke: shortTextSchema.optional(),
  lapsCompleted: z.number().int().min(1).max(1000).optional(),
  poolLengthMeters: z.number().int().min(10).max(100).optional(),
  pacePer100mSeconds: z.number().int().min(0).optional(),
  // Flexibility
  holdTimeSeconds: z.number().int().min(1).max(3600).optional(),
  stretchIntensity: difficultySchema.optional(),
  // Common
  notes: mediumTextSchema.optional(),
  formQuality: ratingSchema.optional(),
  difficultyAdjustment: z.enum(['easier', 'same', 'harder']).optional(),
  perceivedExertion: rpeSchema.optional(),
})

// Transformation schemas
export const transformationSaveSchema = z.object({
  beforeImageUrl: urlSchema,
  afterImageUrl: urlSchema.optional(),
  dateBefore: isoDateSchema,
  dateAfter: isoDateSchema.optional(),
  weightBefore: weightSchema.optional(),
  weightAfter: weightSchema.optional(),
  notes: longTextSchema.optional(),
})

// Knowledge base schemas
export const knowledgeCategorySchema = z.enum([
  'nutrition',
  'exercise',
  'recovery',
  'hormones',
  'supplements',
  'mindset',
  'safety',
])

export const knowledgeBaseCreateSchema = z.object({
  id: uuidSchema,
  category: knowledgeCategorySchema,
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required').max(500 * 1024, 'Content must be less than 500KB'),
  tags: limitedArraySchema(shortTextSchema, 20).default([]),
  priority: z.number().int().min(1).max(10, 'Priority must be between 1 and 10').default(5),
  autoChunk: z.boolean().default(true),
  chunkOptions: z.object({
    maxChunkSize: z.number().int().min(100).max(10000).optional(),
    overlapSize: z.number().int().min(0).max(1000).optional(),
  }).optional().default({}),
})

export const knowledgeBaseBulkUploadSchema = z.object({
  entries: limitedArraySchema(
    z.object({
      id: uuidSchema,
      category: shortTextSchema,
      title: z.string().min(1).max(200),
      content: z.string().min(1),
      tags: limitedArraySchema(shortTextSchema, 10).default([]),
      priority: z.number().int().min(1).max(10).default(5),
    }),
    1000
  ),
  chunkOptions: z.object({
    maxChunkSize: z.number().int().min(100).max(10000).optional(),
    overlapSize: z.number().int().min(0).max(1000).optional(),
  }).optional(),
  batchSize: z.number().int().min(1).max(100, 'Batch size must be between 1 and 100').default(20),
})

export const knowledgeBaseListSchema = z.object({
  category: knowledgeCategorySchema.optional(),
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  pageSize: z.number().int().min(1).max(100, 'Page size must be between 1 and 100').default(50),
  search: z.string().max(200).optional(),
  parentOnly: z.boolean().default(false),
})

// AI chat schemas
export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: veryLongTextSchema,
})

export const aiChatSchema = z.object({
  messages: limitedArraySchema(chatMessageSchema, 50),
  context: z.object({
    userId: uuidSchema.optional(),
  }).passthrough(), // Allow additional properties
})

// Workout generation schemas
export const workoutGenerationSchema = z.object({
  userId: uuidSchema,
  preferences: z.object({
    trainingStyle: z.enum(['strength', 'hypertrophy', 'endurance', 'mixed']).optional(),
    splitPreference: z.enum(['full_body', 'upper_lower', 'push_pull_legs', 'bro_split']).optional(),
    exercisesToAvoid: limitedArraySchema(uuidSchema, 50).optional(),
    specificGoals: mediumTextSchema.optional(),
  }).optional(),
})

// Analytics query schemas
export const weeklyAdjustmentsSchema = z.object({
  userId: uuidSchema,
  planId: uuidSchema,
  weeks: z.number().int().min(1).max(52, 'Weeks must be between 1 and 52').default(1),
})

// Nutrients API schema (Edamam)
export const nutrientsSchema = z.object({
  ingredients: limitedArraySchema(
    z.object({
      quantity: z.number().positive('Quantity must be positive'),
      measureURI: z.string().min(1, 'Measure URI is required'),
      foodId: z.string().min(1, 'Food ID is required'),
    }),
    100
  ).min(1, 'At least one ingredient is required'),
})

/**
 * Helper function to validate request body
 * Returns parsed data or throws ZodError
 */
export function validateRequestBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): z.infer<T> {
  return schema.parse(body)
}

/**
 * Helper function to validate query parameters
 * Returns parsed data or throws ZodError
 */
export function validateQueryParams<T extends z.ZodTypeAny>(
  schema: T,
  searchParams: URLSearchParams
): z.infer<T> {
  const params: Record<string, string | number> = {}

  searchParams.forEach((value, key) => {
    // Try to parse as number if it looks like a number
    const numValue = Number(value)
    params[key] = !isNaN(numValue) && value !== '' ? numValue : value
  })

  return schema.parse(params)
}

/**
 * Safe validation wrapper that returns error response data
 * instead of throwing
 */
export function safeValidate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string; details: z.ZodError } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return {
    success: false,
    error: 'Validation failed',
    details: result.error,
  }
}
