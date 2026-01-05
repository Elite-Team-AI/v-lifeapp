/**
 * ExerciseDB API Client
 * 
 * Fetches exercise data from ExerciseDB API via RapidAPI.
 * Implements 1-hour cache per ExerciseDB Terms of Use (no persistent storage allowed).
 */

const EXERCISEDB_BASE_URL = "https://exercisedb-api1.p.rapidapi.com"
const EXERCISEDB_HOST = "exercisedb-api1.p.rapidapi.com"
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

interface CacheEntry {
  data: ExerciseDBExercise
  timestamp: number
}

// In-memory cache (per Terms of Use: max 1-hour cache)
const cache = new Map<string, CacheEntry>()

export interface ExerciseDBExercise {
  exerciseId: string
  name: string
  imageUrl: string
  equipments: string[]
  bodyParts: string[]
  gender: string
  exerciseType: string
  targetMuscles: string[]
  secondaryMuscles: string[]
  videoUrl: string
  keywords: string[]
  overview: string
  instructions: string[]
  exerciseTips: string[]
  variations: string[]
  relatedExerciseIds: string[]
}

interface ExerciseDBResponse {
  success: boolean
  meta?: {
    total: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    nextCursor?: string
    previousCursor?: string
  }
  data: ExerciseDBExercise[]
  error?: {
    code: number
    message: string
  }
}

/**
 * Get RapidAPI key from environment
 */
function getApiKey(): string {
  const key = process.env.RAPIDAPI_KEY
  if (!key) {
    throw new Error("RAPIDAPI_KEY environment variable is not set")
  }
  return key
}

/**
 * Search for exercises by name (fuzzy matching)
 */
export async function searchExerciseByName(exerciseName: string): Promise<ExerciseDBExercise | null> {
  // Check cache first
  const cacheKey = `search:${exerciseName.toLowerCase()}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const apiKey = getApiKey()
    const url = new URL(`${EXERCISEDB_BASE_URL}/api/v1/exercises/search`)
    url.searchParams.set("search", exerciseName)
    url.searchParams.set("limit", "1")

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-rapidapi-host": EXERCISEDB_HOST,
        "x-rapidapi-key": apiKey,
      },
    })

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("[ExerciseDB] Rate limit exceeded")
        return null
      }
      throw new Error(`ExerciseDB API error: ${response.status}`)
    }

    const result: ExerciseDBResponse = await response.json()

    if (!result.success || !result.data || result.data.length === 0) {
      return null
    }

    const exercise = result.data[0]
    
    // Cache the result
    cache.set(cacheKey, {
      data: exercise,
      timestamp: Date.now(),
    })

    return exercise
  } catch (error) {
    console.error("[ExerciseDB] Error searching exercise:", error)
    return null
  }
}

/**
 * Get exercise by ID
 */
export async function getExerciseById(exerciseId: string): Promise<ExerciseDBExercise | null> {
  // Check cache first
  const cacheKey = `id:${exerciseId}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const apiKey = getApiKey()
    const url = `${EXERCISEDB_BASE_URL}/api/v1/exercises/${exerciseId}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": EXERCISEDB_HOST,
        "x-rapidapi-key": apiKey,
      },
    })

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("[ExerciseDB] Rate limit exceeded")
        return null
      }
      if (response.status === 404) {
        return null
      }
      throw new Error(`ExerciseDB API error: ${response.status}`)
    }

    const result: ExerciseDBResponse = await response.json()

    if (!result.success || !result.data || result.data.length === 0) {
      return null
    }

    const exercise = result.data[0]
    
    // Cache the result
    cache.set(cacheKey, {
      data: exercise,
      timestamp: Date.now(),
    })

    return exercise
  } catch (error) {
    console.error("[ExerciseDB] Error fetching exercise:", error)
    return null
  }
}

/**
 * Clean up expired cache entries (run periodically)
 */
export function cleanupCache(): void {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp >= CACHE_TTL_MS) {
      cache.delete(key)
    }
  }
}

// Cleanup cache every 30 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupCache, 30 * 60 * 1000)
}

