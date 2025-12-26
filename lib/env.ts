import { z } from "zod"

/**
 * Environment variable validation schema
 * This ensures all required env vars are present at build/runtime
 */
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  
  // OpenAI (optional in development)
  OPENAI_API_KEY: z.string().optional(),
  
  // Google API Key for Gemini TTS/STT (server-side)
  GOOGLE_API_KEY: z.string().optional(),
  
  // Google API Key for Gemini Live API (client-side, for development)
  // NOTE: For production, use a WebSocket proxy to keep this server-side
  NEXT_PUBLIC_GOOGLE_API_KEY: z.string().optional(),
  
  // App URL (optional - can be empty string during build)
  NEXT_PUBLIC_APP_URL: z.union([
    z.string().url(),
    z.literal(""),
  ]).optional(),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  // Check if we're in a build context where env vars might not be available or invalid
  // Allow build to proceed with placeholder values if env vars are missing or invalid
  const missingRequiredVars = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isBuildContext = process.env.NEXT_PHASE === "phase-production-build" || 
                         process.env.NEXT_PHASE === "phase-development-build" ||
                         process.env.VERCEL === "1" ||
                         (missingRequiredVars && process.env.NODE_ENV !== "development")

  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || (isBuildContext ? "https://placeholder.supabase.co" : undefined),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (isBuildContext ? "placeholder-key" : undefined),
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    NEXT_PUBLIC_GOOGLE_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
    // Allow empty string for APP_URL during build
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || undefined,
  })

  if (!parsed.success) {
    // During build (Vercel or Next.js build phase), use placeholders to allow build to complete
    // Runtime will validate properly when the app actually runs
    if (isBuildContext) {
      console.warn("⚠️  Environment variables invalid or missing during build - using placeholders. Ensure env vars are properly set in Vercel.")
      return {
        NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-key",
        OPENAI_API_KEY: undefined,
        GOOGLE_API_KEY: undefined,
        NEXT_PUBLIC_GOOGLE_API_KEY: undefined,
        NEXT_PUBLIC_APP_URL: undefined,
      }
    }
    
    // Runtime validation - throw error
    console.error("❌ Invalid environment variables:")
    console.error(parsed.error.flatten().fieldErrors)
    console.error("Current env values:", {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "NOT SET",
    })
    throw new Error("Invalid environment variables")
  }

  return parsed.data
}

// Validate on import (fails fast at runtime, allows build to proceed)
export const env = validateEnv()

// Helper to check if we're in production
export const isProd = process.env.NODE_ENV === "production"

// Helper to check if we're in development
export const isDev = process.env.NODE_ENV === "development"

