"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Mail } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function SignUpSuccessPage() {
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

      <div className="relative z-10 w-full max-w-md">
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
            Welcome to your fitness journey
          </motion.p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ y: -2 }}
        >
          <Card className="border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_40px_rgba(255,215,0,0.1)]">
            <CardHeader className="text-center">
              <motion.div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 backdrop-blur-xl border border-green-500/20"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircle2 className="h-8 w-8 text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <CardTitle className="text-2xl bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
                  Account Created!
                </CardTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <CardDescription className="text-white/60">
                  Check your email to verify your account
                </CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div
                className="rounded-lg border border-accent/30 backdrop-blur-xl bg-accent/10 p-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 15 }}
              >
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-accent mt-0.5 flex-shrink-0 drop-shadow-[0_0_5px_rgba(255,215,0,0.3)]" />
                  <div className="text-sm text-white/80">
                    <p className="font-medium text-white mb-1">Verification Email Sent</p>
                    <p>
                      We&apos;ve sent a confirmation link to your email. Please click the link to verify your account
                      before signing in.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="space-y-2 text-center text-sm text-white/60"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <p>After verifying your email, you can:</p>
                <ul className="space-y-1 text-left list-disc list-inside text-white/70">
                  <li>Complete your profile with fitness goals</li>
                  <li>Get personalized workout and meal plans</li>
                  <li>Track your progress and build streaks</li>
                  <li>Join the V-Life community</li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="relative group"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                <Button asChild className="relative w-full bg-accent text-black font-semibold hover:bg-accent/90 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all duration-300">
                  <Link href="/auth/login">Go to Login</Link>
                </Button>
              </motion.div>

              <motion.p
                className="text-center text-xs text-white/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
              >
                Didn&apos;t receive the email? Check your spam folder or contact support.
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
