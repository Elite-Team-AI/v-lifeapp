"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
      <div className="flex min-h-screen w-full items-center justify-center bg-black p-6">
        <div className="w-full max-w-sm">
          <Alert className="border-green-500 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">
              Password updated successfully! Redirecting to dashboard...
            </AlertDescription>
          </Alert>
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
          <p className="mt-2 text-gray-400">Create a new password</p>
        </div>
        <Card className="border-gray-800 bg-[#1a1f2e]">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Update Password</CardTitle>
            <CardDescription className="text-gray-400">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasSession ? (
              <Alert className="border-red-500 bg-red-500/10">
                <AlertDescription className="text-red-500">
                  {error}
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleUpdatePassword}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-gray-200">
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
                      className="border-gray-700 bg-[#0f1419] text-white placeholder:text-gray-500 focus:border-[#FFD700] focus:ring-[#FFD700]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password" className="text-gray-200">
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
                    {isLoading ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
