import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createApiLogger } from '@/lib/utils/logger'
import { workoutGenerationSchema, safeValidate } from '@/lib/validations/api'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
      .select('id, name, category, equipment, difficulty, target_muscles, training_modality, recommended_sets_min, recommended_sets_max, recommended_reps_min, recommended_reps_max, recommended_rest_seconds_min, recommended_rest_seconds_max')
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

    // 5. Call OpenAI to generate plan
    log.info("Calling OpenAI to generate workout plan", undefined, {
      userId,
      model: 'gpt-4o',
      exercisesAvailable: filteredExercises.length
    })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert fitness coach and exercise scientist. You create personalized, science-based 4-WEEK workout programs that follow proper periodization principles. You always respond with valid JSON. CRITICAL REQUIREMENTS THAT WILL CAUSE REJECTION IF NOT MET: (1) EXACTLY 4 weeks in "weeks" array. (2) MINIMUM 7 exercises for EVERY 60-minute workout - NOT 6, NOT 5, but AT LEAST 7. Target 8-9 exercises. (3) MINIMUM 12 total sets for EVERY 60-minute workout (2 sets per exercise minimum). (4) Each exercise needs 2 sets minimum. BEFORE outputting, COUNT exercises AND total sets in each 60-min workout. Plans with fewer than 7 exercises OR fewer than 12 sets will be REJECTED.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const aiResponse = completion.choices[0].message.content
    if (!aiResponse) {
      log.error("No response received from OpenAI", new Error("Empty AI response"), undefined, { userId })
      throw new Error('No response from AI')
    }

    log.debug("AI response received", undefined, {
      userId,
      responseLength: aiResponse.length,
      tokensUsed: completion.usage?.total_tokens
    })

    const generatedPlan = JSON.parse(aiResponse)

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

**AVAILABLE EXERCISES (${availableExercises.length} exercises - PRE-FILTERED FOR ${userTrainingStyle.toUpperCase()} MODALITY):**

🎯 **IMPORTANT:** These exercises are already optimized for ${userTrainingStyle} training with modality-specific recommendations built-in. Use the recommended sets/reps/rest values provided with each exercise.

${availableExercises.slice(0, 100).map(ex =>
  `- ID: ${ex.id} | Name: ${ex.name} | Category: ${ex.category} | Difficulty: ${ex.difficulty} | Targets: ${ex.target_muscles?.join(', ')}
  ${ex.recommended_sets_min && ex.recommended_sets_max ? `  📊 Sets: ${ex.recommended_sets_min}-${ex.recommended_sets_max}` : ''}
  ${ex.recommended_reps_min && ex.recommended_reps_max ? `  🔢 Reps: ${ex.recommended_reps_min}-${ex.recommended_reps_max}` : ''}
  ${ex.recommended_rest_seconds_min && ex.recommended_rest_seconds_max ? `  ⏱️ Rest: ${ex.recommended_rest_seconds_min}-${ex.recommended_rest_seconds_max}s` : ''}`
).join('\n')}

**CRITICAL MANDATORY REQUIREMENTS - YOU MUST FOLLOW THESE:**

⚠️⚠️⚠️ **BEFORE YOU OUTPUT YOUR RESPONSE, COUNT THE EXERCISES IN EACH WORKOUT** ⚠️⚠️⚠️

**EXERCISE COUNT VALIDATION CHECKLIST (MUST BE 100% CHECKED):**
- [ ] Does EVERY 60-minute workout have AT LEAST 7 exercises? (Target: 8-9 exercises)
- [ ] Does EVERY 45-minute workout have AT LEAST 6 exercises? (Target: 7-8 exercises)
- [ ] Does EVERY 60-minute workout have AT LEAST 12 total sets? (Target: 16-20 sets)
- [ ] Does EVERY 45-minute workout have AT LEAST 12 total sets? (Target: 14-18 sets)
- [ ] Does each exercise have 2 sets minimum? (Ideally 2-3 sets per exercise)
- [ ] Have I used EXACT UUIDs from the available exercises list (not sequential numbers)?

