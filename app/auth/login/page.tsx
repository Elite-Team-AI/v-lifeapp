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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("[v0] Login result:", {
        hasUser: !!data.user,
        hasSession: !!data.session,
        userId: data.user?.id,
        error: error?.message,
      })

      if (error) {
        if (error.message === "Invalid login credentials") {
          setError("Invalid email or password. Please check your credentials and try again.")
        } else if (error.message.includes("Email not confirmed")) {
          setError("Please verify your email address before logging in. Check your inbox for the confirmation link.")
        } else {
          setError(error.message)
        }
        setIsLoading(false)
        return
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", data.user.id)
          .maybeSingle()

        console.log("[v0] Profile check:", { profile, onboardingCompleted: profile?.onboarding_completed })

        if (profile?.onboarding_completed) {
          router.push("/dashboard")
        } else {
          router.push("/onboarding/profile")
        }
      }
    } catch (error: unknown) {
      console.error("[v0] Login error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during login")
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
            className="mt-2 text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Welcome back
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
                  Login
                </CardTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <CardDescription className="text-white/60">
                  Enter your email below to login to your account
                </CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
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
                    />
                  </motion.div>
                  <motion.div
                    className="grid gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-white/90">
                        Password
                      </Label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm text-accent hover:text-accent/80 underline underline-offset-4 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-white/10 backdrop-blur-xl bg-white/5 text-white focus:border-accent/50 focus:bg-white/10 transition-all"
                    />
                  </motion.div>
                  {error && (
                    <motion.p
                      className="text-sm text-red-400 backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      {error}
                    </motion.p>
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
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>
                  </motion.div>
                </div>
                <motion.div
                  className="mt-4 text-center text-sm text-white/60"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                >
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/auth/sign-up"
                    className="text-accent underline underline-offset-4 hover:text-accent/80 font-medium transition-colors"
                  >
                    Sign up
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
