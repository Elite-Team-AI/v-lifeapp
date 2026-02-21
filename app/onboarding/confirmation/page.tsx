"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle, Loader2 } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { useOnboarding } from "@/lib/contexts/onboarding-context"
import { useAppData } from "@/lib/contexts/app-data-context"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { isNetworkError } from "@/lib/utils/retry"

export default function Confirmation() {
  const router = useRouter()
  const { data, clearData } = useOnboarding()
  const { refresh } = useAppData()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    console.log("[Onboarding] Confirmation page loaded with data:", data)
    
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      console.log("[Onboarding] Auth check:", {
        hasSession: !!session,
        userId: session?.user?.id,
        error: error?.message,
      })

      setIsAuthenticated(!!session)
      setIsChecking(false)

      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to continue.",
          variant: "destructive",
        })
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router, toast, data])

  const saveProfile = async () => {
    setIsSaving(true)

    console.log("[Onboarding] Saving profile with data:", data)

    try {
      if (!data.name || data.name.trim() === "") {
        console.error("[Onboarding] Name is missing! Full data:", data)
        throw new Error("Name is required. Please go back and complete your profile.")
      }

      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to save profile")
      }

      toast({
        title: "Profile saved!",
        description: "Your personalized plan is ready.",
      })

      // Refresh app data to load new profile information
      console.log("[Onboarding] Refreshing app data after profile save...")
      await refresh()
      console.log("[Onboarding] App data refreshed successfully")

      // Navigate to dashboard - clearData will happen on unmount
      router.push("/dashboard")

      // Clear onboarding data after navigation starts
      setTimeout(() => {
        clearData()
      }, 100)
    } catch (error: unknown) {
      console.error("[v0] Error saving profile:", error)

      let errorMessage = "Please try again or contact support."

      if (error instanceof Error) {
        if (isNetworkError(error)) {
          errorMessage = "Network connection issue. Please check your internet and try again."
        } else if (error.message?.includes("check constraint")) {
          errorMessage = "Some profile information is invalid. Please review your inputs."
        } else if (error.message) {
          errorMessage = error.message
        }
      }

      toast({
        title: "Error saving profile",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isChecking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black overflow-hidden p-4">
        {/* Animated gradient background */}
        <div className="fixed inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px] animate-blob" />
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-blob animation-delay-4000" />
        </div>

        {/* Grid pattern overlay */}
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Loader2 className="h-12 w-12 animate-spin text-accent drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
          </motion.div>
          <motion.p
            className="mt-4 text-white/70 leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Verifying authentication...
          </motion.p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Check if onboarding data is missing
  const hasRequiredData = data.name && data.name.trim() !== ""

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black overflow-hidden p-4">
      {/* Animated gradient background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px] animate-blob" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

      <motion.div
        className="relative z-10 mx-auto w-full max-w-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
          className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full backdrop-blur-xl bg-accent/10 border-2 border-accent/30 shadow-[0_0_40px_rgba(255,215,0,0.3)]"
        >
          <CheckCircle className="h-20 w-20 text-accent animate-glow-pulse" />
        </motion.div>

        <motion.h1
          className="mb-4 text-4xl font-bold tracking-tight font-heading bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {hasRequiredData ? "Profile Complete!" : "Profile Data Missing"}
        </motion.h1>

        <motion.p
          className="mb-10 text-lg text-white/70 leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {hasRequiredData
            ? "We're generating your personalized fitness and nutrition plan."
            : "It looks like your profile information wasn't saved. Please go back and complete your profile."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
            {hasRequiredData ? (
              <ButtonGlow
                variant="accent-glow"
                size="lg"
                onClick={saveProfile}
                disabled={isSaving}
                className="w-full h-12 text-base font-semibold tracking-wide relative"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  "Generate My Plan"
                )}
              </ButtonGlow>
            ) : (
              <ButtonGlow
                variant="accent-glow"
                size="lg"
                onClick={() => router.push("/onboarding/profile")}
                className="w-full h-12 text-base font-semibold tracking-wide relative"
              >
                Go Back to Profile
              </ButtonGlow>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
