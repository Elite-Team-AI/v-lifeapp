"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Use auth callback route for both web and mobile deep linking
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      setSuccess(true)
    } catch (error: unknown) {
      console.error("[Forgot Password] Error:", error)
      setError(error instanceof Error ? error.message : "An error occurred while sending the reset email")
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <img
              src="https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png"
              alt="V-Life Logo"
              className="h-24 w-auto mx-auto mb-4"
            />
          </div>
          <Card className="border-gray-800 bg-[#1a1f2e]">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Check your email</CardTitle>
              <CardDescription className="text-gray-400">
                We've sent a password reset link to {email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="border-green-500 bg-green-500/10 mb-4">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">
                  Password reset email sent successfully!
                </AlertDescription>
              </Alert>
              <p className="text-sm text-gray-400 mb-4">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="w-full border-gray-700 text-white hover:bg-gray-800"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
          <p className="mt-2 text-gray-400">Reset your password</p>
        </div>
        <Card className="border-gray-800 bg-[#1a1f2e]">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Forgot password?</CardTitle>
            <CardDescription className="text-gray-400">
              Enter your email address and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-gray-200">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="border-gray-700 bg-[#0f1419] text-white placeholder:text-gray-500 focus:border-[#FFD700] focus:ring-[#FFD700]"
                  />
                </div>
                {error && (
                  <Alert className="border-red-500 bg-red-500/10">
                    <AlertDescription className="text-red-500">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send reset link"}
                </Button>
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    className="w-full text-gray-400 hover:text-white"
                    type="button"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
