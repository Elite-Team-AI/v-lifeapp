"use client"

import { FitnessClient } from "./FitnessClient"

/**
 * Fitness page - client-only component
 *
 * Client component that uses AppDataContext.
 * Loading state is handled within FitnessClient component.
 */
export default function FitnessPage() {
  return <FitnessClient />
}