**REALITY CHECK - COMMON FAILURE MODES:**
- 6 exercises in 60 minutes = REJECTION → ADD 1 MORE EXERCISE NOW
- 5 exercises in 60 minutes = REJECTION → ADD 2 MORE EXERCISES NOW
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

   **MINIMUM EXERCISES BASED ON WORKOUT DURATION (NON-NEGOTIABLE):**
   - ⚠️ 30-40 minutes: 5 exercises, 10-12 total sets (avg 2 sets per exercise)
   - ⚠️ 45-55 minutes: 6-7 exercises, 12-16 total sets (avg 2 sets per exercise)
   - ⚠️⚠️⚠️ 60-75 minutes: MINIMUM 7 exercises, MINIMUM 12 total sets - TARGET 8-9 EXERCISES with 16-20 TOTAL SETS ⚠️⚠️⚠️
   - ⚠️ 75+ minutes: 9-10 exercises, 18-24 total sets (avg 2 sets per exercise)

   **CRITICAL SET COUNT REQUIREMENTS:**
   - Each exercise should have 2 sets minimum (ideally 2-3 sets)
   - Primary compound exercises: 2-3 sets
   - Secondary compounds: 2 sets
   - Isolation exercises: 2 sets
   - For 60-minute workouts: 12+ total sets required (7 exercises × 2 sets = 14 sets minimum, target 16+ sets)

   **EXERCISE DISTRIBUTION BY SPLIT:**
   - Push/Pull/Legs: 7-8 exercises per workout (minimum 7)
   - Upper/Lower: 7-9 exercises per workout (minimum 7)
   - Full Body: 8-10 exercises per workout (minimum 7)

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
   - Total Volume: 12-20 sets per workout
   - Example 60min Push Day (7 exercises): Bench Press (3x5), Incline Barbell Press (2x6), Overhead Press (2x6), Dips (2x8), Close Grip Bench (2x8), Lateral Raises (2x10), Tricep Extensions (2x10) = 15 sets ✅

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
   - Total Volume: 24-32 sets per workout
   - Example 60min Push Day: Barbell Bench Press (4x8), Incline Dumbbell Press (3x10), Flat Dumbbell Flyes (3x12), Machine Chest Press (3x12), Overhead Press (4x8), Lateral Raises (3x12), Front Raises (3x12), Cable Flyes (3x15), Tricep Pushdowns (3x12), Overhead Extensions (3x12)

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
   - Total Volume: 25-35 sets per workout
   - Example 60min Circuit: Squat (3x20), Push-ups (3x20), Lunges (3x20), Rows (3x20), Burpees (3x15), Mountain Climbers (3x30s), Jump Squats (3x15), Plank (3x60s), Bicycle Crunches (3x25), Jump Rope (3x60s)

   **D. MIXED/BALANCED (${userTrainingStyle === 'mixed' ? 'CURRENT SELECTION - FOLLOW THIS' : 'Reference only'}):**
   - Focus: Balanced development across strength, size, and endurance
   - Main Lifts: 4 sets of 5-8 reps at 75-85% 1RM (RPE 7-8) - Strength emphasis
   - Secondary Compounds: 3-4 sets of 8-12 reps at 65-75% 1RM (RPE 7-8) - Hypertrophy emphasis
   - Accessories: 3 sets of 12-15 reps at 60-70% 1RM (RPE 6-7) - Endurance emphasis
   - Rest Periods: Vary based on exercise (3min for strength, 90s for hypertrophy, 60s for endurance)
   - Total Volume: 22-28 sets per workout
   - Example 60min Upper Day: Bench Press (4x6), Barbell Rows (4x6), Incline Press (3x10), Pull-ups (3x10), Overhead Press (3x10), Face Pulls (3x12), Bicep Curls (3x12), Tricep Extensions (3x12), Lateral Raises (3x15)

