import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { createApiLogger } from '@/lib/utils/logger'

/**
 * Generate quick workout using AI with automatic fallback
 * Tries OpenAI first, falls back to Claude if OpenAI fails
 */
async function generateWithAIFallback(
  systemPrompt: string,
  userPrompt: string,
  log: any,
  userId: string
): Promise<{ content: string; provider: 'openai' | 'claude' }> {
  const openaiKey = process.env.OPENAI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  // Try OpenAI first
  if (openaiKey) {
    try {
      log.info('Attempting quick workout generation with OpenAI', undefined, {
        userId,
        provider: 'openai'
      })

      const openai = new OpenAI({ apiKey: openaiKey })

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
        max_tokens: 4096
      })

      const content = completion.choices[0].message.content

      if (!content) {
        throw new Error('Empty response from OpenAI')
      }

      log.info('✅ Successfully generated quick workout with OpenAI', undefined, {
        userId,
        provider: 'openai',
        tokensUsed: completion.usage?.total_tokens
      })

      return { content, provider: 'openai' }

    } catch (openaiError: any) {
      log.warn('OpenAI generation failed, will try Claude fallback', openaiError, {
        userId,
        provider: 'openai',
        errorMessage: openaiError.message
      })
    }
  }

  // Fallback to Claude
  if (!anthropicKey) {
    throw new Error('Both OpenAI and Anthropic API keys are missing. Cannot generate workout.')
  }

  try {
    log.info('Attempting quick workout generation with Claude (fallback)', undefined, {
      userId,
      provider: 'claude'
    })

    const anthropic = new Anthropic({ apiKey: anthropicKey })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    log.info('✅ Successfully generated quick workout with Claude', undefined, {
      userId,
      provider: 'claude',
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens
    })

    return { content: content.text, provider: 'claude' }

  } catch (claudeError: any) {
    log.error('Claude generation failed', claudeError, undefined, {
      userId,
      provider: 'claude',
      errorMessage: claudeError.message
    })

    throw new Error(`Both AI providers failed. OpenAI: ${openaiKey ? 'attempted' : 'no key'}. Claude: ${claudeError.message}`)
  }
}

/**
 * Generate a single quick workout using AI
 *
 * POST /api/workouts/generate-quick-workout
 *
 * Body:
 * - bodyPart: string (e.g., 'full_body', 'upper_body', 'lower_body', 'push', 'pull', 'legs', 'arms', 'core')
 * - muscleGroups: string[] (target muscle groups)
 * - duration: number (workout duration in minutes)
 * - intensity: string ('light', 'moderate', 'intense')
 */
