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
        q: "What's the difference between free and premium?",
        a: "Free users get basic workout and meal plans. Premium unlocks unlimited AI coaching, advanced analytics, custom meal plans, progress tracking, and priority support. You can also earn free months through referrals!",
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
        a: "We offer a 7-day money-back guarantee. Contact support@vlife.app within 7 days of purchase for a full refund.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards, debit cards, Apple Pay, and Google Pay through our secure payment processor.",
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
    <div className="min-h-screen bg-gradient-to-b from-black to-charcoal pb-nav-safe">
      <div className="container max-w-md px-4 py-6">
        {/* Header */}
        <motion.div
          className="mb-6 flex items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ButtonGlow variant="outline-glow" size="icon" onClick={() => router.back()} className="mr-3 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </ButtonGlow>
          <div>
            <h1 className="text-2xl font-bold text-white">Help & Support</h1>
            <p className="text-white/70">We're here to help</p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40"
            />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="mb-6 grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border-white/10 bg-gradient-to-br from-accent/10 to-black/50 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Mail className="mx-auto mb-2 h-8 w-8 text-accent" />
              <h3 className="mb-1 text-sm font-bold text-white">Email Us</h3>
              <p className="mb-3 text-xs text-white/60">Get help via email</p>
              <ButtonGlow
                variant="outline-glow"
                size="sm"
                className="w-full"
                onClick={() => (window.location.href = "mailto:support@vlife.app")}
              >
                Contact Support
              </ButtonGlow>
            </CardContent>
          </Card>
        </motion.div>

        {/* Video Tutorials */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="border-white/10 bg-black/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Video className="h-5 w-5 text-accent" />
                <h3 className="font-bold text-white">Video Tutorials</h3>
              </div>
              <div className="space-y-2">
                <ButtonGlow variant="outline-glow" className="w-full justify-start text-sm">
                  Getting Started with V-Life
                </ButtonGlow>
                <ButtonGlow variant="outline-glow" className="w-full justify-start text-sm">
                  How to Log Workouts
                </ButtonGlow>
                <ButtonGlow variant="outline-glow" className="w-full justify-start text-sm">
                  Meal Planning & Tracking
                </ButtonGlow>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h2 className="mb-4 text-xl font-bold text-white">Frequently Asked Questions</h2>

          {filteredFaqs.length === 0 ? (
            <Card className="border-white/10 bg-black/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Search className="mx-auto mb-3 h-12 w-12 text-white/30" />
                <p className="text-white/60">No results found for "{searchQuery}"</p>
                <p className="mt-2 text-sm text-white/40">Try different keywords or browse all categories</p>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {filteredFaqs.map((category, idx) => {
                const Icon = category.icon
                return (
                  <AccordionItem
                    key={idx}
                    value={`category-${idx}`}
                    className="rounded-lg border-white/10 bg-black/30 backdrop-blur-sm"
                  >
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-accent" />
                        <span className="font-bold text-white">{category.category}</span>
                        <Badge variant="secondary" className="ml-2 bg-white/10 text-white">
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
                            className="rounded border-white/10 bg-white/5"
                          >
                            <AccordionTrigger className="px-3 py-2 text-left text-sm hover:no-underline">
                              <span className="text-white">{faq.q}</span>
                            </AccordionTrigger>
                            <AccordionContent className="px-3 pb-3 text-sm text-white/70">{faq.a}</AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
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
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-black/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <HelpCircle className="mx-auto mb-3 h-12 w-12 text-accent" />
              <h3 className="mb-2 text-lg font-bold text-white">Still Need Help?</h3>
              <p className="mb-4 text-sm text-white/70">
                Our support team is here for you. We typically respond within 24 hours.
              </p>
              <ButtonGlow
                variant="glow"
                className="w-full"
                onClick={() => (window.location.href = "mailto:support@vlife.app?subject=Support Request")}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email Support
              </ButtonGlow>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  )
}
