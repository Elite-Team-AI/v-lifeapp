import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createApiLogger } from '@/lib/utils/logger'
import { workoutGenerationSchema, safeValidate } from '@/lib/validations/api'

/**
 * Generate a personalized 4-week workout plan using AI
 *
 * POST /api/workouts/generate-plan
 *
 * Body:
 * - userId: string (required)
 * - preferences?: {
 *     trainingStyle?: 'strength' | 'hypertrophy' | 'endurance' | 'mixed'
 *     splitPreference?: 'push_pull_legs' | 'upper_lower' | 'full_body' | 'auto'
 *     exercisesToAvoid?: string[] (exercise IDs)
 *     specificGoals?: string
 *   }
 */
export async function POST(request: NextRequest) {
  const log = createApiLogger(request)
  let body: any = null

  try {
    body = await request.json()

    // Validate request body
    const validation = safeValidate(workoutGenerationSchema, body)
    if (!validation.success) {
      const issues = validation.details.issues || []
      log.warn("Workout plan generation validation failed", undefined, {
        errors: issues
      })
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: issues.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    const { userId, preferences = {} } = validation.data

    log.info("Starting workout plan generation", undefined, {
      userId,
      preferences
    })

    // Validate required environment variables
    const openaiKey = process.env.OPENAI_API_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!openaiKey) {
      log.error("OpenAI API key not configured", new Error("Missing OPENAI_API_KEY"), undefined, { userId })
      return NextResponse.json(
        {
          error: 'AI service not configured',
          message: 'The workout plan generator requires OpenAI configuration. Please contact support.',
          details: 'Missing OPENAI_API_KEY environment variable'
        },
        { status: 500 }
      )
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      log.error("Supabase credentials not configured", new Error("Missing Supabase credentials"), undefined, { userId })
      return NextResponse.json(
        {
          error: 'Database service not configured',
          message: 'Unable to access workout data. Please contact support.',
          details: 'Missing Supabase credentials'
        },
        { status: 500 }
      )
    }

    // Initialize clients at runtime, not build time
    const openai = new OpenAI({
      apiKey: openaiKey,
    })

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 1. Fetch user profile and assessment data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      log.error("User profile not found for workout plan generation", new Error(profileError?.message || "Profile not found"), undefined, {
        userId,
        errorCode: profileError?.code
      })
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    log.debug("User profile loaded", undefined, {
      userId,
      fitnessGoal: profile.fitness_goal,
      experienceLevel: profile.experience_level,
      weeklyWorkoutGoal: profile.weekly_workout_goal
    })

    // 2. Fetch available exercises from library
    // Filter by training modality to get exercises pre-configured for user's training style
    // CRITICAL: Profile is the SINGLE SOURCE OF TRUTH - always use profile.training_style
    const rawTrainingStyle = profile.training_style || preferences.trainingStyle || 'mixed'

    // Map user training styles to exercise_library training_modality values
    // - aesthetics → hypertrophy (bodybuilding = hypertrophy training)
    // - crossfit → mixed (CrossFit combines strength, power, endurance, HIIT)
    let trainingStyle = rawTrainingStyle
    if (rawTrainingStyle === 'aesthetics') {
      trainingStyle = 'hypertrophy'
    } else if (rawTrainingStyle === 'crossfit') {
      trainingStyle = 'mixed'
    }

    log.info("Using training style for exercise selection", undefined, {
      userId,
      rawTrainingStyle,
      mappedTrainingStyle: trainingStyle,
      fromProfile: profile.training_style,
      fromPreferences: preferences.trainingStyle
    })

    const { data: exercises, error: exercisesError } = await supabase
      .from('exercise_library')
      .select('id, name, category, equipment, difficulty, primary_muscles, training_modality, recommended_sets_min, recommended_sets_max, recommended_reps_min, recommended_reps_max, recommended_rest_seconds_min, recommended_rest_seconds_max')
      .eq('is_active', true)
      .eq('training_modality', trainingStyle) // Filter by user's preferred modality

    if (exercisesError) {
      log.error("Failed to fetch exercise library", new Error(exercisesError.message), undefined, {
        userId,
        errorCode: exercisesError.code
      })
      return NextResponse.json(
        { error: 'Failed to fetch exercise library' },
        { status: 500 }
      )
    }

    log.debug("Exercise library loaded", undefined, {
      userId,
      totalExercises: exercises?.length || 0
    })

    // 3. Validate and filter exercises based on user's available equipment
    // Check both available_equipment array AND custom_equipment string (fallback)
    let availableEquipment = profile.available_equipment || []

    // If available_equipment is empty but custom_equipment exists, parse the comma-separated string
    if (availableEquipment.length === 0 && profile.custom_equipment) {
      availableEquipment = profile.custom_equipment.split(',').map((e: string) => e.trim())
      log.info("Using custom_equipment fallback", undefined, {
        userId,
        customEquipment: profile.custom_equipment,
        parsedEquipment: availableEquipment
      })
    }

    // VALIDATE: If no equipment is specified and user hasn't explicitly selected "bodyweight only"
    if (availableEquipment.length === 0 && !preferences.bodyweightOnly) {
      log.warn("No equipment specified for workout generation", undefined, {
        userId,
        trainingStyle: profile.training_style,
        experienceLevel: profile.experience_level
      })
      return NextResponse.json(
        {
          error: 'No equipment specified',
          message: 'Please update your fitness profile with available equipment before generating a workout plan.',
          details: 'Go to Settings → Fitness Profile and select your available equipment. If you want bodyweight-only workouts, please explicitly select "Bodyweight Only" in your equipment preferences.',
          needsEquipment: true
        },
        { status: 400 }
      )
    }

    // Normalize equipment to lowercase for case-insensitive matching
    const normalizedUserEquipment = availableEquipment.map((e: string) => e.toLowerCase())

    const filteredExercises = exercises?.filter(ex => {
      if (!ex.equipment || ex.equipment.length === 0) return true // Bodyweight
      // Case-insensitive equipment matching
      return ex.equipment.some((eq: string) =>
        normalizedUserEquipment.includes(eq.toLowerCase())
      )
    }) || []

    log.info("Exercises filtered by available equipment", undefined, {
      userId,
      availableEquipment,
      totalExercises: exercises?.length || 0,
      filteredExercises: filteredExercises.length
    })

    // Additional validation: If filtering resulted in 0 exercises, alert the user
    if (filteredExercises.length === 0) {
      log.error("No exercises available after equipment filtering", new Error("Equipment mismatch"), undefined, {
        userId,
        trainingStyle,
        availableEquipment,
        totalExercisesBeforeFilter: exercises?.length || 0
      })
      return NextResponse.json(
        {
          error: 'No compatible exercises found',
          message: `No exercises found that match your equipment and training style (${trainingStyle}).`,
          details: `Your equipment: ${availableEquipment.join(', ')}. Please check your equipment selection or choose a different training style.`,
          needsEquipment: true
        },
        { status: 400 }
      )
    }

    // 4. Build AI prompt
    const prompt = buildWorkoutPlanPrompt(profile, filteredExercises, preferences)

    // 5. Call OpenAI to generate plan - WEEK BY WEEK to avoid token limits
    log.info("Generating workout plan week-by-week to avoid token limits", undefined, {
      userId,
      model: 'gpt-4o',
      exercisesAvailable: filteredExercises.length,
      weeksToGenerate: 4
    })

    // Generate each week separately to stay within token limits
    const allWeeks: any[] = []
    let generatedPlan: any = null

    for (let weekNum = 1; weekNum <= 4; weekNum++) {
      log.info(`Generating week ${weekNum} of 4`, undefined, {
        userId,
        weekNumber: weekNum
      })

      // Build week-specific prompt
      const weekPrompt = buildWeekPrompt(profile, filteredExercises, preferences, weekNum, allWeeks)

      let completion
      let aiResponse: string | null = null

      try {
        completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert fitness coach. You respond with valid JSON. CRITICAL: 60-min workouts need EXACTLY 6-7 exercises (NEVER 5), 45-min need 5-6, 30-min need 4-5. 60-min workouts need MINIMUM 12 total sets. Before outputting, COUNT exercises: if 60-min workout has only 5 exercises, ADD ONE MORE to reach 6. Each exercise needs 2-3 sets.'
            },
            {
              role: 'user',
              content: weekPrompt
            }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
          max_tokens: 16384 // Maximum output tokens for gpt-4o
        })

        aiResponse = completion.choices[0].message.content

        // Check if response was truncated due to token limit
        const finishReason = completion.choices[0].finish_reason
        if (finishReason === 'length') {
          log.error(`OpenAI response truncated for week ${weekNum}`, new Error("Response truncated"), undefined, {
            userId,
            weekNumber: weekNum,
            finishReason,
            tokensUsed: completion.usage?.total_tokens,
            maxTokens: 16384,
            responseLength: aiResponse?.length || 0
          })
          return NextResponse.json(
            {
              error: 'AI response incomplete',
              message: `Workout plan generation was incomplete for week ${weekNum}. Please try again with slightly simpler preferences.`,
              details: 'OpenAI response was truncated due to length limit'
            },
            { status: 500 }
          )
        }
      } catch (openaiError: any) {
        // Handle specific OpenAI errors with actionable messages
        const errorMessage = openaiError.message || 'Unknown error'
        const errorStatus = openaiError.status || openaiError.code

        log.error(`OpenAI API call failed for week ${weekNum}`, openaiError, undefined, {
          userId,
          weekNumber: weekNum,
          errorMessage,
          errorStatus,
          errorType: openaiError.type,
          errorCode: openaiError.code
        })

      // Provide specific error messages based on error type
      if (errorStatus === 429 || errorMessage.includes('rate_limit')) {
        return NextResponse.json(
          {
            error: 'AI service temporarily unavailable',
            message: 'The AI service is experiencing high demand. Please try again in a few moments.',
            details: 'OpenAI rate limit exceeded'
          },
          { status: 503 }
        )
      }

      if (errorStatus === 401 || errorMessage.includes('authentication') || errorMessage.includes('api key')) {
        return NextResponse.json(
          {
            error: 'AI service configuration error',
            message: 'There is an issue with the AI service configuration. Please contact support.',
            details: 'OpenAI authentication failed'
          },
          { status: 500 }
        )
      }

      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        return NextResponse.json(
          {
            error: 'AI service timeout',
            message: 'The AI service took too long to respond. Please try again.',
            details: 'OpenAI request timeout'
          },
          { status: 504 }
        )
      }

      if (errorMessage.includes('model') || errorMessage.includes('not found')) {
        return NextResponse.json(
          {
            error: 'AI model unavailable',
            message: 'The requested AI model is currently unavailable. Please try again later.',
            details: `OpenAI model error: ${errorMessage}`
          },
          { status: 503 }
        )
      }

      if (errorMessage.includes('token') || errorMessage.includes('maximum context length')) {
        return NextResponse.json(
          {
            error: 'Request too large',
            message: 'Your workout plan request exceeded the AI processing limits. Please simplify your requirements and try again.',
            details: 'OpenAI token limit exceeded'
          },
          { status: 400 }
        )
      }

        // Generic OpenAI error
        return NextResponse.json(
          {
            error: 'AI service error',
            message: `The AI service encountered an error while generating week ${weekNum}. Please try again.`,
            details: `OpenAI error: ${errorMessage}`
          },
          { status: 500 }
        )
      }

      if (!aiResponse) {
        log.error(`No response received from OpenAI for week ${weekNum}`, new Error("Empty AI response"), undefined, {
          userId,
          weekNumber: weekNum
        })
        return NextResponse.json(
          {
            error: 'Empty AI response',
            message: `The AI service returned an empty response for week ${weekNum}. Please try again.`,
            details: 'No content in OpenAI response'
          },
          { status: 500 }
        )
      }

      log.debug(`AI response received for week ${weekNum}`, undefined, {
        userId,
        weekNumber: weekNum,
        responseLength: aiResponse.length,
        tokensUsed: completion.usage?.total_tokens
      })

      // Parse this week's response
      let weekData
      let sanitizedResponse = aiResponse

      try {
        log.debug(`Attempting to parse week ${weekNum} AI response`, undefined, {
          userId,
          weekNumber: weekNum,
          responsePreview: aiResponse.substring(0, 200),
          responseLength: aiResponse.length
        })

        // Try direct parsing first
        try {
          weekData = JSON.parse(aiResponse)
        } catch (initialError) {
          // Sanitize the response if direct parsing fails
          log.debug(`Direct JSON parse failed for week ${weekNum}, attempting sanitization`, undefined, {
            userId,
            weekNumber: weekNum,
            parseError: initialError.message
          })

          // Remove any markdown code blocks
          sanitizedResponse = aiResponse.replace(/^```json\s*/i, '').replace(/\s*```$/i, '')
          sanitizedResponse = sanitizedResponse.trim()

          // Extract JSON object
          const jsonMatch = sanitizedResponse.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            sanitizedResponse = jsonMatch[0]
          }

          weekData = JSON.parse(sanitizedResponse)

          log.info(`JSON parsing succeeded after sanitization for week ${weekNum}`, undefined, {
            userId,
            weekNumber: weekNum,
            sanitizationApplied: true
          })
        }

        // Store week data - if this is week 1, it contains the plan metadata
        if (weekNum === 1) {
          generatedPlan = weekData
          // Ensure weeks array exists
          if (!generatedPlan.weeks) {
            generatedPlan.weeks = []
          }
        }

        // Extract the week object and add to allWeeks
        if (weekData.weeks && weekData.weeks.length > 0) {
          allWeeks.push(weekData.weeks[0])
          log.info(`Week ${weekNum} added to plan`, undefined, {
            userId,
            weekNumber: weekNum,
            workoutsInWeek: weekData.weeks[0].workouts?.length || 0
          })
        } else if (weekData.weekNumber) {
          // If the response directly contains the week data
          allWeeks.push(weekData)
          log.info(`Week ${weekNum} added to plan (direct format)`, undefined, {
            userId,
            weekNumber: weekNum,
            workoutsInWeek: weekData.workouts?.length || 0
          })
        }

      } catch (parseError: any) {
        log.error(`Failed to parse OpenAI response for week ${weekNum}`, parseError, undefined, {
          userId,
          weekNumber: weekNum,
          parseErrorMessage: parseError.message,
          aiResponsePreview: aiResponse.substring(0, 500),
          sanitizedPreview: sanitizedResponse.substring(0, 500)
        })
        return NextResponse.json(
          {
            error: 'AI response parsing failed',
            message: `The AI generated an invalid format for week ${weekNum}. Please try again.`,
            details: `JSON parse error: ${parseError.message}`
          },
          { status: 500 }
        )
      }
    }

    // Combine all weeks into the final plan
    if (generatedPlan) {
      generatedPlan.weeks = allWeeks
    } else {
      return NextResponse.json(
        {
          error: 'Plan generation failed',
          message: 'Failed to generate base plan structure. Please try again.'
        },
        { status: 500 }
      )
    }

    log.info("All 4 weeks generated successfully", undefined, {
      userId,
      totalWeeks: allWeeks.length,
      planName: generatedPlan.planName
    })

    // 6. Validate the generated plan structure
    const validationError = validatePlanStructure(generatedPlan)
    if (validationError) {
      log.error("Generated plan failed validation", new Error(validationError), undefined, {
        userId,
        validationError,
        planName: generatedPlan.planName
      })
      return NextResponse.json(
        { error: `Invalid plan structure: ${validationError}` },
        { status: 500 }
      )
    }

    log.debug("Plan structure validated successfully", undefined, {
      userId,
      planName: generatedPlan.planName,
      weeks: generatedPlan.weeks?.length
    })

    // 6.5. Validate plan matches user profile requirements
    const expectedDaysPerWeek = profile.training_days_per_week || profile.weekly_workout_goal || 3
    if (generatedPlan.daysPerWeek !== expectedDaysPerWeek) {
      log.error("Generated plan days per week mismatch", new Error("Days per week mismatch"), undefined, {
        userId,
        expectedDaysPerWeek,
        generatedDaysPerWeek: generatedPlan.daysPerWeek,
        profileWeeklyGoal: profile.weekly_workout_goal,
        profileTrainingDays: profile.training_days_per_week
      })
      return NextResponse.json(
        {
          error: `Plan generation error: Generated plan has ${generatedPlan.daysPerWeek} workouts per week but your profile specifies ${expectedDaysPerWeek} days per week. Please regenerate or update your profile.`
        },
        { status: 500 }
      )
    }

    log.info("Plan validated against profile requirements", undefined, {
      userId,
      daysPerWeek: generatedPlan.daysPerWeek,
      trainingStyle: profile.training_style,
      matchesProfile: true
    })

    // 7. Save plan to database
    log.info("Saving generated workout plan to database", undefined, {
      userId,
      planName: generatedPlan.planName,
      planType: generatedPlan.planType
    })
    const savedPlan = await savePlanToDatabase(supabase, userId, generatedPlan, profile, preferences, log)

    log.info("Workout plan generated and saved successfully", undefined, {
      userId,
      planId: savedPlan.planId,
      planName: generatedPlan.planName,
      weeks: generatedPlan.weeks.length,
      workoutsPerWeek: generatedPlan.daysPerWeek
    })

    return NextResponse.json({
      success: true,
      planId: savedPlan.planId,
      plan: {
        name: generatedPlan.planName,
        type: generatedPlan.planType,
        weeks: generatedPlan.weeks.length,
        workoutsPerWeek: generatedPlan.daysPerWeek,
        startDate: savedPlan.startDate,
        endDate: savedPlan.endDate
      },
      message: 'Workout plan generated successfully'
    })

  } catch (error: any) {
    log.error("Workout plan generation failed", error as Error, undefined, {
      hasUserId: !!body?.userId,
      errorMessage: error.message
    })
    return NextResponse.json(
      {
        error: 'Failed to generate workout plan',
        details: error.message
      },
      { status: 500 }
    )
  }
}

