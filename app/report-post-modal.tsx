"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Flag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReportPostModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  postTitle?: string
}

const REPORT_REASONS = [
  { id: "spam", label: "Spam or misleading", description: "Fake or deceptive content" },
  { id: "harassment", label: "Harassment or bullying", description: "Targeting or attacking someone" },
  { id: "hate", label: "Hate speech", description: "Attacking a group based on identity" },
  { id: "inappropriate", label: "Inappropriate content", description: "Sexual, violent, or offensive" },
  { id: "other", label: "Other", description: "Something else not listed above" },
] as const

export function ReportPostModal({ isOpen, onClose, postId, postTitle }: ReportPostModalProps) {
  const { toast } = useToast()
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [details, setDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast({
        title: "Please select a reason",
        description: "Choose why you're reporting this post.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { reportPost } = await import("@/lib/actions/community")
      const reason = REPORT_REASONS.find(r => r.id === selectedReason)?.label || selectedReason
      const result = await reportPost(postId, reason, details || undefined)

      if (result.success) {
        toast({
          title: "Report submitted",
          description: "Thank you for helping keep our community safe. We'll review this within 24 hours.",
        })
        handleClose()
      } else {
        toast({
          title: "Unable to submit report",
          description: result.error || "Please try again later.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedReason(null)
    setDetails("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="border-white/10 bg-gradient-to-b from-black to-charcoal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Flag className="h-5 w-5 text-red-400" />
            Report Post
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {postTitle ? `Reporting: "${postTitle}"` : "Help us understand what's wrong with this post."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-white">Why are you reporting this post?</Label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <motion.button
                  key={reason.id}
                  type="button"
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all min-h-[64px] ${
                    selectedReason === reason.id
                      ? "border-accent bg-accent/10"
                      : "border-white/10 bg-black/30 hover:bg-white/5"
                  }`}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="font-medium text-white">{reason.label}</div>
                  <div className="text-sm text-white/60">{reason.description}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="details" className="text-white">
                Please provide more details
              </Label>
              <Textarea
                id="details"
                placeholder="Describe the issue..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="bg-black/30 border-white/10 text-white placeholder:text-white/40"
                rows={3}
              />
            </div>
          )}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-sm text-white/80">
              We review all reports within 24 hours. False reports may result in action against your account.
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <ButtonGlow variant="outline-glow" className="flex-1" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </ButtonGlow>
          <ButtonGlow
            variant="glow"
            className="flex-1 bg-red-500 hover:bg-red-600"
            onClick={handleSubmit}
            disabled={!selectedReason}
            isLoading={isSubmitting}
            loadingText="Submitting..."
          >
            Submit Report
          </ButtonGlow>
        </div>
      </DialogContent>
    </Dialog>
  )
}
