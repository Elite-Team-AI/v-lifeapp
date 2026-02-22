"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ButtonGlow } from "@/components/ui/button-glow"
import { useToast } from "@/hooks/use-toast"
import { changePassword } from "@/lib/actions/auth"
import { Eye, EyeOff, Lock } from "lucide-react"

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const validateForm = () => {
    const newErrors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required"
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required"
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = "New password must be different from current password"
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some((error) => error !== "")
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const result = await changePassword(formData.currentPassword, formData.newPassword)

      if (result.success) {
        toast({
          title: "Password Changed",
          description: "Your password has been successfully updated.",
        })
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        onClose()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to change password",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    setErrors({ currentPassword: "", newPassword: "", confirmPassword: "" })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="border-white/10 bg-gradient-to-b from-black to-charcoal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Lock className="h-5 w-5 text-accent" />
            Change Password
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Enter your current password and choose a new one. Your password must be at least 8 characters long.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Password */}
          <div>
            <Label htmlFor="current-password" className="text-white">
              Current Password
            </Label>
            <div className="relative mt-2">
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter current password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="border-white/10 bg-white/5 pr-10 text-white placeholder:text-white/40"
              />
              <motion.button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </motion.button>
            </div>
            {errors.currentPassword && <p className="mt-1 text-xs text-red-400">{errors.currentPassword}</p>}
          </div>

          {/* New Password */}
          <div>
            <Label htmlFor="new-password" className="text-white">
              New Password
            </Label>
            <div className="relative mt-2">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="border-white/10 bg-white/5 pr-10 text-white placeholder:text-white/40"
              />
              <motion.button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </motion.button>
            </div>
            {errors.newPassword && <p className="mt-1 text-xs text-red-400">{errors.newPassword}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirm-password" className="text-white">
              Confirm New Password
            </Label>
            <div className="relative mt-2">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="border-white/10 bg-white/5 pr-10 text-white placeholder:text-white/40"
              />
              <motion.button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </motion.button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
          </div>

          {/* Password Requirements */}
          <div className="rounded-lg bg-accent/10 p-3 text-sm text-white/70">
            <p className="mb-2 font-bold text-white">Password Requirements:</p>
            <ul className="space-y-1 text-xs">
              <li>• At least 8 characters long</li>
              <li>• Different from your current password</li>
              <li>• Use a mix of letters, numbers, and symbols for better security</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <ButtonGlow variant="outline-glow" className="flex-1" onClick={handleClose} disabled={loading}>
            Cancel
          </ButtonGlow>
          <ButtonGlow
            variant="glow"
            className="flex-1"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText="Changing..."
          >
            Change Password
          </ButtonGlow>
        </div>
      </DialogContent>
    </Dialog>
  )
}