function buildWorkoutPlanPrompt(profile: any, exercises: any[], preferences: any): string {
  const {
    trainingStyle = profile.training_style || 'mixed',
    splitPreference = 'auto',
    exercisesToAvoid = [],
    specificGoals = ''
  } = preferences

  // Filter out exercises to avoid
  const availableExercises = exercises.filter(ex => !exercisesToAvoid.includes(ex.id))

  // CRITICAL: Use profile values as the single source of truth
  const daysPerWeek = profile.training_days_per_week || profile.weekly_workout_goal || 3
  const userTrainingStyle = profile.training_style || trainingStyle

  return `Generate a personalized 4-week workout mesocycle for a user with the following profile:

**USER PROFILE (SINGLE SOURCE OF TRUTH - YOU MUST USE THESE EXACT VALUES):**
- Age: ${profile.age || 'Unknown'}
- Gender: ${profile.gender || 'Unknown'}
- Fitness Goal: ${profile.fitness_goal || profile.primary_goal || 'General fitness'}
- Experience Level: ${profile.experience_level || 'beginner'}
- Available Equipment: ${profile.available_equipment?.join(', ') || profile.custom_equipment || 'Bodyweight only'}
- Workout Location: ${profile.workout_location || profile.gym_access || 'Home'}
- Preferred Workout Time: ${profile.preferred_workout_time || 'Flexible'}
- ⚠️ MANDATORY DAYS PER WEEK: ${daysPerWeek} (YOU MUST GENERATE EXACTLY ${daysPerWeek} WORKOUTS PER WEEK - NOT ${daysPerWeek - 1}, NOT ${daysPerWeek + 1}, EXACTLY ${daysPerWeek})

**ASSESSMENT DATA:**
${profile.push_ups ? `- Push-ups: ${profile.push_ups}` : ''}
${profile.pull_ups ? `- Pull-ups: ${profile.pull_ups}` : ''}
${profile.squat_depth ? `- Squat depth: ${profile.squat_depth}` : ''}
${profile.plank_time ? `- Plank time: ${profile.plank_time}s` : ''}

**MOBILITY SCORES:**
${profile.shoulder_mobility ? `- Shoulder: ${profile.shoulder_mobility}/10` : ''}
${profile.hip_mobility ? `- Hip: ${profile.hip_mobility}/10` : ''}
${profile.ankle_mobility ? `- Ankle: ${profile.ankle_mobility}/10` : ''}

**PREFERENCES:**
- ⚠️ MANDATORY Training Style: ${userTrainingStyle} (THIS IS THE USER'S SELECTED TRAINING MODALITY - YOU MUST FOLLOW THIS)
- Split Preference: ${splitPreference}
${specificGoals ? `- Specific Goals: ${specificGoals}` : ''}

**AVAILABLE EXERCISES (${availableExercises.length} total - showing top 25):**

${availableExercises.slice(0, 25).map(ex =>
  `${ex.id}|${ex.name}|${ex.category}|${ex.primary_muscles?.join(',')}`
).join('\n')}

**CRITICAL MANDATORY REQUIREMENTS - YOU MUST FOLLOW THESE:**

⚠️⚠️⚠️ **BEFORE YOU OUTPUT YOUR RESPONSE, COUNT THE EXERCISES IN EACH WORKOUT** ⚠️⚠️⚠️

**EXERCISE COUNT VALIDATION CHECKLIST (MUST BE 100% CHECKED):**
- [ ] Does EVERY 60-minute workout have AT LEAST 6 exercises? (Target: 6-7 exercises)
- [ ] Does EVERY 45-minute workout have AT LEAST 5 exercises? (Target: 6-7 exercises)
- [ ] Does EVERY 60-minute workout have AT LEAST 12 total sets? (Target: 12-16 sets)
- [ ] Does EVERY 45-minute workout have AT LEAST 10 total sets? (Target: 12-14 sets)
- [ ] Does each exercise have 2 sets minimum? (Ideally 2-3 sets per exercise)
- [ ] Have I used EXACT UUIDs from the available exercises list (not sequential numbers)?

**REALITY CHECK - COMMON FAILURE MODES:**
- 5 exercises in 60 minutes = REJECTION → ADD 1 MORE EXERCISE NOW
- 4 exercises in 60 minutes = REJECTION → ADD 2 MORE EXERCISES NOW
- 10-11 total sets in 60 minutes = REJECTION → INCREASE SETS PER EXERCISE (use 2 sets minimum)
- Using only 1 set per exercise = INSUFFICIENT VOLUME → USE 2 SETS MINIMUM

**IF ANY CHECKBOX IS UNCHECKED, YOUR RESPONSE WILL BE REJECTED. GO BACK AND ADD MORE EXERCISES.**

**REQUIREMENTS:**

1. **4-Week Mesocycle Structure:**
   - Week 1: Baseline/Learning phase (moderate volume)
   - Week 2: Volume increase (+10% from Week 1)
   - Week 3: Peak week (highest volume/intensity)
   - Week 4: Deload week (60-70% volume for recovery)

2. **Progressive Overload:**
   - Increase weight OR reps OR sets each week (Weeks 1-3)
   - Week 4 reduces volume for recovery

3. **Split Design:**
   - If splitPreference is 'auto', choose the best split based on days per week:
     - 3 days: Full body
     - 4 days: Upper/Lower
     - 5 days: Push/Pull/Legs
     - 6 days: Push/Pull/Legs (2x per week)
   - Otherwise, use the specified split

4. **Exercise Selection - CRITICAL REQUIREMENTS:**
   - ⚠️ MANDATORY: For each exercise, you MUST copy and paste the EXACT UUID from the "ID:" field in the AVAILABLE EXERCISES list above
   - ⚠️ DO NOT generate sequential numbers like "1", "2", "3" - these will cause database errors
   - ⚠️ DO NOT make up exercise IDs - only use the exact UUIDs provided above (they look like "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
   - 🎯 **USE MODALITY-SPECIFIC RECOMMENDATIONS:** Each exercise above includes pre-configured sets/reps/rest recommendations for ${userTrainingStyle} training. Use these values as your baseline when programming workouts.

   **MINIMUM EXERCISES BASED ON WORKOUT DURATION:**
   - 30-40 minutes: 4 exercises, 8-10 total sets
   - 45-55 minutes: 5 exercises, 10-12 total sets
   - 60-75 minutes: 6 exercises minimum, 12+ total sets (target: 6-7 exercises)
   - 75+ minutes: 7 exercises, 14+ total sets

   **CRITICAL SET COUNT REQUIREMENTS:**
   - Each exercise should have 2 sets minimum (ideally 2-3 sets)
   - Primary compound exercises: 2-3 sets
   - Secondary compounds: 2 sets
   - Isolation exercises: 2 sets
   - For 60-minute workouts: 12+ total sets required (7 exercises × 2 sets = 14 sets minimum, target 16+ sets)

   **EXERCISE DISTRIBUTION BY SPLIT:**
   - Push/Pull/Legs: 6-7 exercises per workout
   - Upper/Lower: 6-7 exercises per workout
   - Full Body: 6-7 exercises per workout

   - Only select exercises from the provided list
   - Prioritize compound movements first (2-3 compounds per workout)
   - Follow with isolation/accessory exercises (5-7 accessories per workout)
   - Include mobility work if scores are low (<6/10)
   - Balance muscle groups within each workout
   - Vary exercises across the mesocycle (don't repeat the same exercise every week)

5. **TRAINING STYLE-SPECIFIC PROGRAMMING:**

   **A. STRENGTH TRAINING (${userTrainingStyle === 'strength' ? 'CURRENT SELECTION - FOLLOW THIS' : 'Reference only'}):**
   - Focus: Maximum force production and neural adaptations
   - Primary Compounds: 3-5 sets of 3-6 reps at 85-95% 1RM (RPE 8-9)
   - Secondary Compounds: 3-4 sets of 5-8 reps at 75-85% 1RM (RPE 7-8)
   - Accessories: 2-3 sets of 8-10 reps at 65-75% 1RM (RPE 6-7)
   - Rest Periods: 3-5 minutes for main lifts, 2-3 minutes for accessories
   - Exercise Selection Priority:
     * Barbell compound movements (Squat, Bench, Deadlift, OHP, Rows)
     * Heavy dumbbell compounds
     * Supporting accessories for weak points
   - Total Volume: 12-18 sets per workout
   - Example 60min Push Day (6 exercises): Bench Press (3x5), Incline Barbell Press (2x6), Overhead Press (2x6), Dips (2x8), Lateral Raises (2x10), Tricep Extensions (2x10) = 13 sets ✅

   **B. HYPERTROPHY/BODYBUILDING (${userTrainingStyle === 'hypertrophy' ? 'CURRENT SELECTION - FOLLOW THIS' : 'Reference only'}):**
   - Focus: Muscle growth through mechanical tension and metabolic stress
   - Primary Compounds: 3-4 sets of 6-10 reps at 70-80% 1RM (RPE 7-8)
   - Secondary Compounds: 3-4 sets of 8-12 reps at 65-75% 1RM (RPE 7-8)
   - Isolation Exercises: 3-4 sets of 10-15 reps at 60-70% 1RM (RPE 7-8)
   - Rest Periods: 90-120 seconds for compounds, 60-90 seconds for isolation
   - Exercise Selection Priority:
     * Mix of barbell, dumbbell, and machine exercises
     * Multiple exercises per muscle group (3-4 for major muscles)
     * Variety of angles and movement patterns
     * Include drop sets, supersets, and intensity techniques
   - Total Volume: 18-24 sets per workout
   - Example 60min Push Day (6 exercises): Barbell Bench Press (4x8), Incline Dumbbell Press (3x10), Machine Chest Press (3x12), Overhead Press (3x8), Lateral Raises (3x12), Tricep Pushdowns (3x12) = 19 sets ✅

   **C. ENDURANCE/CONDITIONING (${userTrainingStyle === 'endurance' ? 'CURRENT SELECTION - FOLLOW THIS' : 'Reference only'}):**
   - Focus: Muscular endurance and cardiovascular conditioning
   - Compound Circuits: 2-3 sets of 15-20 reps at 50-65% 1RM (RPE 6-7)
   - Isolation Circuits: 2-3 sets of 20-25 reps at 45-55% 1RM (RPE 5-6)
   - Cardio Intervals: Include burpees, mountain climbers, jump rope, etc.
   - Rest Periods: 30-60 seconds between exercises, 2-3 minutes between circuits
   - Exercise Selection Priority:
     * Multi-joint movements that elevate heart rate
     * Bodyweight exercises and lighter weights
     * Plyometric and explosive movements
     * Circuit-style programming
   - Total Volume: 18-24 sets per workout
   - Example 60min Circuit (6 exercises): Squat (3x20), Push-ups (3x20), Lunges (3x20), Rows (3x20), Burpees (3x15), Mountain Climbers (3x30s) = 18 sets ✅

   **D. MIXED/BALANCED (${userTrainingStyle === 'mixed' ? 'CURRENT SELECTION - FOLLOW THIS' : 'Reference only'}):**
   - Focus: Balanced development across strength, size, and endurance
   - Main Lifts: 4 sets of 5-8 reps at 75-85% 1RM (RPE 7-8) - Strength emphasis
   - Secondary Compounds: 3-4 sets of 8-12 reps at 65-75% 1RM (RPE 7-8) - Hypertrophy emphasis
   - Accessories: 3 sets of 12-15 reps at 60-70% 1RM (RPE 6-7) - Endurance emphasis
   - Rest Periods: Vary based on exercise (3min for strength, 90s for hypertrophy, 60s for endurance)
   - Total Volume: 18-24 sets per workout
   - Example 60min Upper Day (6 exercises): Bench Press (4x6), Barbell Rows (4x6), Incline Press (3x10), Pull-ups (3x10), Bicep Curls (3x12), Tricep Extensions (3x12) = 20 sets ✅

6. **Workout Structure Template - MUST FOLLOW:**

   **For ${userTrainingStyle.toUpperCase()} training style, each workout MUST include:**

   ${userTrainingStyle === 'strength' ? `
   - Exercise 1: Primary Compound (Squat/Bench/Dead/OHP variant) - 3-4 sets of 3-6 reps
   - Exercise 2: Secondary Compound (variation of main lift) - 3 sets of 5-8 reps
   - Exercise 3: Supporting Compound - 3 sets of 6-8 reps
   - Exercise 4: Compound Accessory - 2 sets of 8-10 reps
   - Exercise 5: Primary Isolation - 2 sets of 8-10 reps
   - Exercise 6: Secondary Isolation - 2 sets of 8-12 reps
   MINIMUM: 6 exercises, 16-20 total sets` : ''}

   ${userTrainingStyle === 'hypertrophy' ? `
   - Exercise 1: Primary Compound Movement - 4 sets of 6-10 reps
   - Exercise 2: Secondary Compound (different angle) - 3 sets of 8-12 reps
   - Exercise 3: Tertiary Compound/Machine - 3 sets of 10-12 reps
   - Exercise 4: Isolation Exercise - Muscle Group 1 - 3 sets of 10-15 reps
   - Exercise 5: Isolation Exercise - Muscle Group 2 - 3 sets of 10-15 reps
   - Exercise 6: Pump/Burnout Exercise - 3 sets of 12-15 reps
   MINIMUM: 6 exercises, 18-24 total sets` : ''}

   ${userTrainingStyle === 'endurance' ? `
   - Circuit 1: 3 exercises x 3 rounds (compound movements, 15-20 reps each)
   - Circuit 2: 3 exercises x 3 rounds (mix of strength and cardio, 15-20 reps each)
   MINIMUM: 6 total exercises, 18-24 total sets` : ''}

   ${userTrainingStyle === 'mixed' ? `
   - Exercise 1: Primary Strength Compound - 4 sets of 5-8 reps
   - Exercise 2: Secondary Strength Compound - 3 sets of 5-8 reps
   - Exercise 3: Hypertrophy Compound - 3 sets of 8-12 reps
   - Exercise 4: Isolation Exercise - 3 sets of 10-12 reps
   - Exercise 5: Isolation Exercise - 3 sets of 12-15 reps
   - Exercise 6: Endurance Exercise - 3 sets of 15-20 reps
   MINIMUM: 6 exercises, 18-24 total sets` : ''}

7. **EXERCISE COUNT REQUIREMENTS (PER WORKOUT):**

   **60-MINUTE WORKOUT EXAMPLE:**
   1. Primary Compound - 3 sets x 6 reps
   2. Secondary Compound - 3 sets x 8 reps
   3. Tertiary Compound - 2 sets x 10 reps
   4. Isolation Exercise 1 - 2 sets x 12 reps
   5. Isolation Exercise 2 - 2 sets x 12 reps
   6. Isolation Exercise 3 - 2 sets x 12 reps
   **TOTAL: 6 EXERCISES, 14 SETS** ✅

**TRAINING MODALITIES - SELECT PRIMARY MODALITY BASED ON USER GOALS:**

1. **Strength Training** - Goal: Build force, muscle, structural resilience
   - Focus: Barbell training (squat, deadlift, bench), dumbbells/kettlebells, bodyweight, machines
   - Includes: Powerlifting and hypertrophy bodybuilding approaches
   - Benefits: Builds muscle, bone density, joint stability, metabolic health
   - This is your "armor"
   - Use when: User wants to build strength, muscle mass, or improve structural fitness

2. **Cardiovascular (Aerobic) Training** - Goal: Improve heart & lung efficiency
   - Focus: Steady-state running, cycling, rowing, swimming, walking, Zone 2 training
   - Benefits: Improves endurance, recovery capacity, longevity markers
   - This is your "engine"
   - Use when: User wants endurance, weight loss, or cardiovascular health

3. **High-Intensity Interval Training (HIIT)** - Goal: Max effort bursts + recovery
   - Focus: Sprint intervals, assault bike intervals, circuit training, CrossFit-style WODs
   - Benefits: Time-efficient conditioning, metabolic spike, VO2 max improvements
   - This is your "turbo mode"
   - Use when: User has limited time and wants maximum calorie burn and conditioning

4. **Power / Explosive Training** - Goal: Develop speed + force production
   - Focus: Olympic lifts, box jumps, medicine ball throws, sprinting, plyometrics
   - Benefits: Athleticism, nervous system efficiency
   - This is your "snap"
   - Use when: User wants athletic performance, sports-specific power

5. **Mobility & Flexibility Training** - Goal: Improve range of motion + joint health
   - Focus: Dynamic stretching, static stretching, PNF stretching, CARs (Controlled Articular Rotations), yoga mobility flows
   - Benefits: Injury prevention, performance longevity
   - This is your "maintenance"
   - Use when: User has mobility limitations (scores <6/10) or injury history

6. **Functional Training** - Goal: Real-world movement patterns
   - Focus: Carries (farmer's carry), rotational work, single-leg training, core stabilization, sandbags/sled pushes
   - Benefits: Improves how you move outside the gym
   - This is your "real life strength"
   - Use when: User wants practical, real-world fitness

7. **Mind-Body Modalities** - Goal: Nervous system regulation + internal control
   - Focus: Yoga, Pilates, Tai Chi, breathwork, isometric holds
   - Benefits: Stress reduction, posture, core integration
   - This is your "control center"
   - Use when: User needs stress management, mind-body connection

8. **Sport-Specific Training** - Goal: Improve performance in a particular sport
   - Focus: Agility drills, skill work, game simulation, position-based conditioning
   - Benefits: Targeted adaptation for competition
   - Use when: User has specific sport performance goals

**PRIMARY MODALITY FOR THIS USER:**
⚠️ MANDATORY: The user has selected "${userTrainingStyle}" as their training style. You MUST use this as the PRIMARY modality. Based on the user's profile (goal: ${profile.fitness_goal || profile.primary_goal}, training style: ${userTrainingStyle}), explain why ${userTrainingStyle} training is appropriate for achieving their goal.

**⚠️ FINAL CHECKLIST - VERIFY BEFORE RESPONDING:**

1. **Plan Structure:** EXACTLY 4 weeks in the "weeks" array
2. **Workouts per Week:** Each week has correct number of workouts (daysPerWeek)
3. **60-minute workouts:** AT LEAST 6 exercises (target: 6-7)
4. **45-minute workouts:** AT LEAST 5 exercises
5. **Total sets:** AT LEAST 12 total sets per 60-min workout (2 sets per exercise minimum)
6. **Exercise IDs:** Use EXACT UUIDs from the available exercises list

**EXAMPLE:** 6 exercises × 2 sets = 12 total sets ✅

**OUTPUT FORMAT (JSON) - YOU MUST RETURN THE COMPLETE STRUCTURE BELOW:**

⚠️ **CRITICAL:** Your response must include ALL 4 weeks with complete workout details for each week ⚠️

IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or comments.

{
  "planName": "Personalized 4-Week Mesocycle",
  "planType": "push_pull_legs",
  "daysPerWeek": 5,
  "splitPattern": "3-1-2-1",
  "primaryModality": "strength_training",
  "secondaryModalities": ["mobility_flexibility", "cardiovascular"],
  "planRationale": {
    "whyThisPlan": "Detailed explanation of why THIS specific plan design was chosen for this user (2-3 sentences)",
    "primaryModalityExplanation": "Why this primary modality is the best fit for your specific goal and experience level (2-3 sentences)",
    "whatToExpect": {
      "physiologicalAdaptations": "What physical changes you'll experience",
      "performanceGains": "Specific performance improvements",
      "timeline": "When you'll notice changes"
    },
    "planStructure": {
      "weekByWeek": "How the 4-week structure works",
      "progressionStrategy": "How we're increasing difficulty"
    },
    "personalizationFactors": [
      "Available equipment: list specific equipment used",
      "Experience level: how plan is tailored to beginner/intermediate/advanced",
      "Mobility considerations: any specific mobility work included",
      "Time availability: how workouts fit their schedule"
    ],
    "successTips": [
      "Tip 1 specific to their modality",
      "Tip 2 about recovery or nutrition",
      "Tip 3 about form or progression"
    ]
  },
  "weeks": [
    {
      "weekNumber": 1,
      "weekType": "baseline",
      "volumeMultiplier": 1.0,
      "workouts": [
        {
          "dayOfWeek": 1,
          "workoutName": "Push Day A",
          "workoutType": "push",
          "estimatedDuration": 60,
          "muscleGroups": ["chest", "shoulders", "triceps"],
          "exercises": [
            {
              "exerciseId": "USE-EXACT-UUID-FROM-AVAILABLE-EXERCISES-LIST",
              "exerciseName": "Barbell Bench Press",
              "exerciseOrder": 1,
              "sets": 4,
              "repsMin": 6,
              "repsMax": 8,
              "restSeconds": 90,
              "tempo": "3-0-1-0",
              "notes": "Control the descent"
            }
          ]
        }
      ]
    },
    {
      "weekNumber": 2,
      "weekType": "volume",
      "volumeMultiplier": 1.1,
      "workouts": []
    },
    {
      "weekNumber": 3,
      "weekType": "peak",
      "volumeMultiplier": 1.15,
      "workouts": []
    },
    {
      "weekNumber": 4,
      "weekType": "deload",
      "volumeMultiplier": 0.65,
      "workouts": []
    }
  ]
}

NOTES ON STRUCTURE:
- The "weeks" array MUST contain exactly 4 week objects (weekNumber 1, 2, 3, 4)
- Each week's "workouts" array contains multiple workout objects based on daysPerWeek
- Each workout's "exercises" array MUST contain:
  * 60-minute workouts: 6-7 exercises, 12+ total sets
  * 45-minute workouts: 5-6 exercises, 10+ total sets
- Use exact exercise UUIDs from the available exercises list provided earlier in this prompt
- Do NOT include any JavaScript-style comments in your JSON response
- Do NOT wrap your response in markdown code blocks

⚠️ **YOU MUST INCLUDE ALL 4 WEEKS** - Not just week 1, but weeks 1, 2, 3, AND 4 ⚠️

**FINAL REMINDER:**
- EXACTLY 4 weeks in "weeks" array
- 60-minute workouts: 6-7 exercises, 12+ total sets
- 45-minute workouts: 5-6 exercises, 10+ total sets
- Use exact UUIDs from available exercises list

Generate a complete 4-week workout plan as valid JSON.`
}

