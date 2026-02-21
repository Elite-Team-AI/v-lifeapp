"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function AuthConfirmedPage() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "signup"

  const getMessage = () => {
    switch (type) {
      case "signup":
        return {
          title: "Email Confirmed! ✅",
          description: "Your account has been successfully verified.",
          instruction: "Please return to the V-Life app to continue with onboarding."
        }
      case "recovery":
        return {
          title: "Password Reset Complete! ✅",
          description: "Your password has been successfully updated.",
          instruction: "Please return to the V-Life app to log in with your new password."
        }
      case "email_change":
        return {
          title: "Email Updated! ✅",
          description: "Your email address has been successfully changed.",
          instruction: "Please return to the V-Life app to continue."
        }
      case "magiclink":
        return {
          title: "Login Successful! ✅",
          description: "You've been successfully authenticated.",
          instruction: "Please return to the V-Life app to continue."
        }
      default:
        return {
          title: "Confirmed! ✅",
          description: "Your action has been successfully completed.",
          instruction: "Please return to the V-Life app to continue."
        }
    }
  }

  const message = getMessage()

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src="https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png"
            alt="V-Life Logo"
            className="h-24 w-auto mx-auto mb-4"
          />
        </div>
        <Card className="border-gray-800 bg-[#1a1f2e]">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-500/10 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">{message.title}</CardTitle>
            <CardDescription className="text-gray-400 text-base">
              {message.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="rounded-lg bg-gradient-to-r from-[#FFD700]/10 to-[#FFA500]/10 border border-[#FFD700]/20 p-4">
              <p className="text-[#FFD700] font-medium">
                {message.instruction}
              </p>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              You can safely close this browser window.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
