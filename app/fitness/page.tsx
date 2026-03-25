"use client"

import dynamic from "next/dynamic"

/**
 * Fitness page - client-only component
 *
 * Dynamically imported with SSR disabled to prevent build-time
 * static generation errors. AppDataContext is only available on
 * the client, so this page must render client-side only.
 */
const FitnessClient = dynamic(
  () => import("./FitnessClient").then((mod) => ({ default: mod.FitnessClient })),
  { ssr: false }
)

export default function FitnessPage() {
  return <FitnessClient />
}