/**
 * Build a week-specific prompt for generating a single week of workouts
 * Used in week-by-week generation to avoid token limits
 */
function buildWeekPrompt(
  profile: any,
  exercises: any[],
  preferences: any,
  weekNumber: number,
  previousWeeks: any[]
): string {
  const {
    trainingStyle = profile.training_style || 'mixed',
    splitPreference = 'auto',
    exercisesToAvoid = [],
    specificGoals = ''
  } = preferences

  // Filter out exercises to avoid
  const availableExercises = exercises.filter(ex => !exercisesToAvoid.includes(ex.id))

  // CRITICAL: Use profile values as the single source of truth
  const daysPerWeek = profile.training_days_per_week || profile.weekly_workout_goal || 3
  const userTrainingStyle = profile.training_style || trainingStyle

  // Build progressive overload context from previous weeks
  let progressionContext = ''
  if (previousWeeks.length > 0) {
    progressionContext = `\n**PREVIOUS WEEKS CONTEXT (for progressive overload):**\n`
    previousWeeks.forEach((week, idx) => {
      progressionContext += `\nWeek ${idx + 1} Summary:\n`
      progressionContext += `- Volume Multiplier: ${week.volumeMultiplier || 1.0}\n`
      if (week.workouts && week.workouts.length > 0) {
        progressionContext += `- Sample workout: ${week.workouts[0].workoutName} - ${week.workouts[0].exercises?.length || 0} exercises\n`
      }
    })
    progressionContext += `\n**YOUR TASK:** Generate Week ${weekNumber} with appropriate progression from the previous week(s).\n`
  }

  // Determine week type and volume multiplier
  let weekType = 'baseline'
  let volumeMultiplier = 1.0
  if (weekNumber === 1) {
    weekType = 'baseline'
    volumeMultiplier = 1.0
  } else if (weekNumber === 2) {
    weekType = 'volume'
    volumeMultiplier = 1.1
  } else if (weekNumber === 3) {
    weekType = 'peak'
    volumeMultiplier = 1.15
  } else if (weekNumber === 4) {
    weekType = 'deload'
    volumeMultiplier = 0.65
  }

  return `Generate Week ${weekNumber} of a 4-week workout mesocycle for a user with the following profile:

**USER PROFILE (SINGLE SOURCE OF TRUTH - YOU MUST USE THESE EXACT VALUES):**
- Age: ${profile.age || 'Unknown'}
- Gender: ${profile.gender || 'Unknown'}
- Fitness Goal: ${profile.fitness_goal || profile.primary_goal || 'General fitness'}
- Experience Level: ${profile.experience_level || 'beginner'}
- Available Equipment: ${profile.available_equipment?.join(', ') || profile.custom_equipment || 'Bodyweight only'}
- Workout Location: ${profile.workout_location || profile.gym_access || 'Home'}
- Preferred Workout Time: ${profile.preferred_workout_time || 'Flexible'}
- ⚠️ MANDATORY DAYS PER WEEK: ${daysPerWeek} (YOU MUST GENERATE EXACTLY ${daysPerWeek} WORKOUTS FOR THIS WEEK)

**ASSESSMENT DATA:**
${profile.push_ups ? `- Push-ups: ${profile.push_ups}` : ''}
${profile.pull_ups ? `- Pull-ups: ${profile.pull_ups}` : ''}
${profile.squat_depth ? `- Squat depth: ${profile.squat_depth}` : ''}
${profile.plank_time ? `- Plank time: ${profile.plank_time}s` : ''}

**MOBILITY SCORES:**
${profile.shoulder_mobility ? `- Shoulder: ${profile.shoulder_mobility}/10` : ''}
${profile.hip_mobility ? `- Hip: ${profile.hip_mobility}/10` : ''}
${profile.ankle_mobility ? `- Ankle: ${profile.ankle_mobility}/10` : ''}

**PREFERENCES:**
- ⚠️ MANDATORY Training Style: ${userTrainingStyle} (THIS IS THE USER'S SELECTED TRAINING MODALITY - YOU MUST FOLLOW THIS)
- Split Preference: ${splitPreference}
${specificGoals ? `- Specific Goals: ${specificGoals}` : ''}

${progressionContext}

**WEEK ${weekNumber} SPECIFICATIONS:**
- Week Type: ${weekType}
- Volume Multiplier: ${volumeMultiplier}
${weekNumber === 1 ? '- This is the BASELINE week - establish proper volume and form' : ''}
${weekNumber === 2 ? '- This is the VOLUME week - increase volume by ~10% from Week 1' : ''}
${weekNumber === 3 ? '- This is the PEAK week - highest volume/intensity of the cycle' : ''}
${weekNumber === 4 ? '- This is the DELOAD week - reduce volume to 60-70% for recovery' : ''}

**AVAILABLE EXERCISES (${availableExercises.length} total - showing top 25):**

${availableExercises.slice(0, 25).map(ex =>
  `${ex.id}|${ex.name}|${ex.category}|${ex.primary_muscles?.join(',')}`
).join('\n')}

🚨 MANDATORY: 60-min workouts = 6-7 exercises (NEVER 5), 12+ total sets. 45-min = 5-6 exercises, 10+ sets. Each exercise needs 2-3 sets. Use EXACT UUIDs from list below. COUNT exercises before outputting - if 60-min has only 5, ADD ONE MORE.

**OUTPUT FORMAT (JSON) - RETURN ONLY THIS WEEK'S DATA:**

${weekNumber === 1 ? `
{
  "planName": "Personalized 4-Week Mesocycle",
  "planType": "push_pull_legs",
  "daysPerWeek": ${daysPerWeek},
  "splitPattern": "appropriate pattern for ${daysPerWeek} days",
  "primaryModality": "${userTrainingStyle}",
  "planRationale": {
    "whyThisPlan": "Why this plan design was chosen (2-3 sentences)",
    "primaryModalityExplanation": "Why ${userTrainingStyle} fits the user's goals",
    "whatToExpect": {
      "physiologicalAdaptations": "Expected physical changes",
      "performanceGains": "Specific improvements",
      "timeline": "When changes will be noticed"
    }
  },
  "weeks": [
    {
      "weekNumber": 1,
      "weekType": "${weekType}",
      "volumeMultiplier": ${volumeMultiplier},
      "workouts": [
        {
          "dayOfWeek": 1,
          "workoutName": "Workout Name",
          "workoutType": "push/pull/legs/upper/lower/full_body",
          "estimatedDuration": 60,
          "muscleGroups": ["chest", "shoulders", "triceps"],
          "exercises": [
            {
              "exerciseId": "EXACT-UUID-FROM-LIST",
              "exerciseName": "Exercise Name",
              "exerciseOrder": 1,
              "sets": 3,
              "repsMin": 8,
              "repsMax": 12,
              "restSeconds": 90,
              "tempo": "3-0-1-0",
              "notes": "Form cues"
            }
          ]
        }
      ]
    }
  ]
}
` : `
{
  "weeks": [
    {
      "weekNumber": ${weekNumber},
      "weekType": "${weekType}",
      "volumeMultiplier": ${volumeMultiplier},
      "workouts": [
        {
          "dayOfWeek": 1,
          "workoutName": "Workout Name",
          "workoutType": "push/pull/legs/upper/lower/full_body",
          "estimatedDuration": 60,
          "muscleGroups": ["chest", "shoulders", "triceps"],
          "exercises": [
            {
              "exerciseId": "EXACT-UUID-FROM-LIST",
              "exerciseName": "Exercise Name",
              "exerciseOrder": 1,
              "sets": 3,
              "repsMin": 8,
              "repsMax": 12,
              "restSeconds": 90,
              "tempo": "3-0-1-0",
              "notes": "Form cues"
            }
          ]
        }
      ]
    }
  ]
}
`}

Generate Week ${weekNumber} as JSON. Remember: 60-min workouts = 6-7 exercises (not 5), 12+ sets. Use exact UUIDs from list.`
}

