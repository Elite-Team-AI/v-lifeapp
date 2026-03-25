"use client"

import { FitnessClientWrapper } from "./FitnessClientWrapper"

/**
 * Fitness page - uses wrapper for safe data loading
 *
 * The wrapper ensures all data is loaded before rendering FitnessClient,
 * preventing any "appData is not defined" errors.
 */
export default function FitnessPage() {
  return <FitnessClientWrapper />
}
