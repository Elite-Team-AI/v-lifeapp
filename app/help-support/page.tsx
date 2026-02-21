"use client"

import { motion } from "framer-motion"
import { ArrowLeft, HelpCircle, Mail, MessageCircle, Book, Video, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { BottomNav } from "@/components/bottom-nav"
import { ButtonGlow } from "@/components/ui/button-glow"
import { useRouter } from "next/navigation"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

const faqs = [
  {
    category: "Getting Started",
    icon: Book,
    questions: [
      {
        q: "How do I set up my profile?",
        a: "Go to Settings > Account > Edit Profile. Fill in your personal information, fitness goals, dietary preferences, and equipment access. This helps V-Bot create personalized plans for you.",
      },
      {
        q: "What's the difference between Pro and Elite plans?",
        a: "Pro ($29.99/month) includes unlimited AI coaching, advanced meal plans, workout tracking, and progress analytics. Elite ($49.99/month) adds personalized training programs, priority support, and exclusive community features. Both plans include all core features plus you can earn free months through referrals!",
      },
      {
        q: "How do I earn free months?",
        a: "Share your referral code with friends! You earn 3 credits per referral. Collect 12 credits to get 1 free month of premium. Find your code in Settings > Referrals & Rewards.",
      },
    ],
  },
  {
    category: "Workouts",
    icon: Video,
    questions: [
      {
        q: "How do I log my workout weight and reps?",
        a: "During a workout, you'll see input fields for weight and reps before completing each set. Enter your actual performance and tap 'Complete Set' to save it.",
      },
      {
        q: "Can I customize my workout plan?",
        a: "Yes! Chat with V-Bot and ask to modify your workout. You can change exercises, adjust sets/reps, or request a completely new plan based on your goals and equipment.",
      },
      {
        q: "What if I don't have gym equipment?",
        a: "No problem! During profile setup, select 'Home Workout' or 'Bodyweight Only'. V-Bot will create plans using minimal or no equipment.",
      },
    ],
  },
  {
    category: "Nutrition",
    icon: MessageCircle,
    questions: [
      {
        q: "How do I log meals?",
        a: "Go to Nutrition tab, tap 'Log Meal', and either search for foods, scan barcodes, or describe your meal to V-Bot. The AI will calculate macros automatically.",
      },
      {
        q: "Can I set custom macro targets?",
        a: "Yes! Go to Settings > Nutrition Goals to adjust your macro targets based on your specific goals.",
      },
      {
        q: "How accurate is the calorie tracking?",
        a: "We use comprehensive nutrition databases to estimate calories. For best accuracy, weigh your food and use specific portion sizes when logging.",
      },
    ],
  },
  {
    category: "Habits & Streaks",
    icon: HelpCircle,
    questions: [
      {
        q: "When do habits reset?",
        a: "Habits reset at midnight in your timezone. Set your timezone in Settings > Units & Measurements to ensure accurate tracking.",
      },
      {
        q: "What happens if I miss a day?",
        a: "Your streak will reset to 0, but don't worry! Your total days active and longest streak are saved. Just start a new streak tomorrow.",
      },
      {
        q: "How do I add custom habits?",
        a: "Tap the '+' button on the Dashboard, or chat with V-Bot and say 'Add a new habit for [activity]'. You can customize frequency, reminders, and goals.",
      },
    ],
  },
  {
    category: "Subscriptions & Billing",
    icon: Mail,
    questions: [
      {
        q: "How do I cancel my subscription?",
        a: "Go to Settings > Account > Manage Subscription. You can cancel anytime. Your premium access continues until the end of your billing period.",
      },
      {
        q: "Can I get a refund?",
        a: "Refunds are handled according to Apple App Store and Google Play Store policies. For iOS, you can request a refund through the App Store. For Android, refunds are available within the Google Play refund window. Contact support@vlife.app if you need assistance with refund requests.",
      },
      {
        q: "What payment methods do you accept?",
        a: "Subscriptions are processed through the Apple App Store (iOS) or Google Play Store (Android). You can use any payment method associated with your Apple ID or Google account, including credit cards, debit cards, Apple Pay, Google Pay, and carrier billing where available.",
      },
      {
        q: "How much do subscriptions cost?",
        a: "We offer two subscription tiers: Pro at $29.99/month and Elite at $49.99/month. Both are billed monthly and you can cancel anytime. Your subscription is managed through your device's app store.",
      },
    ],
  },
  {
    category: "Technical Issues",
    icon: Search,
    questions: [
      {
        q: "The app won't load my data",
        a: "Try refreshing the page or logging out and back in. If the issue persists, check your internet connection and clear your browser cache.",
      },
      {
        q: "Notifications aren't working",
        a: "Go to Settings > Notifications and ensure they're enabled. Check your browser settings to allow notifications from vlife.app. You may need to enable them in your device settings too.",
      },
      {
        q: "How do I export my data?",
        a: "Go to Settings > Privacy & Data > Export My Data. You'll receive a JSON file with all your workout logs, meals, habits, and progress data.",
      },
    ],
  },
]

export default function HelpSupport() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFaqs = faqs
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => category.questions.length > 0)

  return (
    <div className="min-h-screen bg-black pb-nav-safe overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px] animate-blob" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

      <div className="relative z-10 container max-w-md px-4 py-6">
        {/* Header */}
        <motion.div
          className="mb-6 flex items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ButtonGlow variant="outline-glow" size="icon" onClick={() => router.back()} className="mr-3 h-10 w-10 backdrop-blur-xl">
              <ArrowLeft className="h-4 w-4" />
            </ButtonGlow>
          </motion.div>
          <div>
            <motion.h1
              className="text-2xl font-bold tracking-tight font-heading bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              Help & Support
            </motion.h1>
            <motion.p
              className="text-white/70 leading-relaxed"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              We're here to help
            </motion.p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.01, y: -2 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="backdrop-blur-xl bg-white/5 border-white/10 pl-10 text-white placeholder:text-white/40 focus:border-accent/50 focus:bg-white/10 transition-all"
            />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <Card className="border-accent/30 backdrop-blur-xl bg-gradient-to-br from-accent/10 to-transparent shadow-[0_0_20px_rgba(255,215,0,0.15)]">
            <CardContent className="p-5 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              >
                <Mail className="mx-auto mb-3 h-10 w-10 text-accent drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
              </motion.div>
              <motion.h3
                className="mb-1 text-base font-bold tracking-tight font-heading text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Email Us
              </motion.h3>
              <motion.p
                className="mb-4 text-sm text-white/60 leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                Get help via email
              </motion.p>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                  <ButtonGlow
                    variant="accent-glow"
                    size="sm"
                    className="w-full relative"
                    onClick={() => (window.location.href = "mailto:support@vlife.app")}
                  >
                    Contact Support
                  </ButtonGlow>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Video Tutorials */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <Card className="border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_20px_rgba(255,215,0,0.1)]">
            <CardContent className="p-5">
              <motion.div
                className="mb-4 flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
              >
                <Video className="h-5 w-5 text-accent drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]" />
                <h3 className="font-bold tracking-tight font-heading text-white">Video Tutorials</h3>
              </motion.div>
              <div className="space-y-2">
                <motion.div
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 }}
                >
                  <ButtonGlow variant="outline-glow" className="w-full justify-start text-sm backdrop-blur-xl">
                    Getting Started with V-Life
                  </ButtonGlow>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.15 }}
                >
                  <ButtonGlow variant="outline-glow" className="w-full justify-start text-sm backdrop-blur-xl">
                    How to Log Workouts
                  </ButtonGlow>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <ButtonGlow variant="outline-glow" className="w-full justify-start text-sm backdrop-blur-xl">
                    Meal Planning & Tracking
                  </ButtonGlow>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.25 }}
        >
          <motion.h2
            className="mb-4 text-xl font-bold tracking-tight font-heading bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3 }}
          >
            Frequently Asked Questions
          </motion.h2>

          {filteredFaqs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.35 }}
            >
              <Card className="border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_20px_rgba(255,215,0,0.05)]">
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.4, type: "spring", stiffness: 200 }}
                  >
                    <Search className="mx-auto mb-3 h-12 w-12 text-white/30" />
                  </motion.div>
                  <p className="text-white/60 leading-relaxed">No results found for "{searchQuery}"</p>
                  <p className="mt-2 text-sm text-white/40 leading-relaxed">Try different keywords or browse all categories</p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {filteredFaqs.map((category, idx) => {
                const Icon = category.icon
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.35 + idx * 0.05 }}
                  >
                    <AccordionItem
                      value={`category-${idx}`}
                      className="rounded-lg border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_15px_rgba(255,215,0,0.08)] transition-all hover:border-accent/30 hover:shadow-[0_0_20px_rgba(255,215,0,0.15)]"
                    >
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-accent drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]" />
                          <span className="font-bold tracking-tight font-heading text-white">{category.category}</span>
                          <Badge variant="secondary" className="ml-2 backdrop-blur-xl bg-accent/20 border border-accent/30 text-accent">
                            {category.questions.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <Accordion type="multiple" className="space-y-2">
                          {category.questions.map((faq, qIdx) => (
                            <AccordionItem
                              key={qIdx}
                              value={`faq-${idx}-${qIdx}`}
                              className="rounded border-white/10 backdrop-blur-xl bg-white/5 transition-all hover:border-accent/20 hover:bg-white/10"
                            >
                              <AccordionTrigger className="px-3 py-2 text-left text-sm hover:no-underline">
                                <span className="text-white tracking-tight font-heading">{faq.q}</span>
                              </AccordionTrigger>
                              <AccordionContent className="px-3 pb-3 text-sm text-white/70 leading-relaxed">{faq.a}</AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                )
              })}
            </Accordion>
          )}
        </motion.div>

        {/* Still Need Help */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.5 + filteredFaqs.length * 0.05 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <Card className="border-accent/30 backdrop-blur-xl bg-gradient-to-br from-accent/10 to-transparent shadow-[0_0_25px_rgba(255,215,0,0.2)]">
            <CardContent className="p-6 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 1.55 + filteredFaqs.length * 0.05, type: "spring", stiffness: 200, damping: 15 }}
              >
                <HelpCircle className="mx-auto mb-3 h-12 w-12 text-accent drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]" />
              </motion.div>
              <motion.h3
                className="mb-2 text-lg font-bold tracking-tight font-heading text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 + filteredFaqs.length * 0.05 }}
              >
                Still Need Help?
              </motion.h3>
              <motion.p
                className="mb-5 text-sm text-white/70 leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.65 + filteredFaqs.length * 0.05 }}
              >
                Our support team is here for you. We typically respond within 24 hours.
              </motion.p>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7 + filteredFaqs.length * 0.05 }}
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                  <ButtonGlow
                    variant="accent-glow"
                    className="w-full relative"
                    onClick={() => (window.location.href = "mailto:support@vlife.app?subject=Support Request")}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Email Support
                  </ButtonGlow>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  )
}
