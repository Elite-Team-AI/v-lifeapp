/**
 * Adaptive Progression Algorithm
 *
 * Generates updated workout plans based on actual performance data
 * using progressive overload principles and autoregulation.
 */

import {
  PerformanceMetrics,
  ProgressionRecommendation,
  ExerciseProgression,
  determineProgressionRecommendation,
  calculateExerciseProgression
} from './performance-analyzer'

interface Exercise {
  id: string
  name: string
  category: string
  exercise_type: string
  target_muscles: string[]
  difficulty: string
}

interface PlanExercise {
  id: string
  exercise_id: string
  exercise: Exercise
  target_sets: number
  target_reps_min: number
  target_reps_max: number
  rest_seconds: number
  exercise_order: number
}

interface PlanWorkout {
  id: string
  workout_name: string
  workout_type: string
  day_of_week: number
  estimated_duration_minutes: number
  target_volume_sets: number
  plan_exercises: PlanExercise[]
}

interface WorkoutPlan {
  id: string
  user_id: string
  plan_name: string
  goal_type: string
  duration_weeks: number
  workouts_per_week: number
  current_week: number
  is_active: boolean
  plan_workouts: PlanWorkout[]
}

interface ExerciseLog {
  id: string
  exercise_id: string
  plan_exercise_id: string
  sets_completed: number
  total_volume_lbs: number
  max_weight_lbs: number
  avg_rpe: number | null
  exercise_type: string
}

interface RegeneratedPlanWorkout {
  workout_name: string
  workout_type: string
  day_of_week: number
  estimated_duration_minutes: number
  target_volume_sets: number
  exercises: RegeneratedPlanExercise[]
}

interface RegeneratedPlanExercise {
  exercise_id: string
  target_sets: number
  target_reps_min: number
  target_reps_max: number
  target_weight_lbs: number | null
  rest_seconds: number
  exercise_order: number
  progression_notes: string
}

/**
 * Generate updated workout plan based on performance
 */
export function regenerateWorkoutPlan(
  currentPlan: WorkoutPlan,
  performanceMetrics: PerformanceMetrics,
  exerciseLogsByExercise: Map<string, ExerciseLog[]>
): RegeneratedPlanWorkout[] {
  // Determine global progression recommendation
  const globalRecommendation = determineProgressionRecommendation(performanceMetrics)

  // Process each workout in the plan
  const regeneratedWorkouts = currentPlan.plan_workouts.map(workout => {
    return regenerateWorkout(
      workout,
      globalRecommendation,
      exerciseLogsByExercise,
      performanceMetrics
    )
  })

  return regeneratedWorkouts
}

/**
 * Regenerate a single workout with adaptive adjustments
 */
function regenerateWorkout(
  workout: PlanWorkout,
  globalRecommendation: ProgressionRecommendation,
  exerciseLogsByExercise: Map<string, ExerciseLog[]>,
  performanceMetrics: PerformanceMetrics
): RegeneratedPlanWorkout {
  // Process each exercise with individual progression
  const updatedExercises = workout.plan_exercises.map((planExercise, index) => {
    const exerciseLogs = exerciseLogsByExercise.get(planExercise.exercise_id) || []

    // Calculate exercise-specific progression
    const progression = calculateExerciseProgression(
      exerciseLogs,
      planExercise,
      globalRecommendation
    )

    // Determine target weight
    let targetWeight: number | null = null
    if (exerciseLogs.length > 0 && planExercise.exercise.exercise_type === 'strength') {
      const avgWeight = exerciseLogs.reduce((sum, log) => sum + log.max_weight_lbs, 0) / exerciseLogs.length
      targetWeight = Math.round(avgWeight * (1 + progression.weightAdjustment / 100) * 2) / 2 // Round to nearest 2.5 lbs
    }

    // Adjust rest time based on intensity changes
    let adjustedRest = planExercise.rest_seconds
    if (progression.weightAdjustment > 0) {
      adjustedRest = Math.min(adjustedRest + 15, 300) // Add 15s, max 5 min
    } else if (progression.weightAdjustment < -5) {
      adjustedRest = Math.max(adjustedRest - 15, 30) // Reduce 15s, min 30s
    }

    return {
      exercise_id: planExercise.exercise_id,
      target_sets: Math.max(1, planExercise.target_sets + progression.setsAdjustment),
      target_reps_min: Math.max(1, planExercise.target_reps_min + progression.repsAdjustment),
      target_reps_max: Math.max(
        planExercise.target_reps_min + progression.repsAdjustment + 1,
        planExercise.target_reps_max + progression.repsAdjustment
      ),
      target_weight_lbs: targetWeight,
      rest_seconds: adjustedRest,
      exercise_order: index,
      progression_notes: generateProgressionNotes(progression, exerciseLogs)
    }
  })

  // Calculate new target volume (sum of all exercise sets)
  const newTargetVolume = updatedExercises.reduce((sum, ex) => sum + ex.target_sets, 0)

  // Adjust estimated duration based on volume changes
  const volumeChangeRatio = newTargetVolume / workout.target_volume_sets
  const estimatedDuration = Math.round(workout.estimated_duration_minutes * volumeChangeRatio)

  return {
    workout_name: workout.workout_name,
    workout_type: workout.workout_type,
    day_of_week: workout.day_of_week,
    estimated_duration_minutes: Math.max(20, Math.min(estimatedDuration, 120)), // Cap between 20-120 min
    target_volume_sets: newTargetVolume,
    exercises: updatedExercises
  }
}