export async function POST(request: NextRequest) {
  const log = createApiLogger(request)

  try {
    const body = await request.json()
    const { bodyPart, muscleGroups, duration, intensity } = body

    // Basic validation
    if (!bodyPart || !muscleGroups || !duration || !intensity) {
      return NextResponse.json(
        { error: 'Missing required fields: bodyPart, muscleGroups, duration, intensity' },
        { status: 400 }
      )
    }

    // Get user from request (assuming auth middleware has set this)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database service not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get auth user from cookies
    const cookieHeader = request.headers.get('cookie') || ''
    const sessionMatch = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/)

    let userId: string | null = null

    if (sessionMatch) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(sessionMatch[1]))
        userId = sessionData?.user?.id
      } catch (e) {
        log.warn('Failed to parse session from cookie', e as Error)
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    log.info('Generating quick workout', undefined, {
      userId,
      bodyPart,
      duration,
      intensity,
      muscleGroups
    })

    // Fetch user profile and equipment
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      log.error('Failed to fetch user profile', profileError as Error, undefined, { userId })
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Fetch available exercises from exercise library
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercise_library')
      .select('*')
      .limit(500)

    if (exercisesError) {
      log.error('Failed to fetch exercises', exercisesError as Error, undefined, { userId })
      return NextResponse.json(
        { error: 'Failed to fetch exercises' },
        { status: 500 }
      )
    }

    // Build system prompt
    const systemPrompt = `You are an expert fitness coach creating a personalized quick workout.

Your task is to generate a single workout session based on the user's preferences, equipment, and target muscle groups.

CRITICAL RULES:
1. Return ONLY valid JSON matching the exact schema below
2. Use ONLY exercises from the provided exercise library
3. Match exercises to the user's available equipment
4. Design the workout for the specified duration and intensity
5. Target the specified muscle groups appropriately
6. Include warm-up and cool-down exercises
7. Provide clear instructions for sets, reps, and rest periods

RESPONSE FORMAT (must be valid JSON):
{
  "workout_name": "string (e.g., 'Upper Body Power Session')",
  "estimated_duration_minutes": number,
  "muscle_groups": ["string array of primary muscle groups"],
  "exercises": [
    {
      "exercise_id": "string (must match an ID from the exercise library)",
      "exercise_name": "string (must match name from exercise library)",
      "sets": number,
      "reps_min": number,
      "reps_max": number,
      "rest_seconds": number,
      "notes": "string (optional tips or form cues)"
    }
  ]
}

INTENSITY GUIDELINES:
- light: Lower volume, moderate weight, longer rest
- moderate: Balanced volume and intensity
- intense: Higher volume, shorter rest, challenging loads

DURATION GUIDELINES:
- 20 min: 4-5 exercises, 2-3 sets each
- 30 min: 5-7 exercises, 3 sets each
- 45 min: 7-9 exercises, 3-4 sets each
- 60 min: 9-12 exercises, 3-4 sets each`

    const userPrompt = `Generate a quick workout with these parameters:

WORKOUT PARAMETERS:
- Body Part Focus: ${bodyPart}
- Target Muscle Groups: ${muscleGroups.join(', ')}
- Duration: ${duration} minutes
- Intensity: ${intensity}

USER PROFILE:
- Fitness Goal: ${profile.goal || 'general fitness'}
- Gym Access: ${profile.gym_access ? 'Yes' : 'No (home workout)'}
- Available Equipment: ${profile.available_equipment?.join(', ') || 'bodyweight only'}

EXERCISE LIBRARY (use ONLY exercises from this list):
${exercises?.slice(0, 200).map((ex: any) =>
  `ID: ${ex.id}, Name: ${ex.name}, Category: ${ex.category}, Equipment: ${ex.equipment || 'bodyweight'}, Muscles: ${ex.primary_muscles?.join(', ') || 'N/A'}`
).join('\n')}

Generate a workout that:
1. Uses exercises appropriate for the user's equipment
2. Targets the specified muscle groups
3. Fits within the ${duration}-minute timeframe
4. Matches the ${intensity} intensity level
5. Includes proper warm-up and cool-down

Return ONLY the JSON object, no other text.`

    // Generate workout with AI
    const { content, provider } = await generateWithAIFallback(
      systemPrompt,
      userPrompt,
      log,
      userId
    )

    // Parse AI response
    let workoutData
    try {
      workoutData = JSON.parse(content)
    } catch (parseError) {
      log.error('Failed to parse AI response', parseError as Error, undefined, {
        userId,
        provider,
        responseLength: content.length
      })
      return NextResponse.json(
        { error: 'Failed to parse workout data from AI' },
        { status: 500 }
      )
    }

    // Validate workout structure
    if (!workoutData.workout_name || !workoutData.exercises || !Array.isArray(workoutData.exercises)) {
      log.error('Invalid workout structure from AI', new Error('Invalid structure'), undefined, {
        userId,
        provider,
        hasName: !!workoutData.workout_name,
        hasExercises: !!workoutData.exercises,
        isArray: Array.isArray(workoutData.exercises)
      })
      return NextResponse.json(
        { error: 'Invalid workout structure generated' },
        { status: 500 }
      )
    }

    log.info('Quick workout generated successfully', undefined, {
      userId,
      provider,
      workoutName: workoutData.workout_name,
      exerciseCount: workoutData.exercises.length,
      duration: workoutData.estimated_duration_minutes
    })

    return NextResponse.json({
      success: true,
      workout: {
        id: `quick-${Date.now()}`, // Temporary ID for quick workouts
        workout_name: workoutData.workout_name,
        estimated_duration_minutes: workoutData.estimated_duration_minutes || duration,
        muscle_groups: workoutData.muscle_groups || muscleGroups,
        plan_exercises: workoutData.exercises.map((ex: any) => ({
          exercise: {
            id: ex.exercise_id,
            name: ex.exercise_name
          },
          target_sets: ex.sets,
          target_reps_min: ex.reps_min,
          target_reps_max: ex.reps_max,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes || ''
        })),
        is_quick_workout: true // Flag to identify quick workouts
      }
    })

  } catch (error: any) {
    log.error('Error generating quick workout', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to generate quick workout',
        details: error.message
      },
      { status: 500 }
    )
  }
}
