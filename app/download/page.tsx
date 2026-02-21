"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Smartphone, Apple } from "lucide-react"
import Link from "next/link"

export default function DownloadPage() {
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
            <CardTitle className="text-2xl text-white">Download V-Life App</CardTitle>
            <CardDescription className="text-gray-400 text-base">
              V-Life is a mobile-only fitness and wellness app. Download it on your iPhone or Android device to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-gradient-to-r from-[#FFD700]/10 to-[#FFA500]/10 border border-[#FFD700]/20 p-4 text-center">
              <p className="text-[#FFD700] font-medium mb-4">
                Available on iOS and Android
              </p>
              <div className="space-y-3">
                {/* iOS App Store Button */}
                <Link
                  href="https://apps.apple.com/in/app/v-life-fitness/id6757983194"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    variant="outline"
                    className="w-full border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:border-[#FFD700] transition-colors"
                  >
                    <Apple className="mr-2 h-5 w-5" />
                    Download on App Store
                  </Button>
                </Link>

                {/* Google Play Store Button */}
                <Link
                  href="https://play.google.com/store/apps/details?id=app.vlife.fitness&hl=en_US"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    variant="outline"
                    className="w-full border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:border-[#FFD700] transition-colors"
                  >
                    <Smartphone className="mr-2 h-5 w-5" />
                    Get it on Google Play
                  </Button>
                </Link>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Already have the app?{" "}
                <a
                  href="vlife://app"
                  className="text-[#FFD700] hover:text-[#FFD700]/80 underline"
                >
                  Open V-Life
                </a>
              </p>
            </div>

            <div className="border-t border-gray-700 pt-4 mt-4">
              <p className="text-xs text-gray-500 text-center">
                If you're accessing this from your mobile device and have the app installed,
                the links above should open the app directly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
