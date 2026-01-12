"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, AlertTriangle, Trash2 } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { deleteAccount } from "@/lib/actions/account"

const CONFIRMATION_TEXT = "DELETE"

export default function DeleteAccountClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const isConfirmationValid = confirmText.toUpperCase() === CONFIRMATION_TEXT

  const handleBack = () => {
    if (typeof window === "undefined" || window.history.length <= 1) {
      router.push("/settings")
      return
    }
    router.back()
  }

  const handleDelete = async () => {
    if (!isConfirmationValid || isDeleting) return

    setIsDeleting(true)

    try {
      const result = await deleteAccount()

      if (result.success) {
        toast({
          title: "Account Deleted",
          description: "Your account and all data have been permanently deleted.",
        })
        // Redirect to home page after deletion
        router.push("/")
      } else {
        toast({
          title: "Deletion Failed",
          description: result.error || "Failed to delete account. Please try again.",
          variant: "destructive",
        })
        setIsDeleting(false)
      }
    } catch (error) {
      console.error("Delete account error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-charcoal">
      <div className="container max-w-md px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center">
          <ButtonGlow
            variant="outline-glow"
            size="icon"
            onClick={handleBack}
            className="mr-3 h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </ButtonGlow>
          <div>
            <h1 className="text-2xl font-bold text-white">Delete Account</h1>
            <p className="text-white/70">Permanently remove your account</p>
          </div>
        </div>

        {/* Warning Card */}
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/20">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">
                This action is permanent
              </h2>
              <p className="text-white/70 text-sm leading-relaxed">
                Deleting your account will permanently remove all of your data, including:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Your profile and settings
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  All workout history and progress
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Nutrition and meal logs
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Habits and streak data
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Community posts and interactions
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Any credits or referral rewards
                </li>
              </ul>
            </div>
          </div>
        </div>

        {!showConfirmation ? (
          /* Initial State - Show Delete Button */
          <div className="space-y-4">
            <p className="text-white/70 text-sm text-center">
              If you&apos;re sure you want to delete your account, click the button below to proceed.
            </p>
            <ButtonGlow
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => setShowConfirmation(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              I want to delete my account
            </ButtonGlow>
            <ButtonGlow
              variant="outline-glow"
              className="w-full"
              onClick={handleBack}
            >
              Cancel
            </ButtonGlow>
          </div>
        ) : (
          /* Confirmation State - Require typing DELETE */
          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <Label htmlFor="confirm-delete" className="text-white font-medium">
                To confirm deletion, type &quot;{CONFIRMATION_TEXT}&quot; below:
              </Label>
              <Input
                id="confirm-delete"
                type="text"
                placeholder={`Type ${CONFIRMATION_TEXT} to confirm`}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="mt-3 border-white/10 bg-white/5 text-white placeholder:text-white/40 uppercase"
                autoComplete="off"
                autoCapitalize="characters"
                disabled={isDeleting}
              />
            </div>

            <ButtonGlow
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50"
              onClick={handleDelete}
              disabled={!isConfirmationValid || isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting Account...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Permanently Delete My Account
                </>
              )}
            </ButtonGlow>

            <ButtonGlow
              variant="outline-glow"
              className="w-full"
              onClick={() => {
                setShowConfirmation(false)
                setConfirmText("")
              }}
              disabled={isDeleting}
            >
              Go Back
            </ButtonGlow>
          </div>
        )}

        {/* Help text */}
        <p className="mt-6 text-center text-xs text-white/50">
          Need help? Contact us at{" "}
          <a
            href="mailto:support@vlife.app"
            className="text-accent hover:underline"
          >
            support@vlife.app
          </a>
        </p>
      </div>
    </div>
  )
}
