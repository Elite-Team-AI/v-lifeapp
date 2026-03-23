import { FitnessClient } from "./FitnessClient"

/**
 * Fitness page - now a lightweight client component
 *
 * Data is fetched client-side using the useFitnessData hook,
 * eliminating server-side blocking and enabling instant navigation.
 *
 * Force dynamic rendering to ensure AppDataContext is available
 * (required for visual_coach_enabled preference)
 */
export const dynamic = 'force-dynamic'

export default function FitnessPage() {
  return <FitnessClient />
}
