"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ButtonGlow } from "@/components/ui/button-glow"
import { AnimatedRings } from "@/components/animated-rings"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * Check if running in Capacitor mobile app
 */
function isCapacitorApp(): boolean {
  const userAgent = navigator.userAgent || ""
  return userAgent.includes("Capacitor") ||
         userAgent.includes("CapacitorWebView") ||
         userAgent.includes("wv")
}

export default function WelcomePage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if this is a web browser - redirect to download page
    if (!isCapacitorApp()) {
      router.push("/download")
      return
    }

    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        // User is logged in, check onboarding status
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .single()

        if (profile?.onboarding_completed) {
          // Already completed onboarding, go to dashboard
          router.push("/dashboard")
        } else {
          // Need to complete onboarding
          router.push("/onboarding/profile")
        }
      } else {
        // Not logged in, show welcome page
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router])

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black to-charcoal">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-black to-charcoal p-4">
      <AnimatedRings />

      <motion.div
        className="z-10 flex flex-col items-center justify-center text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="mb-6 text-6xl font-bold text-white"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <img src="https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png" alt="V-Life Logo" className="h-48 w-auto" />
        </motion.div>

        <motion.p
          className="mb-12 max-w-md text-xl text-white/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Your Lifestyle. Your Plan. <span className="text-accent">Powered by AI.</span>
        </motion.p>

        <motion.div
          className="flex flex-col gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <ButtonGlow
            variant="accent-glow"
            size="lg"
            onClick={() => router.push("/auth/sign-up")}
            className="text-base font-semibold"
          >
            Get Started
          </ButtonGlow>

          <ButtonGlow
            variant="outline-glow"
            size="lg"
            onClick={() => router.push("/auth/login")}
            className="text-base font-semibold"
          >
            Sign In
          </ButtonGlow>
        </motion.div>
      </motion.div>
    </div>
  )
}