/**
 * Generate progression notes explaining the adjustments
 */
function generateProgressionNotes(
  progression: ExerciseProgression,
  exerciseLogs: ExerciseLog[]
): string {
  const notes: string[] = []

  if (exerciseLogs.length === 0) {
    return 'No previous data. Starting with planned parameters.'
  }

  // Sets adjustment
  if (progression.setsAdjustment > 0) {
    notes.push(`+${progression.setsAdjustment} set(s) - strong performance`)
  } else if (progression.setsAdjustment < 0) {
    notes.push(`${progression.setsAdjustment} set(s) - recovery focus`)
  }

  // Reps adjustment
  if (progression.repsAdjustment > 0) {
    notes.push(`+${progression.repsAdjustment} rep(s) - low RPE indicates capacity`)
  } else if (progression.repsAdjustment < 0) {
    notes.push(`${progression.repsAdjustment} rep(s) - high RPE, maintaining quality`)
  }

  // Weight adjustment
  if (progression.weightAdjustment > 2) {
    notes.push(`+${progression.weightAdjustment.toFixed(1)}% weight - progressive overload`)
  } else if (progression.weightAdjustment > 0) {
    notes.push(`+${progression.weightAdjustment.toFixed(1)}% weight - gradual progression`)
  } else if (progression.weightAdjustment < -5) {
    notes.push(`${progression.weightAdjustment.toFixed(1)}% weight - deload phase`)
  } else if (progression.weightAdjustment < 0) {
    notes.push(`${progression.weightAdjustment.toFixed(1)}% weight - recovery adjustment`)
  }

  if (notes.length === 0) {
    return 'Maintaining current parameters - consistent performance'
  }

  return notes.join('; ')
}

/**
 * Apply progressive overload rules to ensure safe progression
 */
export function applyProgressiveOverloadRules(
  regeneratedWorkouts: RegeneratedPlanWorkout[],
  currentPlan: WorkoutPlan
): RegeneratedPlanWorkout[] {
  // Rule 1: Limit total volume increase per week to 10%
  const currentTotalSets = currentPlan.plan_workouts.reduce(
    (sum, w) => sum + w.target_volume_sets, 0
  )
  const newTotalSets = regeneratedWorkouts.reduce(
    (sum, w) => sum + w.target_volume_sets, 0
  )

  if (newTotalSets > currentTotalSets * 1.1) {
    // Scale back all workouts proportionally
    const scaleFactor = (currentTotalSets * 1.1) / newTotalSets
    regeneratedWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exercise.target_sets = Math.max(1, Math.round(exercise.target_sets * scaleFactor))
      })
      workout.target_volume_sets = workout.exercises.reduce((sum, ex) => sum + ex.target_sets, 0)
    })
  }

  // Rule 2: Limit individual exercise set increases to 2 sets per week
  regeneratedWorkouts.forEach((workout, workoutIndex) => {
    const currentWorkout = currentPlan.plan_workouts[workoutIndex]
    workout.exercises.forEach((exercise, exerciseIndex) => {
      const currentExercise = currentWorkout?.plan_exercises[exerciseIndex]
      if (currentExercise && exercise.target_sets > currentExercise.target_sets + 2) {
        exercise.target_sets = currentExercise.target_sets + 2
      }
    })
  })

  // Rule 3: Limit weight increases to 5% for compound movements, 10% for isolation
  regeneratedWorkouts.forEach((workout, workoutIndex) => {
    const currentWorkout = currentPlan.plan_workouts[workoutIndex]
    workout.exercises.forEach((exercise, exerciseIndex) => {
      const currentExercise = currentWorkout?.plan_exercises[exerciseIndex]
      if (currentExercise && exercise.target_weight_lbs && currentExercise.target_sets >= 4) {
        // Compound movement (typically 4+ sets)
        const maxIncrease = currentExercise.target_sets * 1.05
        if (exercise.target_weight_lbs > maxIncrease) {
          exercise.target_weight_lbs = Math.round(maxIncrease * 2) / 2 // Round to 2.5 lbs
        }
      }
    })
  })

  // Rule 4: If deload week, ensure all exercises are reduced
  const isDeloadWeek = regeneratedWorkouts.every(w =>
    w.target_volume_sets < currentPlan.plan_workouts.find(
      cw => cw.workout_name === w.workout_name
    )?.target_volume_sets! * 0.8
  )

  if (isDeloadWeek) {
    regeneratedWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (exercise.target_weight_lbs) {
          exercise.target_weight_lbs = Math.round(exercise.target_weight_lbs * 0.7 * 2) / 2
        }
      })
    })
  }

  return regeneratedWorkouts
}

