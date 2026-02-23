"use client"

import { useState } from "react"
import { Gift, Copy, Check, Share2, Mail, MessageCircle, Briefcase } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useToast } from "@/hooks/use-toast"
import type { ReferralStats } from "@/lib/types"

interface ReferralsSectionProps {
  loading: boolean
  stats: ReferralStats
  onOpenAffiliateModal: () => void
}

export function ReferralsSection({ loading, stats, onOpenAffiliateModal }: ReferralsSectionProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const { referralCode, creditsBalance, referralsCount, creditsEarned } = stats

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
      })
    }
  }

  const shareReferralCode = async (platform: string) => {
    const message = `Join me on V-Life! Use my code ${referralCode} to get started. Your Lifestyle. Your Plan. Powered by AI.`
    const url = `https://vlife.app?ref=${referralCode}`

    if (platform === "native" && navigator.share) {
      try {
        await navigator.share({
          title: "Join V-Life",
          text: message,
          url: url,
        })
      } catch {
        // User cancelled share
      }
    } else if (platform === "email") {
      window.location.href = `mailto:?subject=Join me on V-Life&body=${encodeURIComponent(message + "\n\n" + url)}`
    } else if (platform === "sms") {
      window.location.href = `sms:?body=${encodeURIComponent(message + " " + url)}`
    }
  }

  return (
    <AccordionItem value="referrals" className="border-white/10 rounded-lg bg-black/30 backdrop-blur-sm">
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex items-center gap-2 text-lg font-bold text-white">
          <Gift className="h-5 w-5 text-accent" />
          Referrals & Rewards
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-4 pt-2">
          {/* Credits Balance */}
          <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-black/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Your Credits</h3>
                <Badge className="bg-accent text-black">{creditsBalance} Credits</Badge>
              </div>

              <div className="mb-4 text-center">
                <div className="text-4xl font-bold text-accent">{creditsBalance}</div>
                <div className="text-sm text-white/70">
                  {creditsBalance >= 12 ? "Free year available!" : `${12 - creditsBalance} more for a free year`}
                </div>
              </div>

              <div className="mb-4">
                <Progress
                  value={(creditsBalance / 12) * 100}
                  className="h-2 bg-white/10"
                  indicatorClassName="bg-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-black/30 p-3 text-center">
                  <div className="text-2xl font-bold text-white">{referralsCount}</div>
                  <div className="text-xs text-white/60">Referrals</div>
                </div>
                <div className="rounded-lg bg-black/30 p-3 text-center">
                  <div className="text-2xl font-bold text-white">{creditsEarned}</div>
                  <div className="text-xs text-white/60">Credits Earned</div>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-black/30 p-3 text-center text-xs text-white/70">
                Earn 3 credits per referral • 12 credits = 1 free month
              </div>
            </CardContent>
          </Card>

          {/* Referral Code */}
          <Card className="border-white/10 bg-black/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-bold text-white">Your Referral Code</h3>

              {loading ? (
                <div className="mb-4 text-center text-white/60">Generating code...</div>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex-1 rounded-lg bg-white/5 p-3 text-center font-mono text-lg font-bold text-accent">
                      {referralCode || "Loading..."}
                    </div>
                    <ButtonGlow
                      variant="outline-glow"
                      size="icon"
                      onClick={copyReferralCode}
                      className="h-12 w-12 shrink-0"
                      disabled={!referralCode}
                    >
                      {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </ButtonGlow>
                  </div>

                  <div className="space-y-2">
                    <ButtonGlow
                      variant="outline-glow"
                      className="w-full justify-start"
                      onClick={() => shareReferralCode("native")}
                      disabled={!referralCode}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Code
                    </ButtonGlow>
                    <div className="grid grid-cols-2 gap-2">
                      <ButtonGlow
                        variant="outline-glow"
                        className="justify-start"
                        onClick={() => shareReferralCode("email")}
                        disabled={!referralCode}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </ButtonGlow>
                      <ButtonGlow
                        variant="outline-glow"
                        className="justify-start"
                        onClick={() => shareReferralCode("sms")}
                        disabled={!referralCode}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        SMS
                      </ButtonGlow>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Affiliate Program */}
          <Card className="border-white/10 bg-gradient-to-br from-black to-charcoal backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-accent" />
                <h3 className="font-bold text-white">Affiliate Program</h3>
              </div>
              <p className="mb-4 text-sm text-white/70">
                Earn more by becoming an official V-Life affiliate. Get 2x credits per referral, priority support,
                and monthly referral stats.
              </p>
              <ButtonGlow variant="glow" className="w-full" onClick={onOpenAffiliateModal}>
                <Briefcase className="mr-2 h-4 w-4" />
                Become an Affiliate
              </ButtonGlow>
            </CardContent>
          </Card>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