6. **Workout Structure Template - MUST FOLLOW:**

   **For ${userTrainingStyle.toUpperCase()} training style, each workout MUST include:**

   ${userTrainingStyle === 'strength' ? `
   - Exercise 1: Primary Compound (Squat/Bench/Dead/OHP variant) - 4-5 sets of 3-6 reps
   - Exercise 2: Secondary Compound (variation of main lift) - 4 sets of 5-8 reps
   - Exercise 3: Supporting Compound - 3-4 sets of 6-8 reps
   - Exercise 4: Compound Accessory - 3 sets of 8-10 reps
   - Exercise 5: Primary Isolation - 3 sets of 8-10 reps
   - Exercise 6: Secondary Isolation - 3 sets of 8-12 reps
   - Exercise 7: Tertiary Isolation - 3 sets of 10-12 reps
   - Exercise 8: Mobility/Prehab work - 2 sets of 12-15 reps
   MINIMUM: 8 exercises, 24-28 total sets` : ''}

   ${userTrainingStyle === 'hypertrophy' ? `
   - Exercise 1: Primary Compound Movement - 4 sets of 6-10 reps
   - Exercise 2: Secondary Compound (different angle) - 3-4 sets of 8-12 reps
   - Exercise 3: Tertiary Compound/Machine - 3 sets of 10-12 reps
   - Exercise 4: Isolation Exercise - Muscle Group 1 - 3 sets of 10-15 reps
   - Exercise 5: Isolation Exercise - Muscle Group 2 - 3 sets of 10-15 reps
   - Exercise 6: Isolation Exercise - Muscle Group 3 - 3 sets of 12-15 reps
   - Exercise 7: Isolation Exercise - Muscle Group 4 - 3 sets of 12-15 reps
   - Exercise 8: Pump/Burnout Exercise - 3 sets of 15-20 reps
   - Exercise 9: Isolation Exercise - Weak Point - 3 sets of 12-15 reps
   - Exercise 10: Final Pump Exercise - 3 sets of 15-20 reps
   MINIMUM: 10 exercises, 28-32 total sets` : ''}

   ${userTrainingStyle === 'endurance' ? `
   - Circuit 1: 4 exercises x 3 rounds (compound movements, 15-20 reps each)
   - Circuit 2: 4 exercises x 3 rounds (mix of strength and cardio, 15-20 reps each)
   - Circuit 3: 3 exercises x 3 rounds (finisher circuit, 20-25 reps each)
   MINIMUM: 11 total exercises, 33 total sets` : ''}

   ${userTrainingStyle === 'mixed' ? `
   - Exercise 1: Primary Strength Compound - 4 sets of 5-8 reps
   - Exercise 2: Secondary Strength Compound - 4 sets of 5-8 reps
   - Exercise 3: Hypertrophy Compound - 3 sets of 8-12 reps
   - Exercise 4: Hypertrophy Compound (different angle) - 3 sets of 8-12 reps
   - Exercise 5: Isolation Exercise - 3 sets of 10-12 reps
   - Exercise 6: Isolation Exercise - 3 sets of 10-12 reps
   - Exercise 7: Isolation Exercise - 3 sets of 12-15 reps
   - Exercise 8: Isolation Exercise - 3 sets of 12-15 reps
   - Exercise 9: Endurance Exercise - 3 sets of 15-20 reps
   MINIMUM: 9 exercises, 26-28 total sets` : ''}

7. **EXERCISE COUNT REQUIREMENTS (PER WORKOUT) - FOLLOW THESE PATTERNS:**

   **IMPORTANT NOTE:** The examples below show what ONE SINGLE WORKOUT should contain. You must create a COMPLETE 4-WEEK PLAN with MULTIPLE workouts per week, where EACH workout follows these exercise count guidelines.

   **EXAMPLE A: 60-MINUTE STRENGTH PUSH WORKOUT (MATCH THIS EXERCISE COUNT FOR EACH 60-MIN WORKOUT):**
   1. Barbell Bench Press - 4 sets x 5 reps (RPE 8)
   2. Incline Barbell Press - 4 sets x 6 reps (RPE 8)
   3. Overhead Press - 3 sets x 6 reps (RPE 7)
   4. Dips (Weighted) - 3 sets x 8 reps (RPE 7)
   5. Close Grip Bench Press - 3 sets x 8 reps (RPE 7)
   6. Lateral Raises - 3 sets x 10 reps (RPE 6)
   7. Tricep Extensions - 3 sets x 10 reps (RPE 7)
   8. Face Pulls - 3 sets x 12 reps (RPE 6)
   **TOTAL: 8 EXERCISES, 26 SETS, 60 MINUTES** ✅

   **EXAMPLE B: 60-MINUTE HYPERTROPHY PULL WORKOUT (MATCH THIS EXERCISE COUNT FOR EACH 60-MIN WORKOUT):**
   1. Barbell Rows - 4 sets x 8 reps (RPE 8)
   2. Pull-ups - 3 sets x 10 reps (RPE 8)
   3. Seated Cable Rows - 3 sets x 12 reps (RPE 7)
   4. Lat Pulldowns - 3 sets x 12 reps (RPE 7)
   5. Face Pulls - 3 sets x 15 reps (RPE 6)
   6. Barbell Curls - 3 sets x 10 reps (RPE 7)
   7. Hammer Curls - 3 sets x 12 reps (RPE 7)
   8. Cable Curls - 3 sets x 15 reps (RPE 6)
   9. Rear Delt Flyes - 3 sets x 15 reps (RPE 6)
   **TOTAL: 9 EXERCISES, 28 SETS, 60 MINUTES** ✅

   **⚠️ APPLY THESE EXERCISE COUNTS TO ALL WORKOUTS IN YOUR 4-WEEK PLAN ⚠️**
   - A 60-minute workout with 4 exercises is COMPLETELY UNACCEPTABLE
   - YOU MUST INCLUDE AT LEAST 8 EXERCISES FOR EVERY 60-MINUTE WORKOUT
   - IF ANY WORKOUT HAS FEWER EXERCISES, YOUR ENTIRE 4-WEEK PLAN WILL BE REJECTED

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

