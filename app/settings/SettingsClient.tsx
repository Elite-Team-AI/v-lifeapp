"use client"

import { ArrowLeft, Briefcase, Shield } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { ButtonGlow } from "@/components/ui/button-glow"
import { useRouter } from "next/navigation"
import { Accordion } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect, lazy, Suspense, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { updateProfile } from "@/lib/actions/profile"
import { createClient } from "@/lib/supabase/client"
import { updateNotificationPreferences } from "@/lib/actions/notifications"
import {
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
  showLocalNotification,
} from "@/lib/notifications/push"
import { savePushSubscription } from "@/lib/actions/notifications"
import { exportUserData } from "@/lib/actions/export-data"
import { useAppData } from "@/lib/contexts/app-data-context"
import {
  AccountSection,
  ReferralsSection,
  NotificationsSection,
  StreaksSection,
  UnitsSection,
  PrivacySection,
  AboutSection,
  PlanSection,
  VoiceSection,
} from "./components"
import type { ProfileFormData, ReferralStats, StreakStats, Milestone, NotificationPreferences, VoicePreferences, GeminiVoiceName } from "@/lib/types"

// Lazy load modals
const UpdateProfileModal = lazy(() => import("@/app/update-profile-modal").then(m => ({ default: m.UpdateProfileModal })))
const ChangePasswordModal = lazy(() => import("@/app/change-password-modal").then(m => ({ default: m.ChangePasswordModal })))
const ManageSubscriptionModal = lazy(() => import("@/app/manage-subscription-modal").then(m => ({ default: m.ManageSubscriptionModal })))
const RateAppModal = lazy(() => import("@/components/rate-app-modal").then(m => ({ default: m.RateAppModal })))
const RefreshPlanModal = lazy(() => import("@/app/refresh-plan-modal").then(m => ({ default: m.RefreshPlanModal })))

