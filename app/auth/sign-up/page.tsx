"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      console.log("[v0] Starting signup process for:", email)

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Use auth callback route for both web and mobile deep linking
          // This allows Universal Links (iOS) and App Links (Android) to open the app
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding/profile`,
          data: {
            email: email,
          },
        },
      })

      console.log("[v0] Sign up result:", {
        hasUser: !!data.user,
        hasSession: !!data.session,
        userId: data.user?.id,
        error: signUpError?.message,
      })

      if (signUpError) {
        console.error("[v0] Signup error:", signUpError)
        if (signUpError.message.includes("already registered")) {
          setError("This email is already registered. Please login instead.")
        } else if (signUpError.message.includes("invalid")) {
          setError("Invalid email or password format. Please try again.")
        } else {
          setError(signUpError.message)
        }
        setIsLoading(false)
        return
      }

      if (!data.user) {
        setError("Failed to create account. Please try again.")
        setIsLoading(false)
        return
      }

      // Profile is automatically created by database trigger on user signup
      console.log("[v0] User created successfully:", data.user.id)

      if (data.session) {
        console.log("[v0] Session exists, redirecting to onboarding")
        router.push("/onboarding/profile")
      } else {
        console.log("[v0] No session, email confirmation required")
        router.push("/auth/sign-up-success")
      }
    } catch (error: unknown) {
      console.error("[v0] Sign up error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during sign-up")
      setIsLoading(false)
    }
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
            className="mt-2 text-white/70 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Start your fitness journey
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
                <CardTitle className="text-2xl tracking-tight font-heading bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
                  Sign up
                </CardTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <CardDescription className="text-white/60 leading-relaxed">Create a new account</CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  <motion.div
                    className="grid gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Label htmlFor="email" className="text-white/90">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-white/10 backdrop-blur-xl bg-white/5 text-white placeholder:text-white/40 focus:border-accent/50 focus:bg-white/10 transition-all"
                      disabled={isLoading}
                    />
                  </motion.div>
                  <motion.div
                    className="grid gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Label htmlFor="password" className="text-white/90">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-white/10 backdrop-blur-xl bg-white/5 text-white pr-10 focus:border-accent/50 focus:bg-white/10 transition-all"
                        disabled={isLoading}
                      />
                      <motion.button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          console.log("[v0] Password toggle clicked, current state:", showPassword)
                          setShowPassword(!showPassword)
                          console.log("[v0] Password toggle new state:", !showPassword)
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-accent cursor-pointer z-10 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </motion.button>
                    </div>
                  </motion.div>
                  <motion.div
                    className="grid gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <Label htmlFor="repeat-password" className="text-white/90">
                      Repeat Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="repeat-password"
                        type={showRepeatPassword ? "text" : "password"}
                        required
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        className="border-white/10 backdrop-blur-xl bg-white/5 text-white pr-10 focus:border-accent/50 focus:bg-white/10 transition-all"
                        disabled={isLoading}
                      />
                      <motion.button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          console.log("[v0] Repeat password toggle clicked, current state:", showRepeatPassword)
                          setShowRepeatPassword(!showRepeatPassword)
                          console.log("[v0] Repeat password toggle new state:", !showRepeatPassword)
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-accent cursor-pointer z-10 transition-colors"
                        aria-label={showRepeatPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showRepeatPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </motion.button>
                    </div>
                  </motion.div>
                  {error && (
                    <motion.div
                      className="rounded-lg backdrop-blur-xl bg-red-500/10 border border-red-500/20 p-3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="relative group"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                    <Button
                      type="submit"
                      className="relative w-full bg-accent text-black font-semibold tracking-wide hover:bg-accent/90 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all duration-300"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Sign up"}
                    </Button>
                  </motion.div>
                </div>
                <motion.div
                  className="mt-4 text-center text-sm text-white/60 leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                >
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-accent underline underline-offset-4 hover:text-accent/80 font-medium transition-colors"
                  >
                    Login
                  </Link>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