**⚠️⚠️⚠️ FINAL PRE-OUTPUT CHECKLIST - VERIFY BEFORE RESPONDING ⚠️⚠️⚠️**

Before you output your JSON response, verify the following:

1. **Plan Structure:** Does your plan have EXACTLY 4 weeks in the "weeks" array? (Week 1, 2, 3, 4)
2. **Workouts per Week:** Does each week have multiple workouts based on daysPerWeek?
3. **60-minute workouts - COUNT CAREFULLY:** Did you include AT LEAST 7 exercises in EACH 60-min workout?
   - NOT 6 exercises (this will be REJECTED)
   - NOT 5 exercises (this will be REJECTED)
   - NOT 4 or fewer exercises (this will be REJECTED)
   - MINIMUM 7 exercises, TARGET 8-9 exercises
4. **45-minute workouts:** Did you include AT LEAST 6 exercises in EACH 45-min workout?
5. **Total sets - COUNT CAREFULLY:** Does EACH 60-min workout have AT LEAST 12 total sets?
   - 10-11 total sets = REJECTED (increase sets per exercise to 2)
   - Each exercise should have 2 sets minimum
   - Target: 16-20 total sets for 60-minute workouts
6. **45-minute workouts sets:** Does EACH 45-min workout have AT LEAST 12 total sets?
7. **Exercise IDs:** Did you use EXACT UUIDs from the available exercises list above?

**SPECIFICALLY CHECK ITEMS #3 AND #5:**
- If any 60-min workout has 6 or fewer exercises → REJECTED
- If any 60-min workout has fewer than 12 total sets → REJECTED

IF YOU ANSWER "NO" TO ANY OF THESE, GO BACK AND FIX YOUR PLAN NOW.

**CRITICAL:** Your response MUST be a complete 4-week mesocycle with:
- Exactly 4 weeks in the "weeks" array (weeks[0] through weeks[3])
- Multiple workouts in each week's "workouts" array
- Each 60-min workout having 8+ exercises (target: 9-10)
- Each 60-min workout having 20+ total sets (3-4 sets per exercise)

**EXAMPLE CALCULATION FOR 60-MIN WORKOUT:**
8 exercises × 3 sets each = 24 total sets ✅ (exceeds 20 minimum)
8 exercises × 2 sets each = 16 total sets ❌ (below 20 minimum - REJECTED)

**DO NOT PROCEED TO OUTPUT UNTIL ALL REQUIREMENTS ARE MET.**

**OUTPUT FORMAT (JSON) - YOU MUST RETURN THE COMPLETE STRUCTURE BELOW:**

⚠️ **CRITICAL:** Your response must include ALL 4 weeks with complete workout details for each week ⚠️

