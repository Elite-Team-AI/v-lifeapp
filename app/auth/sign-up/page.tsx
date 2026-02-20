"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    <div className="flex min-h-screen w-full items-center justify-center bg-black p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img 
            src="https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png" 
            alt="V-Life Logo" 
            className="h-24 w-auto mx-auto mb-4" 
          />
          <p className="mt-2 text-gray-400">Start your fitness journey</p>
        </div>
        <Card className="border-gray-800 bg-[#1a1f2e]">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Sign up</CardTitle>
            <CardDescription className="text-gray-400">Create a new account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-gray-200">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-gray-200">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-gray-700 bg-gray-800 text-white pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        console.log("[v0] Password toggle clicked, current state:", showPassword)
                        setShowPassword(!showPassword)
                        console.log("[v0] Password toggle new state:", !showPassword)
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 cursor-pointer z-10"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="repeat-password" className="text-gray-200">
                    Repeat Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="repeat-password"
                      type={showRepeatPassword ? "text" : "password"}
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      className="border-gray-700 bg-gray-800 text-white pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        console.log("[v0] Repeat password toggle clicked, current state:", showRepeatPassword)
                        setShowRepeatPassword(!showRepeatPassword)
                        console.log("[v0] Repeat password toggle new state:", !showRepeatPassword)
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 cursor-pointer z-10"
                      aria-label={showRepeatPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showRepeatPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3">
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-accent text-black font-semibold hover:bg-accent/90 shadow-[0_0_20px_rgba(196,169,98,0.5)] hover:shadow-[0_0_30px_rgba(196,169,98,0.7)] transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Sign up"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm text-gray-400">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-accent underline underline-offset-4 hover:text-accent/80 font-medium"
                >
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
