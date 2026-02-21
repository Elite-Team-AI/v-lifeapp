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
    // TEMPORARILY DISABLED - Debugging Capacitor detection
    // Check if this is a web browser - redirect to download page
    /* DISABLED
    if (!isCapacitorApp()) {
      router.push("/download")
      return
    }
    */

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-4">
      {/* Animated gradient background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px] animate-blob" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

      <AnimatedRings />

      <motion.div
        className="relative z-10 flex flex-col items-center justify-center text-center"
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
          <img src="https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png" alt="V-Life Logo" className="h-48 w-auto drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]" />
        </motion.div>

        <motion.p
          className="mb-12 max-w-md text-xl text-white/80 leading-relaxed tracking-tight font-heading"
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
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
            <ButtonGlow
              variant="accent-glow"
              size="lg"
              onClick={() => router.push("/auth/sign-up")}
              className="text-base font-semibold tracking-wide relative"
            >
              Get Started
            </ButtonGlow>
          </div>

          <ButtonGlow
            variant="outline-glow"
            size="lg"
            onClick={() => router.push("/auth/login")}
            className="text-base font-semibold tracking-wide backdrop-blur-xl"
          >
            Sign In
          </ButtonGlow>
        </motion.div>
      </motion.div>
    </div>
  )
}
