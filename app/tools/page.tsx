import { getWeightEntries, getProgressPhotos } from "@/lib/actions/progress"
import { getUserHabits, createDefaultHabits } from "@/lib/actions/habits"
import { getRecommendedSupplements } from "@/lib/actions/nutrition"
import { getWorkoutOverview } from "@/lib/actions/workouts"
import { ToolsClient } from "./ToolsClient"

type ToolsPageProps = {
  searchParams?: {
    supplement?: string
  }
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const [weightResult, photoResult, habitsResult, supplements, workoutOverview] = await Promise.all([
    getWeightEntries(),
    getProgressPhotos(),
    getUserHabits(),
    getRecommendedSupplements(),
    getWorkoutOverview(),
  ])

  let habits = habitsResult.habits || []
  if (habits.length === 0) {
    await createDefaultHabits()
    const retry = await getUserHabits()
    habits = retry.habits || []
  }

  return (
    <ToolsClient
      weightEntries={weightResult.entries}
      progressPhotos={photoResult.photos}
      supplements={supplements}
      habits={habits}
      initialSupplementId={searchParams?.supplement}
      workoutOverview={workoutOverview}
    />
  )
}
