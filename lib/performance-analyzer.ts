/**
 * Performance Analysis Utility
 *
 * Analyzes workout performance data to determine progression recommendations
 * for adaptive plan regeneration.
 */

interface WorkoutLog {
  id: string
  plan_workout_id: string
  actual_duration_minutes: number
  planned_duration_minutes: number
  total_exercises_completed: number
  total_sets_completed: number
  total_volume_lbs: number
  avg_rpe: number | null
  perceived_difficulty: number | null
  energy_level: number | null
  workout_date: string
  status: string
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

interface PlanExercise {
  id: string
  exercise_id: string
  target_sets: number
  target_reps_min: number
  target_reps_max: number
  rest_seconds: number
}

export interface PerformanceMetrics {
  completionRate: number // 0-100%
  volumeProgression: number // % change
  rpeAverage: number | null // 1-10
  consistencyScore: number // 0-100%
  readinessScore: number // 0-100%
  recoveryScore: number // 0-100%
}

export interface ProgressionRecommendation {
  action: 'increase' | 'maintain' | 'decrease' | 'deload'
  volumeAdjustment: number // % change
  intensityAdjustment: number // % change for weight
  recommendedReason: string
  confidence: number // 0-100%
}

export interface ExerciseProgression {
  exerciseId: string
  currentVolume: number
  currentIntensity: number // avg weight
  targetVolume: number
  targetIntensity: number
  setsAdjustment: number
  repsAdjustment: number
  weightAdjustment: number // % change
  recommendation: ProgressionRecommendation
}

/**
 * Calculate completion rate for a set of workouts
 */
export function calculateCompletionRate(workouts: WorkoutLog[]): number {
  if (workouts.length === 0) return 0

  const completedWorkouts = workouts.filter(w => w.status === 'completed').length
  return (completedWorkouts / workouts.length) * 100
}

/**
 * Calculate volume progression between two periods
 */
export function calculateVolumeProgression(
  currentPeriodVolume: number,
  previousPeriodVolume: number
): number {
  if (previousPeriodVolume === 0) return 0
  return ((currentPeriodVolume - previousPeriodVolume) / previousPeriodVolume) * 100
}

/**
 * Calculate average RPE across workouts
 */
export function calculateAverageRPE(workouts: WorkoutLog[]): number | null {
  const rpeValues = workouts.filter(w => w.avg_rpe !== null).map(w => w.avg_rpe!)
  if (rpeValues.length === 0) return null
  return rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length
}

/**
 * Calculate consistency score based on workout adherence
 */
export function calculateConsistencyScore(
  completedWorkouts: number,
  plannedWorkouts: number,
  daysCovered: number,
  idealDaysPerWorkout: number = 2
): number {
  // Frequency score: how many planned workouts were completed
  const frequencyScore = plannedWorkouts > 0
    ? (completedWorkouts / plannedWorkouts) * 100
    : 0

  // Distribution score: how well spread out were the workouts
  const idealWorkouts = Math.floor(daysCovered / idealDaysPerWorkout)
  const distributionScore = idealWorkouts > 0
    ? Math.min((completedWorkouts / idealWorkouts) * 100, 100)
    : 0

  return Math.round((frequencyScore + distributionScore) / 2)
}

/**
 * Calculate readiness score based on recent performance
 */
export function calculateReadinessScore(
  avgRPE: number | null,
  avgPerceivedDifficulty: number | null,
  avgEnergyLevel: number | null
): number {
  const scores: number[] = []

  // RPE component (lower is better for readiness)
  if (avgRPE !== null) {
    const rpeScore = Math.max(0, (10 - avgRPE) * 10)
    scores.push(rpeScore)
  }

  // Difficulty component (lower difficulty = higher readiness)
  if (avgPerceivedDifficulty !== null) {
    const difficultyScore = Math.max(0, (10 - avgPerceivedDifficulty) * 10)
    scores.push(difficultyScore)
  }

  // Energy component (higher energy = higher readiness)
  if (avgEnergyLevel !== null) {
    const energyScore = avgEnergyLevel * 10
    scores.push(energyScore)
  }

  if (scores.length === 0) return 50 // Neutral score if no data

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

/**
 * Calculate recovery score based on workout completion and RPE trends
 */
export function calculateRecoveryScore(
  workouts: WorkoutLog[],
  durationComplianceRate: number
): number {
  if (workouts.length === 0) return 50

  // Check RPE trend (increasing RPE = poor recovery)
  const rpeValues = workouts
    .filter(w => w.avg_rpe !== null)
    .map(w => w.avg_rpe!)

  let rpeScore = 50
  if (rpeValues.length >= 2) {
    const recentRPE = rpeValues[rpeValues.length - 1]
    const previousRPE = rpeValues[rpeValues.length - 2]

    if (recentRPE < previousRPE) {
      rpeScore = 75 // Improving recovery
    } else if (recentRPE === previousRPE) {
      rpeScore = 50 // Stable
    } else {
      rpeScore = 25 // Declining recovery
    }
  }

  // Duration compliance (completing workouts in planned time = better recovery)
  const durationScore = durationComplianceRate

  return Math.round((rpeScore + durationScore) / 2)
}

/**
 * Determine progression recommendation based on performance metrics
 */
export function determineProgressionRecommendation(
  metrics: PerformanceMetrics
): ProgressionRecommendation {
  const { completionRate, volumeProgression, rpeAverage, consistencyScore, readinessScore, recoveryScore } = metrics

  // Calculate overall performance score
  const performanceScore = (
    completionRate * 0.3 +
    consistencyScore * 0.2 +
    readinessScore * 0.25 +
    recoveryScore * 0.25
  )

  // Determine action based on performance
  let action: 'increase' | 'maintain' | 'decrease' | 'deload'
  let volumeAdjustment = 0
  let intensityAdjustment = 0
  let reason = ''
  let confidence = performanceScore

  // Excellent performance: increase load
  if (performanceScore >= 80 && (rpeAverage === null || rpeAverage < 7.5) && recoveryScore >= 60) {
    action = 'increase'
    volumeAdjustment = 5 // 5% volume increase
    intensityAdjustment = 2.5 // 2.5% weight increase
    reason = 'Excellent performance with good recovery. Ready for progression.'
    confidence = Math.min(confidence, 90)
  }
  // Good performance: small increase
  else if (performanceScore >= 70 && (rpeAverage === null || rpeAverage < 8.5) && recoveryScore >= 50) {
    action = 'increase'
    volumeAdjustment = 2.5 // 2.5% volume increase
    intensityAdjustment = 1.25 // 1.25% weight increase
    reason = 'Good performance. Gradual progression recommended.'
    confidence = Math.min(confidence, 80)
  }
  // Moderate performance: maintain
  else if (performanceScore >= 60 && performanceScore < 70) {
    action = 'maintain'
    volumeAdjustment = 0
    intensityAdjustment = 0
    reason = 'Solid performance. Maintain current volume to build consistency.'
    confidence = Math.min(confidence, 75)
  }
  // Poor performance but recovering: maintain or slight decrease
  else if (performanceScore >= 50 && recoveryScore >= 40) {
    action = 'maintain'
    volumeAdjustment = -2.5 // Slight volume decrease
    intensityAdjustment = 0
    reason = 'Performance below target. Maintain intensity while slightly reducing volume.'
    confidence = Math.min(confidence, 70)
  }
  // Poor performance with poor recovery: decrease
  else if (performanceScore >= 40 && performanceScore < 50) {
    action = 'decrease'
    volumeAdjustment = -10 // 10% volume decrease
    intensityAdjustment = -5 // 5% intensity decrease
    reason = 'Underperforming with recovery concerns. Reduce load to prevent overtraining.'
    confidence = Math.min(confidence, 65)
  }
  // Very poor performance or signs of overtraining: deload
  else {
    action = 'deload'
    volumeAdjustment = -30 // 30% volume reduction
    intensityAdjustment = -15 // 15% intensity reduction
    reason = 'Significant performance decline or recovery issues. Deload week recommended.'
    confidence = Math.min(confidence, 60)
  }

  // High RPE override: if RPE is consistently very high, recommend decrease
  if (rpeAverage !== null && rpeAverage >= 9 && action === 'increase') {
    action = 'maintain'
    volumeAdjustment = 0
    intensityAdjustment = 0
    reason = 'High RPE indicates near-maximal effort. Maintain current load.'
    confidence = 75
  }

  return {
    action,
    volumeAdjustment,
    intensityAdjustment,
    recommendedReason: reason,
    confidence: Math.round(confidence)
  }
}

/**
 * Calculate exercise-specific progression based on performance
 */
export function calculateExerciseProgression(
  exerciseLogs: ExerciseLog[],
  plannedExercise: PlanExercise,
  globalRecommendation: ProgressionRecommendation
): ExerciseProgression {
  if (exerciseLogs.length === 0) {
    // No data: maintain current plan
    return {
      exerciseId: plannedExercise.exercise_id,
      currentVolume: 0,
      currentIntensity: 0,
      targetVolume: 0,
      targetIntensity: 0,
      setsAdjustment: 0,
      repsAdjustment: 0,
      weightAdjustment: 0,
      recommendation: globalRecommendation
    }
  }

  // Calculate current performance
  const totalSetsCompleted = exerciseLogs.reduce((sum, log) => sum + log.sets_completed, 0)
  const avgSetsPerSession = totalSetsCompleted / exerciseLogs.length
  const totalVolume = exerciseLogs.reduce((sum, log) => sum + log.total_volume_lbs, 0)
  const avgVolumePerSession = totalVolume / exerciseLogs.length
  const avgWeight = exerciseLogs.reduce((sum, log) => sum + log.max_weight_lbs, 0) / exerciseLogs.length
  const avgRPE = exerciseLogs
    .filter(log => log.avg_rpe !== null)
    .reduce((sum, log, _, arr) => sum + log.avg_rpe! / arr.length, 0)

  // Determine adjustments based on global recommendation and exercise-specific data
  let setsAdjustment = 0
  let repsAdjustment = 0
  let weightAdjustment = globalRecommendation.intensityAdjustment

  const setCompletionRate = (avgSetsPerSession / plannedExercise.target_sets) * 100

  // Adjust sets based on completion rate
  if (globalRecommendation.action === 'increase') {
    if (setCompletionRate >= 95) {
      setsAdjustment = 1 // Add one set
    } else {
      setsAdjustment = 0 // Maintain sets, increase weight instead
      weightAdjustment = Math.max(weightAdjustment, 2.5)
    }
  } else if (globalRecommendation.action === 'decrease') {
    setsAdjustment = -1 // Remove one set
  } else if (globalRecommendation.action === 'deload') {
    setsAdjustment = Math.max(-2, Math.floor(plannedExercise.target_sets * -0.3)) // Reduce sets by 30% or 2, whichever is less
  }

  // Adjust reps based on RPE and completion
  if (avgRPE < 7 && globalRecommendation.action === 'increase') {
    repsAdjustment = 1 // Add one rep to target
  } else if (avgRPE > 9 && globalRecommendation.action !== 'increase') {
    repsAdjustment = -1 // Reduce one rep from target
  }

  // Calculate target values
  const targetSets = Math.max(1, plannedExercise.target_sets + setsAdjustment)
  const targetRepsMin = Math.max(1, plannedExercise.target_reps_min + repsAdjustment)
  const targetRepsMax = Math.max(targetRepsMin, plannedExercise.target_reps_max + repsAdjustment)
  const targetWeight = avgWeight * (1 + weightAdjustment / 100)
  const targetVolume = targetSets * ((targetRepsMin + targetRepsMax) / 2) * targetWeight

  return {
    exerciseId: plannedExercise.exercise_id,
    currentVolume: avgVolumePerSession,
    currentIntensity: avgWeight,
    targetVolume,
    targetIntensity: targetWeight,
    setsAdjustment,
    repsAdjustment,
    weightAdjustment,
    recommendation: {
      ...globalRecommendation,
      recommendedReason: `${globalRecommendation.recommendedReason} Exercise-specific: ${setCompletionRate.toFixed(0)}% set completion, ${avgRPE.toFixed(1)} avg RPE.`
    }
  }
}

/**
 * Analyze complete performance metrics
 */
export function analyzePerformance(
  currentWeekWorkouts: WorkoutLog[],
  previousWeekWorkouts: WorkoutLog[],
  plannedWorkoutsCount: number
): PerformanceMetrics {
  // Calculate completion rate
  const completionRate = calculateCompletionRate(currentWeekWorkouts)

  // Calculate volume progression
  const currentVolume = currentWeekWorkouts.reduce((sum, w) => sum + w.total_volume_lbs, 0)
  const previousVolume = previousWeekWorkouts.reduce((sum, w) => sum + w.total_volume_lbs, 0)
  const volumeProgression = calculateVolumeProgression(currentVolume, previousVolume)

  // Calculate average RPE
  const rpeAverage = calculateAverageRPE(currentWeekWorkouts)

  // Calculate consistency score
  const consistencyScore = calculateConsistencyScore(
    currentWeekWorkouts.filter(w => w.status === 'completed').length,
    plannedWorkoutsCount,
    7 // One week
  )

  // Calculate average perceived difficulty and energy level
  const difficultyValues = currentWeekWorkouts
    .filter(w => w.perceived_difficulty !== null)
    .map(w => w.perceived_difficulty!)
  const avgPerceivedDifficulty = difficultyValues.length > 0
    ? difficultyValues.reduce((sum, d) => sum + d, 0) / difficultyValues.length
    : null

  const energyValues = currentWeekWorkouts
    .filter(w => w.energy_level !== null)
    .map(w => w.energy_level!)
  const avgEnergyLevel = energyValues.length > 0
    ? energyValues.reduce((sum, e) => sum + e, 0) / energyValues.length
    : null

  // Calculate readiness score
  const readinessScore = calculateReadinessScore(rpeAverage, avgPerceivedDifficulty, avgEnergyLevel)

  // Calculate duration compliance
  const durationCompliance = currentWeekWorkouts.filter(w => {
    const variance = Math.abs(w.actual_duration_minutes - w.planned_duration_minutes) / w.planned_duration_minutes
    return variance <= 0.15 // Within 15% of planned duration
  }).length
  const durationComplianceRate = currentWeekWorkouts.length > 0
    ? (durationCompliance / currentWeekWorkouts.length) * 100
    : 50

  // Calculate recovery score
  const recoveryScore = calculateRecoveryScore(currentWeekWorkouts, durationComplianceRate)

  return {
    completionRate,
    volumeProgression,
    rpeAverage,
    consistencyScore,
    readinessScore,
    recoveryScore
  }
}
