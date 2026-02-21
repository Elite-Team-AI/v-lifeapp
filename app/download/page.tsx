"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Smartphone,
  Apple,
  Zap,
  Target,
  Brain,
  TrendingUp,
  Users,
  Heart,
  CheckCircle2,
  Star,
  Award,
  Sparkles,
  ChevronDown
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    "name": "V-Life",
    "applicationCategory": "HealthApplication",
    "operatingSystem": ["iOS", "Android"],
    "offers": {
      "@type": "Offer",
      "price": "9.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "10000",
      "bestRating": "5"
    },
    "description": "AI-powered fitness and wellness app with personalized workouts, nutrition plans, and 24/7 coaching"
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FFD700]/20 rounded-full blur-[128px] animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] animate-blob animation-delay-4000" />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#FFD700]/40 rounded-full"
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

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="mb-8 text-center"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full blur-2xl opacity-30 animate-glow-pulse" />
              <img
                src="https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png"
                alt="V-Life Logo"
                className="relative mx-auto h-24 w-auto sm:h-32 drop-shadow-2xl"
              />
            </div>
          </motion.div>

          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#FFD700]/10 to-[#FFA500]/10 border border-[#FFD700]/20 backdrop-blur-xl"
            >
              <Sparkles className="h-4 w-4 text-[#FFD700] animate-pulse" />
              <span className="text-sm font-semibold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                AI-Powered Fitness Revolution
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6 text-4xl font-bold tracking-tight font-heading sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Transform Your Body.{" "}
              <span className="bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
                Master Your Life.
              </span>
            </motion.h1>

            <p className="mx-auto mb-4 max-w-2xl text-lg text-gray-300 sm:text-xl md:text-2xl leading-relaxed">
              Your AI-powered fitness companion that adapts to YOUR lifestyle
            </p>

            <p className="mx-auto mb-8 max-w-xl text-base text-gray-400 sm:text-lg leading-relaxed">
              Join thousands who've transformed their health with personalized workouts, nutrition plans, and 24/7 AI coaching
            </p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <div className="relative group w-full sm:w-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-300 animate-pulse" />
                <Link
                  href="https://apps.apple.com/in/app/v-life-fitness/id6757983194"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    className="relative w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black hover:from-[#FFA500] hover:to-[#FFD700] font-semibold text-base sm:text-lg px-8 py-7 shadow-2xl shadow-[#FFD700]/50 group-hover:scale-105 transition-transform duration-300"
                  >
                    <Apple className="mr-2 h-6 w-6" />
                    Download for iPhone
                  </Button>
                </Link>
              </div>

              <div className="relative group w-full sm:w-auto">
                <div className="absolute inset-0 bg-[#FFD700]/30 rounded-xl blur-md opacity-0 group-hover:opacity-50 transition-all duration-300" />
                <Link
                  href="https://play.google.com/store/apps/details?id=app.vlife.fitness&hl=en_US"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="relative w-full border-2 border-[#FFD700] bg-black/50 backdrop-blur-xl text-white hover:bg-[#FFD700]/20 font-semibold text-base sm:text-lg px-8 py-7 group-hover:scale-105 transition-all duration-300"
                  >
                    <Smartphone className="mr-2 h-6 w-6" />
                    Download for Android
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-[#FFD700] text-[#FFD700]" />
                <span>4.8/5 App Store Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#FFD700]" />
                <span>10,000+ Active Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-[#FFD700]" />
                <span>Featured by Apple</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 text-center"
          >
            <button
              onClick={() => scrollToSection('problem')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ChevronDown className="mx-auto h-8 w-8 animate-bounce" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="bg-gray-900 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="mb-6 text-3xl font-bold tracking-tight font-heading sm:text-4xl md:text-5xl">
              Tired of{" "}
              <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                Generic Fitness Apps?
              </span>
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-gray-300 sm:text-xl leading-relaxed">
              Most fitness apps give you cookie-cutter plans that don't fit your life. They don't know if you're a busy parent, a shift worker, or someone who travels constantly.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "❌",
                title: "One-Size-Fits-All Plans",
                description: "Generic workouts that ignore your schedule, preferences, and goals"
              },
              {
                icon: "😴",
                title: "No Real Support",
                description: "You're left alone to figure everything out with zero guidance"
              },
              {
                icon: "📊",
                title: "Confusing Tracking",
                description: "Complicated apps that feel like homework instead of progress"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Card className="group h-full border-red-900/30 bg-gradient-to-br from-red-950/40 to-red-900/20 backdrop-blur-xl hover:border-red-500/40 transition-all duration-300 shadow-lg hover:shadow-red-500/20">
                  <CardContent className="p-6">
                    <motion.div
                      className="mb-4 text-5xl"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {item.icon}
                    </motion.div>
                    <h3 className="mb-3 text-xl font-semibold tracking-tight font-heading text-white group-hover:text-red-400 transition-colors">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="bg-gradient-to-b from-black to-gray-900 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="mb-4 flex justify-center">
              <Sparkles className="h-12 w-12 text-[#FFD700]" />
            </div>
            <h2 className="mb-6 text-3xl font-bold tracking-tight font-heading sm:text-4xl md:text-5xl">
              Meet{" "}
              <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                V-Life
              </span>
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-gray-300 sm:text-xl leading-relaxed">
              The only fitness app powered by AI that truly understands YOU. Your schedule. Your preferences. Your goals.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Brain className="h-8 w-8" />,
                title: "AI Personal Coach",
                description: "VBot learns your patterns and provides 24/7 personalized guidance, just like having a real coach in your pocket"
              },
              {
                icon: <Target className="h-8 w-8" />,
                title: "Smart Workouts",
                description: "Dynamic routines that adapt to your energy, time, and equipment. Busy day? Get a quick 15-min workout"
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: "Instant Meal Plans",
                description: "AI-generated nutrition plans based on your preferences, dietary restrictions, and calorie goals"
              },
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: "Progress Tracking",
                description: "Visual progress photos, weight trends, and habit streaks that keep you motivated"
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Community Support",
                description: "Connect with thousands of members on the same journey. Share wins, get support, stay accountable"
              },
              {
                icon: <Heart className="h-8 w-8" />,
                title: "Holistic Wellness",
                description: "Track habits, sleep, water intake, and supplements. Because fitness is more than just workouts"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -12, transition: { duration: 0.2 } }}
              >
                <Card className="group h-full relative border-[#FFD700]/20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl transition-all duration-300 hover:border-[#FFD700]/60 hover:shadow-2xl hover:shadow-[#FFD700]/30 overflow-hidden">
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/0 via-[#FFD700]/0 to-[#FFA500]/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

                  {/* Glow effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#FFD700] to-transparent" />
                  </div>

                  <CardContent className="relative p-6">
                    <motion.div
                      className="mb-4 inline-flex p-3 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700]"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="mb-3 text-xl font-semibold tracking-tight font-heading text-white group-hover:text-[#FFD700] transition-colors">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="bg-gray-900 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="mb-4 text-3xl font-bold tracking-tight font-heading sm:text-4xl md:text-5xl">
              Real People.{" "}
              <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                Real Results.
              </span>
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-300 leading-relaxed">
              Don't just take our word for it. Here's what V-Life members are saying:
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Sarah M.",
                role: "Busy Mom of 3",
                quote: "Finally, an app that gets my crazy schedule! Lost 22 lbs in 3 months with workouts I can actually fit into my day.",
                rating: 5
              },
              {
                name: "Marcus T.",
                role: "Software Engineer",
                quote: "VBot is like having a personal trainer who actually knows me. The AI meal plans saved me hours each week.",
                rating: 5
              },
              {
                name: "Jennifer K.",
                role: "Nurse (Night Shifts)",
                quote: "Other apps couldn't handle my rotating schedule. V-Life adapts to my life, not the other way around. Game changer!",
                rating: 5
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
              >
                <Card className="group h-full border-[#FFD700]/20 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl hover:border-[#FFD700]/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#FFD700]/20">
                  <CardContent className="p-6">
                    <div className="mb-4 flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0, rotate: -180 }}
                          whileInView={{ scale: 1, rotate: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.1 + i * 0.05, type: "spring" }}
                        >
                          <Star className="h-5 w-5 fill-[#FFD700] text-[#FFD700] drop-shadow-lg" />
                        </motion.div>
                      ))}
                    </div>
                    <p className="mb-4 text-gray-300 italic leading-relaxed group-hover:text-white transition-colors">"{testimonial.quote}"</p>
                    <div className="border-t border-gray-700/50 pt-4">
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-sm text-[#FFD700]/80">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing/CTA Section */}
      <section className="bg-gradient-to-b from-black via-[#FFD700]/5 to-black py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="mb-6 text-3xl font-bold tracking-tight font-heading sm:text-4xl md:text-5xl">
              Start Your Transformation{" "}
              <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                Today
              </span>
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-300 sm:text-xl leading-relaxed">
              Download V-Life now and get instant access to your AI coach, personalized plans, and a community of 10,000+ members
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative mx-auto max-w-4xl group"
          >
            {/* Outer glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/30 to-[#FFA500]/30 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 animate-pulse" />

            <Card className="relative border-2 border-[#FFD700]/60 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-2xl shadow-2xl shadow-[#FFD700]/30 overflow-hidden">
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 via-transparent to-[#FFA500]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Top border shine */}
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#FFD700] to-transparent" />

              <CardContent className="relative p-8 sm:p-12">
                <div className="mb-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 border border-[#FFD700]/40 backdrop-blur-xl px-4 py-2"
                  >
                    <Sparkles className="h-5 w-5 text-[#FFD700] animate-pulse" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">LIMITED TIME OFFER</span>
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="mb-4 text-4xl font-bold tracking-tight font-heading text-white sm:text-5xl"
                  >
                    7-Day Free Trial
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-gray-300"
                  >
                    Then just <span className="font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">$9.99/month</span>
                  </motion.p>
                  <p className="mt-2 text-sm text-gray-400">Cancel anytime. No commitment.</p>
                </div>

                <div className="mb-8 space-y-4">
                  {[
                    "Unlimited AI coaching & personalized plans",
                    "Custom workout routines for any schedule",
                    "AI-powered meal planning & nutrition tracking",
                    "Progress tracking with photos & metrics",
                    "Access to premium community features",
                    "New features added monthly"
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="group flex items-start gap-3 hover:translate-x-2 transition-transform duration-200"
                    >
                      <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#FFD700] group-hover:scale-110 transition-transform" />
                      <span className="text-gray-300 leading-relaxed group-hover:text-white transition-colors">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-300 animate-pulse" />
                    <Link
                      href="https://apps.apple.com/in/app/v-life-fitness/id6757983194"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="lg"
                        className="relative w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black hover:from-[#FFA500] hover:to-[#FFD700] font-bold text-lg py-7 shadow-2xl shadow-[#FFD700]/50 group-hover:scale-105 transition-transform duration-300"
                      >
                        <Apple className="mr-2 h-7 w-7" />
                        Start Free Trial on iPhone
                      </Button>
                    </Link>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-300 animate-pulse" />
                    <Link
                      href="https://play.google.com/store/apps/details?id=app.vlife.fitness&hl=en_US"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="lg"
                        className="relative w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black hover:from-[#FFA500] hover:to-[#FFD700] font-bold text-lg py-7 shadow-2xl shadow-[#FFD700]/50 group-hover:scale-105 transition-transform duration-300"
                      >
                        <Smartphone className="mr-2 h-7 w-7" />
                        Start Free Trial on Android
                      </Button>
                    </Link>
                  </div>
                </div>

                <p className="mt-6 text-center text-sm text-gray-400">
                  💳 No credit card required for free trial
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-sm text-gray-400">
              Join 10,000+ members who've already transformed their lives with V-Life
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-900 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold tracking-tight font-heading sm:text-4xl md:text-5xl">
              Frequently Asked{" "}
              <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              Got questions? We've got answers.
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                question: "Is V-Life really mobile-only?",
                answer: "Yes! V-Life is designed exclusively for mobile devices (iPhone and Android). This allows us to leverage your phone's capabilities like camera for progress photos, notifications for habit reminders, and seamless on-the-go access."
              },
              {
                question: "How does the AI coaching work?",
                answer: "VBot, your AI coach, learns from your inputs, progress, and preferences. It provides personalized workout suggestions, meal plans, and answers your fitness questions 24/7. The more you use it, the smarter it gets about YOUR specific needs."
              },
              {
                question: "Do I need any equipment?",
                answer: "Not at all! V-Life includes workouts for every situation - home workouts with no equipment, gym routines, resistance band exercises, and more. The AI adapts to whatever equipment you have access to."
              },
              {
                question: "Can I cancel my subscription anytime?",
                answer: "Absolutely. You can cancel your subscription at any time through your App Store or Google Play account settings. No questions asked, no hassle."
              },
              {
                question: "Is the free trial really free?",
                answer: "Yes! You get full access to all premium features for 7 days, completely free. No credit card required to start. If you love it (and we're confident you will), you can subscribe after the trial ends."
              },
              {
                question: "What makes V-Life different from other fitness apps?",
                answer: "V-Life is the only app that truly adapts to YOUR life with AI. Most apps give you static plans. V-Life learns your schedule, preferences, and goals to provide dynamic, personalized guidance that evolves with you."
              }
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group border-gray-700/50 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl hover:border-[#FFD700]/30 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <CardContent className="p-0">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-white/5 rounded-t-xl"
                    >
                      <span className="pr-4 text-lg font-semibold tracking-tight font-heading text-white group-hover:text-[#FFD700] transition-colors">{faq.question}</span>
                      <ChevronDown
                        className={`h-5 w-5 flex-shrink-0 text-[#FFD700] transition-transform duration-300 ${
                          openFaq === i ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-700/50 p-6 pt-4 overflow-hidden"
                      >
                        <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-b from-black to-gray-900 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 text-3xl font-bold tracking-tight font-heading sm:text-4xl md:text-5xl">
              Your Transformation Starts{" "}
              <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                Right Now
              </span>
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300 sm:text-xl leading-relaxed">
              Don't wait another day to become the person you've always wanted to be. Download V-Life and start your 7-day free trial today.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <div className="relative group w-full sm:w-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-300 animate-pulse" />
                <Link
                  href="https://apps.apple.com/in/app/v-life-fitness/id6757983194"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    className="relative w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black hover:from-[#FFA500] hover:to-[#FFD700] font-semibold text-base sm:text-lg px-8 py-7 shadow-2xl shadow-[#FFD700]/50 group-hover:scale-105 transition-transform duration-300"
                  >
                    <Apple className="mr-2 h-6 w-6" />
                    Download for iPhone
                  </Button>
                </Link>
              </div>

              <div className="relative group w-full sm:w-auto">
                <div className="absolute inset-0 bg-[#FFD700]/30 rounded-xl blur-md opacity-0 group-hover:opacity-50 transition-all duration-300" />
                <Link
                  href="https://play.google.com/store/apps/details?id=app.vlife.fitness&hl=en_US"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="relative w-full border-2 border-[#FFD700] bg-black/50 backdrop-blur-xl text-white hover:bg-[#FFD700]/20 font-semibold text-base sm:text-lg px-8 py-7 group-hover:scale-105 transition-all duration-300"
                  >
                    <Smartphone className="mr-2 h-6 w-6" />
                    Download for Android
                  </Button>
                </Link>
              </div>
            </motion.div>

            <p className="mt-6 text-sm text-gray-400">
              💪 10,000+ members • ⭐ 4.8/5 rating • 🏆 Featured by Apple
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-center sm:text-left">
              <img
                src="https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png"
                alt="V-Life Logo"
                className="mx-auto h-12 w-auto sm:mx-0"
              />
              <p className="mt-2 text-sm text-gray-400">
                © 2024 V-Life. All rights reserved.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <a href="/privacy-policy" className="hover:text-[#FFD700] transition-colors">
                Privacy Policy
              </a>
              <a href="/terms-of-service" className="hover:text-[#FFD700] transition-colors">
                Terms of Service
              </a>
              <a href="mailto:support@vlife.app" className="hover:text-[#FFD700] transition-colors">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}