// Valid workout types from database constraint
const VALID_WORKOUT_TYPES = ['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'cardio', 'mixed'] as const

/**
 * Normalizes AI-generated workout type to match database constraint
 */
function normalizeWorkoutType(workoutType: string | undefined): string {
  if (!workoutType) return 'mixed'

  const normalized = workoutType.toLowerCase().replace(/[_\s-]+/g, '_')

  // Direct match
  if (VALID_WORKOUT_TYPES.includes(normalized as any)) {
    return normalized
  }

  // Mapping patterns for common AI variations
  if (normalized.includes('push')) return 'push'
  if (normalized.includes('pull')) return 'pull'
  if (normalized.includes('leg')) return 'legs'
  if (normalized.includes('upper')) return 'upper'
  if (normalized.includes('lower')) return 'lower'
  if (normalized.includes('full') || normalized.includes('body')) return 'full_body'
  if (normalized.includes('cardio') || normalized.includes('conditioning')) return 'cardio'

  // Default to mixed for unrecognized types
  return 'mixed'
}

function validatePlanStructure(plan: any): string | null {
  if (!plan.planName || typeof plan.planName !== 'string') {
    return 'Missing or invalid planName'
  }

  if (!plan.planType || !['push_pull_legs', 'upper_lower', 'full_body', 'custom'].includes(plan.planType)) {
    return 'Missing or invalid planType'
  }

  if (!plan.daysPerWeek || typeof plan.daysPerWeek !== 'number') {
    return 'Missing or invalid daysPerWeek'
  }

  if (!Array.isArray(plan.weeks) || plan.weeks.length !== 4) {
    return 'Must have exactly 4 weeks'
  }

  for (let i = 0; i < plan.weeks.length; i++) {
    const week = plan.weeks[i]

    if (week.weekNumber !== i + 1) {
      return `Week ${i + 1} has incorrect weekNumber`
    }

    if (!Array.isArray(week.workouts)) {
      return `Week ${i + 1} missing workouts array`
    }

    for (const workout of week.workouts) {
      if (!workout.workoutName || !workout.workoutType) {
        return 'Workout missing name or type'
      }

      // Normalize and validate workout type
      workout.workoutType = normalizeWorkoutType(workout.workoutType)

      if (!Array.isArray(workout.exercises)) {
        return 'Workout missing exercises array'
      }

      // Validate minimum exercise count based on workout duration
      const duration = workout.estimatedDuration || 60
      let minExercises = 5 // Default minimum

      if (duration >= 75) {
        minExercises = 7
      } else if (duration >= 60) {
        minExercises = 6
      } else if (duration >= 45) {
        minExercises = 5
      } else if (duration >= 30) {
        minExercises = 4
      }

      if (workout.exercises.length < minExercises) {
        return `Workout "${workout.workoutName}" (${duration} minutes) has only ${workout.exercises.length} exercises. Minimum ${minExercises} exercises required for a ${duration}-minute workout to properly fill the allocated time.`
      }

      // Validate total sets per workout based on duration
      const totalSets = workout.exercises.reduce((sum: number, ex: any) => sum + (ex.sets || 0), 0)

      // Set minimum based on duration
      let minSets = 10
      if (duration >= 60) {
        minSets = 12 // 60+ minute workouts need 12+ sets
      } else if (duration >= 45) {
        minSets = 12 // 45+ minute workouts need 12+ sets
      } else if (duration >= 30) {
        minSets = 10 // 30+ minute workouts need 10+ sets
      }

      if (totalSets < minSets) {
        return `Workout "${workout.workoutName}" has only ${totalSets} total sets. Minimum ${minSets} sets required for a ${duration}-minute workout.`
      }

      for (const exercise of workout.exercises) {
        if (!exercise.exerciseId || !exercise.exerciseName) {
          return 'Exercise missing ID or name'
        }
        // Validate that exerciseId is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(exercise.exerciseId)) {
          return `Exercise "${exercise.exerciseName}" has invalid ID format "${exercise.exerciseId}". Must be a UUID from the available exercises list, not a sequential number.`
        }
        if (typeof exercise.sets !== 'number' || exercise.sets < 1) {
          return 'Exercise has invalid sets count'
        }
      }
    }
  }

  return null // Valid
}

