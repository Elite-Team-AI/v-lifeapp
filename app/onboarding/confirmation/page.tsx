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
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-black to-charcoal p-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="mt-4 text-white/70">Verifying authentication...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Check if onboarding data is missing
  const hasRequiredData = data.name && data.name.trim() !== ""

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-black to-charcoal p-4">
      <motion.div
        className="mx-auto w-full max-w-md text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2,
          }}
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-black/50"
        >
          <CheckCircle className="h-16 w-16 text-accent animate-glow" />
        </motion.div>

        <motion.h1
          className="mb-3 text-3xl font-bold text-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {hasRequiredData ? "Profile Complete!" : "Profile Data Missing"}
        </motion.h1>

        <motion.p
          className="mb-8 text-white/70"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {hasRequiredData 
            ? "We're generating your personalized fitness and nutrition plan."
            : "It looks like your profile information wasn't saved. Please go back and complete your profile."}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-3">
          {hasRequiredData ? (
            <ButtonGlow
              variant="accent-glow"
              size="lg"
              onClick={saveProfile}
              disabled={isSaving}
              className="text-base font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
              className="text-base font-semibold"
            >
              Go Back to Profile
            </ButtonGlow>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
