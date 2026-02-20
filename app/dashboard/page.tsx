import DashboardClientV2 from "./DashboardClientV2"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

/**
 * Dashboard page - Gamified V2
 *
 * Features XP, levels, achievements, and daily missions.
 * Data is fetched once at app start by AppDataProvider and cached.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const headersList = await headers()
  const userAgent = headersList.get("user-agent") || ""

  // Check if this is an email verification redirect
  const hasVerificationCode = params.code !== undefined

  // Check if request is from Capacitor mobile app
  const isCapacitorApp =
    userAgent.includes("Capacitor") ||
    userAgent.includes("CapacitorWebView") ||
    userAgent.includes("wv") // WebView indicator

  // If user arrived from email verification link and is on web browser,
  // redirect them to confirmation page instead of showing dashboard
  if (hasVerificationCode && !isCapacitorApp) {
    console.log("[Dashboard] Email verification from web browser detected, redirecting to confirmation page")
    redirect("/auth/confirmed?type=signup")
  }

  return <DashboardClientV2 />
}