async function savePlanToDatabase(
  supabase: any,
  userId: string,
  generatedPlan: any,
  profile: any,
  preferences: any,
  log: any
) {
  const startDate = new Date()
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 28) // 4 weeks = 28 days

  // 1. Create the main workout plan
  const { data: planData, error: planError } = await supabase
    .from('user_workout_plans')
    .insert({
      user_id: userId,
      plan_name: generatedPlan.planName,
      plan_type: generatedPlan.planType,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      weeks_duration: 4,
      days_per_week: generatedPlan.daysPerWeek,
      split_pattern: generatedPlan.splitPattern,
      available_equipment: profile.available_equipment,
      workout_location: profile.workout_location,
      status: 'active',
      ai_model_version: 'gpt-4o',
      generation_parameters: preferences,
      plan_rationale: generatedPlan.planRationale || null
    })
    .select()
    .single()

  if (planError) {
    log.error("Failed to create workout plan in database", new Error(planError.message), undefined, {
      userId,
      errorCode: planError.code,
      planName: generatedPlan.planName
    })
    throw new Error(`Failed to create plan: ${planError.message}`)
  }

  const planId = planData.id
  log.debug("Main workout plan created", undefined, {
    userId,
    planId,
    planName: generatedPlan.planName
  })

  // 1.5. Validate all exercise IDs exist in exercise_library before creating workouts
  const allExerciseIds = new Set<string>()
  for (const week of generatedPlan.weeks) {
    for (const workout of week.workouts) {
      for (const exercise of workout.exercises) {
        if (exercise.exerciseId) {
          allExerciseIds.add(exercise.exerciseId)
        }
      }
    }
  }

  if (allExerciseIds.size > 0) {
    const { data: existingExercises, error: exerciseCheckError } = await supabase
      .from('exercise_library')
      .select('id')
      .in('id', Array.from(allExerciseIds))

    if (exerciseCheckError) {
      log.error("Failed to validate exercise IDs", new Error(exerciseCheckError.message), undefined, {
        userId,
        planId,
        errorCode: exerciseCheckError.code
      })
      throw new Error(`Failed to validate exercises: ${exerciseCheckError.message}`)
    }

    const existingIds = new Set(existingExercises.map((ex: any) => ex.id))
    const missingIds = Array.from(allExerciseIds).filter(id => !existingIds.has(id))

    if (missingIds.length > 0) {
      log.error("AI generated plan with non-existent exercise IDs", new Error("Exercise validation failed"), undefined, {
        userId,
        planId,
        missingExerciseIds: missingIds,
        totalExercisesRequested: allExerciseIds.size,
        totalExercisesFound: existingIds.size
      })
      throw new Error(`Generated plan contains invalid exercise IDs: ${missingIds.join(', ')}. These exercises do not exist in the exercise library.`)
    }

    log.debug("All exercise IDs validated successfully", undefined, {
      userId,
      planId,
      totalExercisesValidated: existingIds.size
    })
  }

  // 2. Create workouts for each week
  let totalWorkoutsCreated = 0
  let totalExercisesCreated = 0

  for (const week of generatedPlan.weeks) {
    for (const workout of week.workouts) {
      // Calculate scheduled date
      const scheduledDate = new Date(startDate)
      const daysOffset = (week.weekNumber - 1) * 7 + (workout.dayOfWeek - 1)
      scheduledDate.setDate(scheduledDate.getDate() + daysOffset)

      // Create the workout
      const { data: workoutData, error: workoutError } = await supabase
        .from('plan_workouts')
        .insert({
          plan_id: planId,
          user_id: userId,
          workout_name: workout.workoutName,
          workout_type: workout.workoutType,
          day_of_week: workout.dayOfWeek,
          week_number: week.weekNumber,
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          estimated_duration_minutes: workout.estimatedDuration,
          target_volume_sets: workout.exercises.reduce((sum: number, ex: any) => sum + ex.sets, 0),
          muscle_groups: workout.muscleGroups,
          workout_description: workout.description || null,
          is_rest_day: false
        })
        .select()
        .single()

      if (workoutError) {
        log.error("Failed to create workout in database", new Error(workoutError.message), undefined, {
          userId,
          planId,
          weekNumber: week.weekNumber,
          workoutName: workout.workoutName,
          errorCode: workoutError.code
        })
        continue
      }

      totalWorkoutsCreated++

      const workoutId = workoutData.id

      // 3. Create exercises for this workout
      for (const exercise of workout.exercises) {
        const { error: exerciseError } = await supabase
          .from('plan_exercises')
          .insert({
            workout_id: workoutId,
            exercise_id: exercise.exerciseId,
            user_id: userId,
            exercise_order: exercise.exerciseOrder,
            superset_group: exercise.supersetGroup,
            target_sets: exercise.sets,
            target_reps_min: exercise.repsMin,
            target_reps_max: exercise.repsMax,
            target_weight_lbs: exercise.weight,
            rest_seconds: exercise.restSeconds,
            tempo: exercise.tempo,
            target_rpe: exercise.rpe,
            exercise_notes: exercise.notes,
            progression_type: 'weight' // Default progression strategy
          })

        if (!exerciseError) {
          totalExercisesCreated++
        } else {
          log.error("Failed to create exercise in database", new Error(exerciseError.message), undefined, {
            userId,
            planId,
            workoutId,
            exerciseName: exercise.exerciseName,
            errorCode: exerciseError.code
          })
        }
      }
    }
  }

  log.info("Workout plan saved to database successfully", undefined, {
    userId,
    planId,
    totalWorkoutsCreated,
    totalExercisesCreated
  })

  // Validate that exercises were created
  if (totalExercisesCreated === 0) {
    log.error("Plan created but no exercises were saved", new Error("Zero exercises created"), undefined, {
      userId,
      planId,
      totalWorkoutsCreated,
      totalExercisesCreated
    })
    throw new Error('Workout plan created but no exercises could be saved. This may indicate invalid exercise IDs or database constraints.')
  }

  return {
    planId,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  }
}
