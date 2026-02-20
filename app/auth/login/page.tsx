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
    <div className="flex min-h-screen w-full items-center justify-center bg-black p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img 
            src="https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png" 
            alt="V-Life Logo" 
            className="h-24 w-auto mx-auto mb-4" 
          />
          <p className="mt-2 text-gray-400">Welcome back</p>
        </div>
        <Card className="border-gray-800 bg-[#1a1f2e]">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Login</CardTitle>
            <CardDescription className="text-gray-400">Enter your email below to login to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
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
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-200">
                      Password
                    </Label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-accent hover:text-accent/80 underline underline-offset-4"
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
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-accent text-black font-semibold hover:bg-accent/90 shadow-[0_0_20px_rgba(196,169,98,0.5)] hover:shadow-[0_0_30px_rgba(196,169,98,0.7)] transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm text-gray-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/sign-up"
                  className="text-accent underline underline-offset-4 hover:text-accent/80 font-medium"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
