"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Brain, Mic, ChevronDown, ChevronUp } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"

const AI_CONSENT_KEY = "v-life-ai-data-consent"

type ConsentState = "granted" | "declined" | null

function getStoredConsent(): ConsentState {
  if (typeof window === "undefined") return null
  const val = localStorage.getItem(AI_CONSENT_KEY)
  if (val === "granted" || val === "declined") return val
  return null
}

export function hasAIConsent(): boolean {
  return getStoredConsent() === "granted"
}

export function revokeAIConsent(): void {
  if (typeof window === "undefined") return
  localStorage.setItem(AI_CONSENT_KEY, "declined")
}

interface AIConsentDialogProps {
  onConsent: () => void
  onDecline?: () => void
}

export function AIConsentDialog({ onConsent, onDecline }: AIConsentDialogProps) {
  const [showDetails, setShowDetails] = useState(false)

  const handleConsent = () => {
    localStorage.setItem(AI_CONSENT_KEY, "granted")
    onConsent()
  }

  const handleDecline = () => {
    localStorage.setItem(AI_CONSENT_KEY, "declined")
    onDecline?.()
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
            <Shield className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Data Sharing</h2>
            <p className="text-xs text-white/50">Your permission is required</p>
          </div>
        </div>

        <p className="text-sm text-white/80 mb-4">
          V-Life uses third-party AI services to power coaching and recommendations. Before using AI features, please review what data is shared and with whom.
        </p>

        {/* What data is shared */}
        <div className="space-y-3 mb-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-white">Data Shared with OpenAI</h3>
            </div>
            <p className="text-xs text-white/60 mb-2">Used for AI coaching (VBot), meal planning, daily insights, and food logging.</p>
            <ul className="text-xs text-white/70 space-y-1 pl-4 list-disc">
              <li>Profile info (name, age, gender, height, weight, goals)</li>
              <li>Workout history and exercise data</li>
              <li>Meal logs and nutrition data</li>
              <li>Habit tracking and streaks</li>
              <li>Weight entries and progress data</li>
              <li>Chat messages you send to VBot</li>
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Mic className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-white">Data Shared with Google</h3>
            </div>
            <p className="text-xs text-white/60 mb-2">Used for voice chat features (speech-to-text and text-to-speech).</p>
            <ul className="text-xs text-white/70 space-y-1 pl-4 list-disc">
              <li>Voice audio recordings (for transcription)</li>
              <li>AI response text (for voice playback)</li>
            </ul>
          </div>
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-xs text-accent mb-3"
        >
          {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showDetails ? "Hide details" : "More details"}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="text-xs text-white/60 space-y-2 p-3 rounded-lg bg-white/5 border border-white/10">
                <p><strong className="text-white/80">Why is my data shared?</strong> Your fitness data is sent to AI services so they can provide personalized coaching, meal plans, and recommendations based on your actual progress and goals.</p>
                <p><strong className="text-white/80">How is my data protected?</strong> All data is transmitted securely via encrypted connections (HTTPS/TLS). We do not sell your data. AI providers process your data according to their privacy policies and our data processing agreements.</p>
                <p><strong className="text-white/80">Can I use the app without AI?</strong> Yes. Core features like workout tracking, meal logging, habit tracking, and community features work without AI. Only VBot chat, AI meal planning, daily insights, and voice features require AI data sharing.</p>
                <p><strong className="text-white/80">Can I revoke consent?</strong> Yes. You can revoke AI data consent at any time in Settings, which will disable AI-powered features.</p>
                <p className="pt-1">For full details, see our <a href="/privacy-policy" className="text-accent underline">Privacy Policy</a>.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 mb-5">
          <p className="text-xs text-amber-200/80">
            AI-generated content is for informational purposes only and is not medical advice. Always consult a qualified healthcare professional before making changes to your diet or exercise routine.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10"
          >
            Decline
          </button>
          <ButtonGlow
            variant="accent-glow"
            className="flex-1 py-3"
            onClick={handleConsent}
          >
            I Agree
          </ButtonGlow>
        </div>
      </motion.div>
    </motion.div>
  )
}

/**
 * Hook that checks for AI consent and provides state + dialog trigger.
 * Returns:
 * - hasConsent: true (granted), false (declined or not yet asked), null (loading)
 * - needsPrompt: true if user has never been asked (no stored value)
 */
export function useAIConsent() {
  const [consentState, setConsentState] = useState<ConsentState | "loading">("loading")

  useEffect(() => {
    setConsentState(getStoredConsent())
  }, [])

  const hasConsent = consentState === "granted"
  const needsPrompt = consentState === null // never asked
  const isLoading = consentState === "loading"

  const grantConsent = () => setConsentState("granted")
  const declineConsent = () => setConsentState("declined")
  const resetConsent = () => {
    revokeAIConsent()
    setConsentState("declined")
  }

  return { hasConsent, needsPrompt, isLoading, grantConsent, declineConsent, resetConsent }
}
