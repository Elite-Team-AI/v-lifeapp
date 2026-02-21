"use client"

import { useRouter } from "next/navigation"
import { motion, useScroll, useTransform } from "framer-motion"
import { ButtonGlow } from "@/components/ui/button-glow"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  Award,
  Heart,
  Brain,
  Target,
  Check,
  ArrowRight,
  Star
} from "lucide-react"

/**
 * Check if running in Capacitor mobile app
 */
function isCapacitorApp(): boolean {
  const userAgent = navigator.userAgent || ""
  return userAgent.includes("Capacitor") ||
         userAgent.includes("CapacitorWebView") ||
         userAgent.includes("wv")
}

export default function LandingPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])

  useEffect(() => {
    // Check if this is a web browser - redirect to download page
    if (!isCapacitorApp()) {
      router.push("/download")
      return
    }

    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        // User is logged in, check onboarding status
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .single()

        if (profile?.onboarding_completed) {
          // Already completed onboarding, go to dashboard
          router.push("/dashboard")
        } else {
          // Need to complete onboarding
          router.push("/onboarding/profile")
        }
      } else {
        // Not logged in, show landing page
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router])

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-accent/20 animate-ping" />
        </div>
      </div>
    )
  }

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Coaching",
      description: "Personalized fitness and nutrition plans powered by advanced AI"
    },
    {
      icon: Target,
      title: "Smart Goal Tracking",
      description: "Set and achieve your fitness goals with intelligent progress tracking"
    },
    {
      icon: TrendingUp,
      title: "Real-time Analytics",
      description: "Comprehensive insights into your health and fitness journey"
    },
    {
      icon: Heart,
      title: "Holistic Wellness",
      description: "Track workouts, nutrition, habits, and mental wellbeing in one place"
    }
  ]

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "50K+", label: "Workouts Logged" },
    { value: "95%", label: "Success Rate" },
    { value: "4.9/5", label: "User Rating" }
  ]

  const benefits = [
    "AI-generated personalized workout plans",
    "Custom nutrition tracking and meal plans",
    "Daily habit tracking with streak system",
    "Progress photos and weight tracking",
    "Community support and challenges",
    "Real-time coaching and insights"
  ]

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px] animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

      {/* Hero Section */}
      <motion.div
        ref={heroRef}
        style={{ opacity, scale }}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20"
      >
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-accent/40 rounded-full"
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 100 - 50, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mb-8 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-full blur-2xl opacity-30 animate-glow-pulse" />
              <img
                src="https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png"
                alt="V-Life Logo"
                className="relative h-32 md:h-40 w-auto drop-shadow-2xl"
              />
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm text-accent font-medium">Powered by Advanced AI</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight"
          >
            Transform Your
            <span className="block bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
              Lifestyle
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Your personalized fitness, nutrition, and wellness journey—powered by AI.
            Track progress, build habits, and achieve your goals with intelligent coaching.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <ButtonGlow
              variant="accent-glow"
              size="lg"
              onClick={() => router.push("/auth/sign-up")}
              className="text-lg font-semibold px-8 py-6 group"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </ButtonGlow>

            <ButtonGlow
              variant="outline-glow"
              size="lg"
              onClick={() => router.push("/auth/login")}
              className="text-lg font-semibold px-8 py-6"
            >
              Sign In
            </ButtonGlow>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-accent to-yellow-300 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="relative py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-white/60">
              Powerful features designed to help you reach your goals
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm hover:border-accent/30 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300" />

                <div className="relative">
                  <div className="inline-flex p-3 rounded-xl bg-accent/10 border border-accent/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-6 w-6 text-accent" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>

                  <p className="text-white/60 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="relative py-32 px-4 bg-gradient-to-b from-transparent via-accent/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Choose V-Life?
            </h2>
            <p className="text-xl text-white/60">
              Join thousands who are transforming their lives
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-accent/30 transition-colors"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 border border-accent flex items-center justify-center mt-0.5">
                  <Check className="h-4 w-4 text-accent" />
                </div>
                <p className="text-white/80">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative py-32 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-3xl blur-3xl" />

          <div className="relative bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-12 backdrop-blur-xl">
            <Star className="h-16 w-16 text-accent mx-auto mb-6 animate-pulse" />

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform?
            </h2>

            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Join V-Life today and start your journey to a healthier, stronger you.
            </p>

            <ButtonGlow
              variant="accent-glow"
              size="lg"
              onClick={() => router.push("/auth/sign-up")}
              className="text-lg font-semibold px-12 py-6 group"
            >
              Get Started Free
              <Zap className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
            </ButtonGlow>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
