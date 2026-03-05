import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createApiLogger } from '@/lib/utils/logger'

/**
 * Save complete 4-week workout plan to database
 *
 * POST /api/workouts/save-plan
 *
 * Body:
 * - userId: string (required)
 * - planMetadata: object (required) - Plan configuration and metadata
 * - weeks: array (required) - Array of 4 week objects with workouts
 */
export async function POST(request: NextRequest) {
  const log = createApiLogger(request)

  try {
    const body = await request.json()
    const { userId, planMetadata, weeks } = body

    if (!userId || !planMetadata || !weeks || !Array.isArray(weeks)) {
      log.warn("Save plan request missing required parameters", undefined, {
        hasUserId: !!userId,
        hasPlanMetadata: !!planMetadata,
        hasWeeks: !!weeks,
        weeksIsArray: Array.isArray(weeks)
      })
      return NextResponse.json(
        { error: 'userId, planMetadata, and weeks array are required' },
        { status: 400 }
      )
    }

    if (weeks.length !== 4) {
      log.warn("Invalid weeks array length", undefined, {
        userId,
        weeksLength: weeks.length
      })
      return NextResponse.json(
        { error: 'Exactly 4 weeks are required' },
        { status: 400 }
      )
    }

    log.info("Starting to save 4-week workout plan", undefined, {
      userId,
      planName: planMetadata.planName,
      planType: planMetadata.planType,
      daysPerWeek: planMetadata.daysPerWeek
    })

    // Validate required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      log.error("Supabase credentials not configured", new Error("Missing Supabase credentials"), undefined, { userId })
      return NextResponse.json(
        {
          error: 'Database service not configured',
          message: 'Unable to save workout plan. Please contact support.',
          details: 'Missing Supabase credentials'
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 1. Collect all unique exercise IDs from all weeks
    const allExerciseIds = new Set<string>()
    weeks.forEach(week => {
      week.workouts?.forEach((workout: any) => {
        workout.exercises?.forEach((exercise: any) => {
          if (exercise.exerciseId) {
            allExerciseIds.add(exercise.exerciseId)
          }
        })
      })
    })

    // 2. Validate all exercise IDs exist in database
    if (allExerciseIds.size > 0) {
      const { data: validExercises, error: exerciseError } = await supabase
        .from('exercise_library')
        .select('id')
        .in('id', Array.from(allExerciseIds))

      if (exerciseError) {
        log.error('Error validating exercise IDs', new Error(exerciseError.message), undefined, {
          userId,
          errorCode: exerciseError.code
        })
        return NextResponse.json(
          { error: 'Failed to validate exercises', details: exerciseError.message },
          { status: 500 }
        )
      }

      const validIds = new Set(validExercises?.map(e => e.id) || [])
      const invalidIds = Array.from(allExerciseIds).filter(id => !validIds.has(id))

      if (invalidIds.length > 0) {
        log.warn("Invalid exercise IDs detected", undefined, {
          userId,
          invalidIds,
          invalidCount: invalidIds.length
        })
        return NextResponse.json(
          {
            error: 'Invalid exercises in plan',
            message: 'Some exercises in the generated plan are not valid. Please try regenerating.',
            details: `Invalid exercise IDs: ${invalidIds.join(', ')}`
          },
          { status: 400 }
        )
      }
    }

    // 3. Create main workout plan
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 28) // 4 weeks

    const { data: newPlan, error: planError } = await supabase
      .from('user_workout_plans')
      .insert({
        user_id: userId,
        plan_name: planMetadata.planName || 'Personalized 4-Week Plan',
        plan_type: planMetadata.planType || 'custom',
        weeks_duration: 4,
        days_per_week: planMetadata.daysPerWeek || 4,
        workouts_per_week: planMetadata.daysPerWeek || 4,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        split_pattern: planMetadata.splitPattern || 'auto',
        difficulty_level: planMetadata.difficultyLevel || 'intermediate',
        mesocycle_week: 1,
        status: 'active',
        ai_model_version: planMetadata.aiModelVersion || 'gpt-4o',
        generation_prompt: planMetadata.generationPrompt || 'AI-generated personalized workout plan'
      })
      .select()
      .single()

    if (planError) {
      log.error('Error creating workout plan', new Error(planError.message), undefined, {
        userId,
        errorCode: planError.code
      })
      return NextResponse.json(
        { error: 'Failed to create workout plan', details: planError.message },
        { status: 500 }
      )
    }

    log.info("Workout plan created successfully", undefined, {
      userId,
      planId: newPlan.id,
      planName: newPlan.plan_name
    })

    // 4. Create workouts and exercises for each week
    let totalWorkoutsCreated = 0
    let totalExercisesCreated = 0

    for (let weekNumber = 1; weekNumber <= 4; weekNumber++) {
      const week = weeks[weekNumber - 1]

      if (!week || !week.workouts || !Array.isArray(week.workouts)) {
        log.warn(`Week ${weekNumber} missing workouts data`, undefined, {
          userId,
          planId: newPlan.id,
          weekNumber
        })
        continue
      }

      for (const workout of week.workouts) {
        // Create workout
        const { data: newWorkout, error: workoutError } = await supabase
          .from('plan_workouts')
          .insert({
            plan_id: newPlan.id,
            week_number: weekNumber,
            workout_name: workout.workoutName || 'Workout',
            workout_type: workout.workoutType || 'strength',
            day_of_week: workout.dayOfWeek,
            estimated_duration_minutes: workout.estimatedDurationMinutes || 60,
            target_volume_sets: workout.targetVolumeSets || 0,
            intensity_level: workout.intensityLevel || 'moderate'
          })
          .select()
          .single()

        if (workoutError) {
          log.error('Error creating workout', new Error(workoutError.message), undefined, {
            userId,
            planId: newPlan.id,
            weekNumber,
            workoutName: workout.workoutName,
            errorCode: workoutError.code
          })
          continue
        }

        totalWorkoutsCreated++

        // Create exercises for this workout
        if (workout.exercises && Array.isArray(workout.exercises)) {
          const exercisesToInsert = workout.exercises.map((exercise: any, index: number) => ({
            plan_workout_id: newWorkout.id,
            exercise_id: exercise.exerciseId,
            target_sets: exercise.targetSets || 3,
            target_reps_min: exercise.targetRepsMin || 8,
            target_reps_max: exercise.targetRepsMax || 12,
            target_weight_lbs: exercise.targetWeightLbs || null,
            rest_seconds: exercise.restSeconds || 90,
            order_index: exercise.exerciseOrder || index,
            tempo: exercise.tempo || null,
            notes: exercise.notes || null
          }))

          const { error: exercisesError } = await supabase
            .from('plan_exercises')
            .insert(exercisesToInsert)

          if (exercisesError) {
            log.error('Error creating exercises', new Error(exercisesError.message), undefined, {
              userId,
              planId: newPlan.id,
              workoutId: newWorkout.id,
              weekNumber,
              errorCode: exercisesError.code
            })
          } else {
            totalExercisesCreated += exercisesToInsert.length
          }
        }
      }
    }

    log.info("Workout plan saved successfully", undefined, {
      userId,
      planId: newPlan.id,
      totalWorkouts: totalWorkoutsCreated,
      totalExercises: totalExercisesCreated
    })

    return NextResponse.json({
      success: true,
      planId: newPlan.id,
      startDate: newPlan.start_date,
      endDate: newPlan.end_date,
      totalWorkouts: totalWorkoutsCreated,
      totalExercises: totalExercisesCreated,
      message: `Successfully saved your 4-week workout plan with ${totalWorkoutsCreated} workouts and ${totalExercisesCreated} exercises`
    })

  } catch (error: any) {
    log.error('Error saving workout plan', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to save workout plan',
        details: error.message
      },
      { status: 500 }
    )
  }
}