export default function SettingsClient() {
  const router = useRouter()
  const { toast } = useToast()

  // Get cached app data from global context
  const { appData, isLoading: appDataLoading, refresh } = useAppData()

  // UI states
  const [useMetric, setUseMetric] = useState(false)
  const [affiliateModalOpen, setAffiliateModalOpen] = useState(false)
  const [affiliateForm, setAffiliateForm] = useState({ name: "", email: "", phone: "" })
  const [submitting, setSubmitting] = useState(false)
  const [updateProfileModalOpen, setUpdateProfileModalOpen] = useState(false)
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false)
  const [manageSubscriptionModalOpen, setManageSubscriptionModalOpen] = useState(false)
  const [rateAppModalOpen, setRateAppModalOpen] = useState(false)
  const [isStartFreshModalOpen, setIsStartFreshModalOpen] = useState(false)
  const [isStartingFresh, setIsStartingFresh] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")

  // Derive data from cached app data using useMemo
  const profileData = useMemo(() => {
    if (!appData?.profile) {
      return {
        name: "",
        avatar_url: undefined,
        age: "",
        gender: "",
        heightFeet: "",
        heightInches: "",
        weight: "",
        goalWeight: "",
        calorieGoal: "",
        primaryGoal: "",
        activityLevel: 3,
        gymAccess: "",
        selectedGym: "",
        customEquipment: "",
        allergies: [],
        customRestrictions: [],
        programType: "",
        customProgramType: "",
        availableTimeMinutes: 45,
        trainingDaysPerWeek: 4,
        timezone: "America/New_York",
      }
    }
    
    const profile = appData.profile
    return {
      name: profile.name || "",
      avatar_url: profile.avatar_url || undefined,
      age: profile.age?.toString() || "",
      gender: profile.gender || "",
      heightFeet: profile.height_feet?.toString() || "",
      heightInches: profile.height_inches?.toString() || "",
      weight: profile.weight?.toString() || "",
      goalWeight: profile.goal_weight?.toString() || "",
      calorieGoal: profile.calorie_goal?.toString() || "",
      primaryGoal: profile.primary_goal || "",
      activityLevel: profile.activity_level || 3,
      gymAccess: profile.gym_access || "",
      selectedGym: profile.selected_gym || "",
      customEquipment: profile.custom_equipment || "",
      allergies: profile.allergies || [],
      customRestrictions: profile.custom_restrictions || [],
      // Parse programType from training_style - format is "other:custom" when custom
      programType: profile.training_style?.startsWith("other:") ? "other" : (profile.training_style || ""),
      customProgramType: profile.training_style?.startsWith("other:") ? profile.training_style.substring(6) : "",
      availableTimeMinutes: profile.available_time_minutes || 45,
      trainingDaysPerWeek: profile.training_days_per_week || 4,
      timezone: profile.timezone || "America/New_York",
    }
  }, [appData?.profile])

  const referralStats = useMemo<ReferralStats>(() => {
    return appData?.referralStats || {
      referralCode: "",
      creditsBalance: 0,
      referralsCount: 0,
      creditsEarned: 0,
    }
  }, [appData?.referralStats])

  const streakStats = useMemo<StreakStats>(() => {
    return appData?.streakStats || {
      overallStreak: 0,
      longestStreak: 0,
      totalDaysActive: 0,
      habitStreaks: [],
      weeklyActivity: [],
    }
  }, [appData?.streakStats])

  const milestones = useMemo<Milestone[]>(() => {
    return appData?.milestones || []
  }, [appData?.milestones])

  const notificationPreferences = useMemo<NotificationPreferences>(() => {
    return appData?.notificationPreferences || {
      notificationsEnabled: true,
      workoutReminders: true,
      workoutReminderTime: "08:00",
      mealReminders: true,
      breakfastReminderTime: "08:00",
      lunchReminderTime: "12:00",
      dinnerReminderTime: "18:00",
      progressUpdates: true,
      streakWarnings: true,
      achievementNotifications: true,
      habitReminders: true,
    }
  }, [appData?.notificationPreferences])

  const voicePreferences = useMemo<VoicePreferences>(() => {
    const profileVoicePrefs = appData?.profile?.voice_preferences as VoicePreferences | undefined
    return profileVoicePrefs || {
      selectedVoice: "Kore",
      voiceEnabled: true,
      autoPlayResponses: false,
    }
  }, [appData?.profile?.voice_preferences])

  // Set notification permission on client only to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  // Handlers
  const handleProfileUpdate = async (newProfile: ProfileFormData) => {
    // Profile was updated, refresh app data to reflect changes
    await refresh()
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    })
  }

  const handleBack = () => {
    if (typeof window === "undefined" || window.history.length <= 1) {
      router.push("/dashboard")
      return
    }

    router.back()
  }

  const handleTimezoneChange = async (newTimezone: string) => {
    const updatedProfile = { ...profileData, timezone: newTimezone }

    const result = await updateProfile(updatedProfile)
    if (result.error) {
      toast({
        title: "Error",
        description: "Failed to update timezone",
        variant: "destructive",
      })
    } else {
      // Refresh app data to get updated profile
      await refresh()
      toast({
        title: "Timezone Updated",
        description: "Your timezone has been saved. Habits will reset at midnight in your local time.",
      })
    }
  }

  const handleEnableNotifications = async () => {
    const permission = await requestNotificationPermission()
    setNotificationPermission(permission)

    if (permission === "granted") {
      const registration = await registerServiceWorker()
      if (registration) {
        const subscription = await subscribeToPushNotifications(registration)
        if (subscription) {
          await savePushSubscription(subscription)
          toast({
            title: "Notifications Enabled",
            description: "You'll now receive push notifications",
          })
          showLocalNotification("V-Life Notifications Enabled", {
            body: "You're all set! We'll keep you motivated.",
          })
        }
      }
      await updateNotificationPreferences({ notificationsEnabled: true })
      await refresh()
    } else {
      toast({
        title: "Permission Denied",
        description: "Please enable notifications in your browser settings",
        variant: "destructive",
      })
    }
  }

  const handleNotificationToggle = async (key: string, value: boolean) => {
    await updateNotificationPreferences({ [key]: value } as Partial<NotificationPreferences>)
    await refresh()
    toast({
      title: "Preferences Updated",
      description: "Your notification settings have been saved",
    })
  }

  const handleTimeChange = async (key: string, value: string) => {
    await updateNotificationPreferences({ [key]: value } as Partial<NotificationPreferences>)
    await refresh()
  }

  const handleVoiceToggle = async (key: keyof VoicePreferences, value: boolean) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const newPrefs = { ...voicePreferences, [key]: value }
    await supabase
      .from("profiles")
      .update({ voice_preferences: newPrefs })
      .eq("id", user.id)
    
    await refresh()
    toast({
      title: "Voice Settings Updated",
      description: "Your voice preferences have been saved",
    })
  }

  const handleVoiceChange = async (voice: GeminiVoiceName) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const newPrefs = { ...voicePreferences, selectedVoice: voice }
    await supabase
      .from("profiles")
      .update({ voice_preferences: newPrefs })
      .eq("id", user.id)
    
    await refresh()
    toast({
      title: "Voice Changed",
      description: `VBot will now use the ${voice} voice`,
    })
  }

  const handlePreviewVoice = async (voice: GeminiVoiceName) => {
    try {
      const response = await fetch("/api/vbot-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Hi! I'm VBot, your AI fitness coach. Ready to help you achieve your goals!",
          voice,
        }),
      })

      if (!response.ok) throw new Error("Preview failed")

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      await audio.play()
      
      // Clean up after playback
      audio.onended = () => URL.revokeObjectURL(audioUrl)
    } catch (err) {
      console.error("Voice preview error:", err)
      toast({
        title: "Preview Failed",
        description: "Could not preview the voice. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExportData = async () => {
    toast({
      title: "Preparing Export",
      description: "Gathering your data...",
    })

    const result = await exportUserData()
    if (result.error) {
      toast({
        title: "Export Failed",
        description: result.error,
        variant: "destructive",
      })
      return
    }

    if (result.data) {
      const dataStr = JSON.stringify(result.data, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `vlife-data-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Complete",
        description: "Your data has been downloaded as a JSON file",
      })
    }
  }

  const handleStartFresh = async () => {
    if (isStartingFresh) return

    setIsStartingFresh(true)
    toast({
      title: "Starting fresh",
      description: "Regenerating your plan with new insights...",
    })

    try {
      const { refreshTrainingPlan } = await import("@/lib/actions/workouts")
      const refreshResult = await refreshTrainingPlan()
      if (!refreshResult.success) {
        throw new Error(refreshResult.error || "Unable to start fresh right now")
      }

      toast({
        title: "Plan updated",
        description: "Your plan has been refreshed and will use your latest data.",
      })
    } catch {
      toast({
        title: "Start fresh failed",
        description: "Please try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setIsStartingFresh(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      })
      router.push("/")
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const submitAffiliateApplication = async () => {
    if (!affiliateForm.name || !affiliateForm.email || !affiliateForm.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/affiliate-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(affiliateForm),
      })

      if (response.ok) {
        toast({
          title: "Application Submitted!",
          description: "We'll review your application and get back to you soon.",
        })
        setAffiliateModalOpen(false)
        setAffiliateForm({ name: "", email: "", phone: "" })
      } else {
        throw new Error("Failed to submit")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const shareReferralCode = async (platform: string) => {
    const message = `Join me on V-Life! Use my code ${referralStats.referralCode} to get started.`
    const url = `https://vlife.app?ref=${referralStats.referralCode}`

    if (platform === "native" && navigator.share) {
      try {
        await navigator.share({ title: "Join V-Life", text: message, url })
      } catch {
        // User cancelled
      }
    }
  }

  // Show loading state while app data is being fetched
  if (appDataLoading && !appData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-charcoal pb-nav-safe flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="text-white/70">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-charcoal pb-nav-safe">
      <div className="container max-w-md px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center">
          <ButtonGlow variant="outline-glow" size="icon" onClick={handleBack} className="mr-3 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </ButtonGlow>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-white/70">Manage your preferences</p>
          </div>
        </div>

        {/* Admin Panel Link - only shows for admins */}
        {appData?.profile?.is_admin && (
          <ButtonGlow
            variant="accent-glow"
            className="w-full mb-6"
            onClick={() => router.push("/admin")}
          >
            <Shield className="h-4 w-4 mr-2" />
            Admin Panel
          </ButtonGlow>
        )}

        <Accordion type="multiple" className="space-y-4">
          <AccountSection
            loading={false}
            profileData={profileData}
            onEditProfile={() => setUpdateProfileModalOpen(true)}
            onChangePassword={() => setChangePasswordModalOpen(true)}
            onManageSubscription={() => setManageSubscriptionModalOpen(true)}
            onSignOut={handleSignOut}
          />

          <ReferralsSection
            loading={false}
            stats={referralStats}
            onOpenAffiliateModal={() => setAffiliateModalOpen(true)}
          />

          <NotificationsSection
            loading={false}
            permission={notificationPermission}
            preferences={notificationPreferences}
            onEnableNotifications={handleEnableNotifications}
            onToggle={handleNotificationToggle}
            onTimeChange={handleTimeChange}
            onTestNotification={() => {
              toast({
                title: "Test notification sent",
                description: "Check for a notification popup",
              })
              showLocalNotification("Test Notification", {
                body: "This is a test - your reminders are working!",
              })
            }}
          />

          <UnitsSection
            useMetric={useMetric}
            timezone={profileData.timezone || "America/New_York"}
            onMetricChange={setUseMetric}
            onTimezoneChange={handleTimezoneChange}
          />

          <VoiceSection
            loading={false}
            preferences={voicePreferences}
            onToggle={handleVoiceToggle}
            onVoiceChange={handleVoiceChange}
            onPreviewVoice={handlePreviewVoice}
          />

          <PlanSection
            isStartingFresh={isStartingFresh}
            onStartFresh={() => setIsStartFreshModalOpen(true)}
          />

          <PrivacySection
            onPrivacyPolicy={() => router.push("/privacy-policy")}
            onTermsOfService={() => router.push("/terms-of-service")}
            onExportData={handleExportData}
            onDeleteAccount={() => {
              toast({
                title: "Delete Account",
                description: "Please contact support to delete your account.",
              })
            }}
          />

          <StreaksSection
            loading={false}
            stats={streakStats}
            milestones={milestones}
          />

          <AboutSection
            onHelpSupport={() => router.push("/help-support")}
            onRateApp={() => setRateAppModalOpen(true)}
            onShare={() => shareReferralCode("native")}
          />
        </Accordion>
      </div>

      {/* Affiliate Application Modal */}
      <Dialog open={affiliateModalOpen} onOpenChange={setAffiliateModalOpen}>
        <DialogContent className="border-white/10 bg-gradient-to-b from-black to-charcoal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Briefcase className="h-5 w-5 text-accent" />
              Become an Affiliate
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Fill out the form below and we&apos;ll review your application within 2-3 business days.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="affiliate-name" className="text-white">Full Name</Label>
              <Input
                id="affiliate-name"
                placeholder="John Doe"
                value={affiliateForm.name}
                onChange={(e) => setAffiliateForm({ ...affiliateForm, name: e.target.value })}
                className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <Label htmlFor="affiliate-email" className="text-white">Email Address</Label>
              <Input
                id="affiliate-email"
                type="email"
                placeholder="john@example.com"
                value={affiliateForm.email}
                onChange={(e) => setAffiliateForm({ ...affiliateForm, email: e.target.value })}
                className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <Label htmlFor="affiliate-phone" className="text-white">Phone Number</Label>
              <Input
                id="affiliate-phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={affiliateForm.phone}
                onChange={(e) => setAffiliateForm({ ...affiliateForm, phone: e.target.value })}
                className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
            </div>
            <div className="rounded-lg bg-accent/10 p-3 text-sm text-white/70">
              <p className="mb-2 font-bold text-white">Affiliate Benefits:</p>
              <ul className="space-y-1 text-xs">
                <li>• Higher commission rates (up to 30%)</li>
                <li>• Exclusive marketing materials</li>
                <li>• Dedicated affiliate dashboard</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <ButtonGlow
              variant="outline-glow"
              className="flex-1"
              onClick={() => setAffiliateModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </ButtonGlow>
            <ButtonGlow
              variant="glow"
              className="flex-1"
              onClick={submitAffiliateApplication}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </ButtonGlow>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lazy-loaded modals */}
      {updateProfileModalOpen && (
        <Suspense fallback={null}>
          <UpdateProfileModal
            isOpen={updateProfileModalOpen}
            onClose={() => setUpdateProfileModalOpen(false)}
            currentProfile={profileData}
            onUpdate={handleProfileUpdate}
          />
        </Suspense>
      )}

      {changePasswordModalOpen && (
        <Suspense fallback={null}>
          <ChangePasswordModal
            isOpen={changePasswordModalOpen}
            onClose={() => setChangePasswordModalOpen(false)}
          />
        </Suspense>
      )}

      {manageSubscriptionModalOpen && (
        <Suspense fallback={null}>
          <ManageSubscriptionModal
            isOpen={manageSubscriptionModalOpen}
            onClose={() => setManageSubscriptionModalOpen(false)}
          />
        </Suspense>
      )}

      {rateAppModalOpen && (
        <Suspense fallback={null}>
          <RateAppModal
            isOpen={rateAppModalOpen}
            onClose={() => setRateAppModalOpen(false)}
          />
        </Suspense>
      )}

      {isStartFreshModalOpen && (
        <Suspense fallback={null}>
          <RefreshPlanModal
            isOpen={isStartFreshModalOpen}
            onClose={() => setIsStartFreshModalOpen(false)}
            onConfirm={handleStartFresh}
            userName={profileData.name?.split(" ")[0] || "there"}
          />
        </Suspense>
      )}

      <BottomNav />
    </div>
  )
}

