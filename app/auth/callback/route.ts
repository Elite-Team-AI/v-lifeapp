/**
 * Auth Callback Handler - Universal Links & App Links Support
 *
 * Handles authentication callbacks from Supabase emails:
 * - Email confirmation (type=signup)
 * - Password reset (type=recovery)
 * - Magic link login (type=magiclink)
 * - Email change confirmation (type=email_change)
 *
 * This route works for both web and mobile (iOS/Android) deep linking.
 * Mobile apps will open this URL via Universal Links/App Links and exchange
 * the token for a session, then redirect to the appropriate page in the app.
 */

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = searchParams.get("next") || "/dashboard"

  console.log("[Auth Callback] Processing auth callback:", {
    type,
    hasToken: !!token_hash,
    next
  })

  // Validate required parameters
  if (!token_hash || !type) {
    console.error("[Auth Callback] Missing required parameters")
    return NextResponse.redirect(new URL("/auth/login?error=invalid_link", request.url))
  }

  try {
    const supabase = await createClient()

    // Exchange the token_hash for a session
    // This works for all auth types (signup, recovery, magiclink, email_change)
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })

    if (error) {
      console.error("[Auth Callback] Token verification failed:", error)
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url)
      )
    }

    console.log("[Auth Callback] ✅ Token verified successfully, redirecting to:", next)

    // Determine redirect based on auth type
    let redirectPath = next

    switch (type) {
      case "signup":
        // Email confirmation - redirect to onboarding if not completed
        redirectPath = "/onboarding/profile"
        break

      case "recovery":
        // Password reset - redirect to password update page
        redirectPath = "/auth/update-password"
        break

      case "magiclink":
        // Magic link login - redirect to dashboard
        redirectPath = next || "/dashboard"
        break

      case "email_change":
        // Email change confirmation - redirect to settings
        redirectPath = "/settings/account"
        break

      default:
        redirectPath = next || "/dashboard"
    }

    return NextResponse.redirect(new URL(redirectPath, request.url))
  } catch (error) {
    console.error("[Auth Callback] Unexpected error:", error)
    return NextResponse.redirect(
      new URL("/auth/login?error=callback_failed", request.url)
    )
  }
}