/**
 * Validate regenerated plan for safety and effectiveness
 */
export function validateRegeneratedPlan(
  regeneratedWorkouts: RegeneratedPlanWorkout[]
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []

  // Check for extreme volume changes
  regeneratedWorkouts.forEach(workout => {
    if (workout.target_volume_sets < 5) {
      warnings.push(`${workout.workout_name}: Very low volume (${workout.target_volume_sets} sets). Consider adding exercises.`)
    }
    if (workout.target_volume_sets > 30) {
      warnings.push(`${workout.workout_name}: Very high volume (${workout.target_volume_sets} sets). Risk of overtraining.`)
    }

    // Check for duration feasibility
    if (workout.estimated_duration_minutes > 90) {
      warnings.push(`${workout.workout_name}: Long duration (${workout.estimated_duration_minutes} min). May affect adherence.`)
    }

    // Check for exercise-specific issues
    workout.exercises.forEach(exercise => {
      if (exercise.target_sets > 8) {
        warnings.push(`Exercise has ${exercise.target_sets} sets. Consider splitting or reducing.`)
      }
      if (exercise.target_reps_max < exercise.target_reps_min) {
        warnings.push(`Invalid rep range for exercise. Min > Max.`)
      }
      if (exercise.rest_seconds < 30) {
        warnings.push(`Very short rest period (${exercise.rest_seconds}s). May affect performance.`)
      }
    })
  })

  return {
    valid: warnings.length === 0,
    warnings
  }
}

/**
 * Generate cycle plan (4 weeks) with progressive loading
 */
export function generateCyclePlan(
  baseWeekWorkouts: RegeneratedPlanWorkout[],
  performanceMetrics: PerformanceMetrics
): {
  week1: RegeneratedPlanWorkout[]
  week2: RegeneratedPlanWorkout[]
  week3: RegeneratedPlanWorkout[]
  week4: RegeneratedPlanWorkout[]
} {
  // Week 1: Base load (100%)
  const week1 = baseWeekWorkouts

  // Week 2: Progressive overload (+5% volume)
  const week2 = applyWeeklyProgression(baseWeekWorkouts, 1.05)

  // Week 3: Peak load (+10% volume from base)
  const week3 = applyWeeklyProgression(baseWeekWorkouts, 1.10)

  // Week 4: Deload (70% volume)
  const week4 = applyWeeklyProgression(baseWeekWorkouts, 0.70)

  return { week1, week2, week3, week4 }
}

/**
 * Apply weekly progression multiplier
 */
function applyWeeklyProgression(
  workouts: RegeneratedPlanWorkout[],
  multiplier: number
): RegeneratedPlanWorkout[] {
  return workouts.map(workout => ({
    ...workout,
    target_volume_sets: Math.round(workout.target_volume_sets * multiplier),
    exercises: workout.exercises.map(exercise => ({
      ...exercise,
      target_sets: Math.max(1, Math.round(exercise.target_sets * multiplier)),
      target_weight_lbs: exercise.target_weight_lbs
        ? Math.round(exercise.target_weight_lbs * (multiplier > 1 ? 1.02 : 0.95) * 2) / 2
        : null
    }))
  }))
}
