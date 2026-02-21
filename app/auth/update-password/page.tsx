"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user has an active session (from password reset email)
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setHasSession(!!session)

      if (!session) {
        setError("Invalid or expired password reset link. Please request a new one.")
      }
    }
    checkSession()
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      setSuccess(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error: unknown) {
      console.error("[Update Password] Error:", error)
      setError(error instanceof Error ? error.message : "An error occurred while updating your password")
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black p-6 overflow-hidden">
        {/* Animated gradient background */}
        <div className="fixed inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px] animate-blob" />
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-blob animation-delay-4000" />
        </div>

        {/* Grid pattern overlay */}
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

        <div className="relative z-10 w-full max-w-sm">
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.img
              src="https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png"
              alt="V-Life Logo"
              className="h-24 w-auto mx-auto mb-4 drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ y: -2 }}
          >
            <Card className="border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_40px_rgba(255,215,0,0.1)]">
              <CardHeader>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <CardTitle className="text-2xl bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
                    Success!
                  </CardTitle>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <CardDescription className="text-white/60">
                    Your password has been updated
                  </CardDescription>
                </motion.div>
              </CardHeader>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 200, damping: 15 }}
                >
                  <Alert className="border-green-500/30 backdrop-blur-xl bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                    <AlertDescription className="text-green-400">
                      Password updated successfully! Redirecting to dashboard...
                    </AlertDescription>
                  </Alert>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black p-6 overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px] animate-blob" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

      <div className="relative z-10 w-full max-w-sm">
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.img
            src="https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png"
            alt="V-Life Logo"
            className="h-24 w-auto mx-auto mb-4 drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          />
          <motion.p
            className="mt-2 text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Create a new password
          </motion.p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ y: -2 }}
        >
          <Card className="border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_40px_rgba(255,215,0,0.1)]">
            <CardHeader>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <CardTitle className="text-2xl bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
                  Update Password
                </CardTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <CardDescription className="text-white/60">
                  Enter your new password below
                </CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent>
              {!hasSession ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <Alert className="border-red-500/20 backdrop-blur-xl bg-red-500/10">
                    <AlertDescription className="text-red-400">
                      {error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              ) : (
                <form onSubmit={handleUpdatePassword}>
                  <div className="flex flex-col gap-6">
                    <motion.div
                      className="grid gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <Label htmlFor="password" className="text-white/90">
                        New Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="border-white/10 backdrop-blur-xl bg-white/5 text-white placeholder:text-white/40 focus:border-accent/50 focus:bg-white/10 transition-all"
                      />
                    </motion.div>
                    <motion.div
                      className="grid gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <Label htmlFor="confirm-password" className="text-white/90">
                        Confirm Password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="border-white/10 backdrop-blur-xl bg-white/5 text-white placeholder:text-white/40 focus:border-accent/50 focus:bg-white/10 transition-all"
                      />
                    </motion.div>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <Alert className="border-red-500/20 backdrop-blur-xl bg-red-500/10">
                          <AlertDescription className="text-red-400">
                            {error}
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="relative group"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                      <Button
                        type="submit"
                        className="relative w-full bg-accent text-black font-semibold hover:bg-accent/90 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all duration-300"
                        disabled={isLoading}
                      >
                        {isLoading ? "Updating..." : "Update Password"}
                      </Button>
                    </motion.div>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
