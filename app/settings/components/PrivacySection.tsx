"use client"

import { useState, useEffect } from "react"
import { Lock, BookOpen, Brain } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { hasAIConsent, revokeAIConsent } from "@/components/ai-consent-dialog"
import { useRouter } from "next/navigation"

const AI_CONSENT_KEY = "v-life-ai-data-consent"

interface PrivacySectionProps {
  onPrivacyPolicy: () => void
  onTermsOfService: () => void
  onExportData: () => void
  onDeleteAccount: () => void
}

export function PrivacySection({
  onPrivacyPolicy,
  onTermsOfService,
  onExportData,
  onDeleteAccount,
}: PrivacySectionProps) {
  const router = useRouter()
  const [aiConsent, setAiConsent] = useState(false)

  useEffect(() => {
    setAiConsent(hasAIConsent())
  }, [])

  const handleRevokeAIConsent = () => {
    revokeAIConsent()
    setAiConsent(false)
  }

  const handleGrantAIConsent = () => {
    localStorage.setItem(AI_CONSENT_KEY, "granted")
    setAiConsent(true)
  }

  return (
    <AccordionItem value="privacy" className="border-white/10 rounded-lg bg-black/30 backdrop-blur-sm">
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex items-center gap-2 text-lg font-bold text-white">
          <Lock className="h-5 w-5 text-accent" />
          Privacy & Data
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-3 pt-2">
          {/* AI Data Sharing Consent */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-sm font-medium text-white">AI Data Sharing</p>
                  <p className="text-xs text-white/50">
                    {aiConsent ? "Consent granted for AI features" : "AI features are disabled"}
                  </p>
                </div>
              </div>
              {aiConsent ? (
                <button
                  onClick={handleRevokeAIConsent}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                >
                  Revoke
                </button>
              ) : (
                <button
                  onClick={handleGrantAIConsent}
                  className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
                >
                  Enable
                </button>
              )}
            </div>
          </div>

          <ButtonGlow
            variant="outline-glow"
            className="w-full justify-start"
            onClick={() => router.push("/health-sources")}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Health Information Sources
          </ButtonGlow>
          <ButtonGlow
            variant="outline-glow"
            className="w-full justify-start"
            onClick={onPrivacyPolicy}
          >
            Privacy Policy
          </ButtonGlow>
          <ButtonGlow
            variant="outline-glow"
            className="w-full justify-start"
            onClick={onTermsOfService}
          >
            Terms of Service
          </ButtonGlow>
          <ButtonGlow
            variant="outline-glow"
            className="w-full justify-start"
            onClick={onExportData}
          >
            Export My Data
          </ButtonGlow>
          <ButtonGlow
            variant="outline-glow"
            className="w-full justify-start text-red-500"
            onClick={onDeleteAccount}
          >
            Delete Account
          </ButtonGlow>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