{
  "planName": "Personalized 4-Week Mesocycle",
  "planType": "push_pull_legs" | "upper_lower" | "full_body" | "custom",
  "daysPerWeek": 5,
  "splitPattern": "3-1-2-1" (e.g., 3 on, 1 off, 2 on, 1 off),
  "primaryModality": "strength_training" | "cardiovascular" | "hiit" | "power_explosive" | "mobility_flexibility" | "functional" | "mind_body" | "sport_specific",
  "secondaryModalities": ["mobility_flexibility", "cardiovascular"], // Supporting modalities
  "planRationale": {
    "whyThisPlan": "Detailed explanation of why THIS specific plan design was chosen for this user (2-3 sentences)",
    "primaryModalityExplanation": "Why [primary modality] is the best fit for your [specific goal] and [experience level] (2-3 sentences)",
    "whatToExpect": {
      "physiologicalAdaptations": "What physical changes you'll experience (e.g., 'Increased muscle mass, improved bone density, enhanced metabolic rate')",
      "performanceGains": "Specific performance improvements (e.g., 'Lift heavier weights, build visible muscle, improve posture')",
      "timeline": "When you'll notice changes (e.g., 'Strength gains in weeks 1-2, visible changes by week 3-4')"
    },
    "planStructure": {
      "weekByWeek": "How the 4-week structure works (e.g., 'Week 1: Learning phase, Week 2: Volume increase, Week 3: Peak intensity, Week 4: Deload')",
      "progressionStrategy": "How we're increasing difficulty (e.g., 'Progressive overload through weight increases and additional sets')"
    },
    "personalizationFactors": [
      "Available equipment: [list specific equipment used]",
      "Experience level: [how plan is tailored to beginner/intermediate/advanced]",
      "Mobility considerations: [any specific mobility work included]",
      "Time availability: [how workouts fit their schedule]"
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
        // Multiple workouts based on daysPerWeek (e.g., 5 workouts for 5 days/week)
        {
          "dayOfWeek": 1,
          "workoutName": "Push Day A",
          "workoutType": "push",
          "estimatedDuration": 60,
          "muscleGroups": ["chest", "shoulders", "triceps"],
          "exercises": [
            // 8-10 exercises for 60-minute workout
            {
              "exerciseId": "PASTE-EXACT-UUID-FROM-AVAILABLE-EXERCISES-LIST-ABOVE-HERE",
              "exerciseName": "Barbell Bench Press",
              "exerciseOrder": 1,
              "sets": 4,
              "repsMin": 6,
              "repsMax": 8,
              // ... other exercise properties
            }
            // ... 7-9 more exercises to total 8-10 exercises
          ]
        }
        // ... more workouts for this week
      ]
    },
    {
      "weekNumber": 2,
      "weekType": "volume",
      "volumeMultiplier": 1.1,
      "workouts": [
        // Multiple workouts for week 2
      ]
    },
    {
      "weekNumber": 3,
      "weekType": "peak",
      "volumeMultiplier": 1.15,
      "workouts": [
        // Multiple workouts for week 3
      ]
    },
    {
      "weekNumber": 4,
      "weekType": "deload",
      "volumeMultiplier": 0.65,
      "workouts": [
        // Multiple workouts for week 4 (deload)
      ]
    }
  ]
}

⚠️ **YOU MUST INCLUDE ALL 4 WEEKS** - Not just week 1, but weeks 1, 2, 3, AND 4 ⚠️

**FINAL REMINDER BEFORE YOU START:**
- Your JSON response must have "weeks": [ ... ] with EXACTLY 4 week objects
- Week 1 (baseline), Week 2 (volume), Week 3 (peak), Week 4 (deload)
- Each 60-minute workout MUST have 8-10 exercises (NOT 7, NOT 6, but 8-10)
- Use exact UUIDs from the available exercises list above

**TOP 2 REASONS FOR REJECTION:**
1. Generating only 6 exercises for a 60-minute workout → The minimum is 7, the target is 8-9
2. Generating fewer than 12 total sets for a 60-minute workout → Each exercise needs 2 sets minimum

Before you output, count for EACH 60-minute workout:
- Exercises: Exercise 1, Exercise 2, Exercise 3, Exercise 4, Exercise 5, Exercise 6, Exercise 7... (need 7+)
- Sets: Add up all the "sets" values → Should be 12+ total (Example: 2+2+2+2+2+2+2 = 14 sets ✅)

If any 60-minute workout has fewer than 7 exercises OR fewer than 12 total sets, ADD MORE EXERCISES OR INCREASE SETS.

Generate a complete, personalized 4-week workout plan following all requirements. Your response must be a COMPLETE JSON object with all 4 weeks included.`
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
      let minExercises = 6 // Default minimum

      if (duration >= 75) {
        minExercises = 9
      } else if (duration >= 60) {
        minExercises = 7
      } else if (duration >= 45) {
        minExercises = 6
      } else if (duration >= 30) {
        minExercises = 5
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

  return {
    planId,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  }
}
