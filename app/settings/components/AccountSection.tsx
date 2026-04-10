"use client"

import { LogOut, User } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { ProfileFormData } from "@/lib/types"

interface AccountSectionProps {
  loading: boolean
  profileData: ProfileFormData
  onEditProfile: () => void | Promise<void>
  onChangePassword: () => void
  onManageSubscription: () => void
  onSignOut: () => void
}

export function AccountSection({
  loading,
  profileData,
  onEditProfile,
  onChangePassword,
  onManageSubscription,
  onSignOut,
}: AccountSectionProps) {
  return (
    <AccordionItem value="account" className="border-white/10 rounded-lg bg-black/30 backdrop-blur-sm">
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex items-center gap-2 text-lg font-bold text-white">
          <User className="h-5 w-5 text-accent" />
          Account
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-3 pt-2">
          {loading ? (
            <div className="text-sm text-white/60 mb-2">Loading profile...</div>
          ) : profileData.name ? (
            <div className="text-sm text-white/80 mb-2">
              Logged in as: <span className="font-bold text-accent">{profileData.name}</span>
            </div>
          ) : (
            <div className="text-sm text-yellow-500 mb-2">⚠️ Please complete your profile</div>
          )}
          <ButtonGlow
            type="button"
            variant="outline-glow"
            className="w-full justify-start"
            onClick={(e) => {
              e.stopPropagation()
              onEditProfile()
            }}
          >
            Edit Profile
          </ButtonGlow>
          <ButtonGlow
            type="button"
            variant="outline-glow"
            className="w-full justify-start"
            onClick={(e) => {
              e.stopPropagation()
              onChangePassword()
            }}
          >
            Change Password
          </ButtonGlow>
          <ButtonGlow
            type="button"
            variant="outline-glow"
            className="w-full justify-start"
            onClick={(e) => {
              e.stopPropagation()
              onManageSubscription()
            }}
          >
            Manage Subscription
          </ButtonGlow>
          <ButtonGlow
            type="button"
            variant="outline-glow"
            className="w-full justify-start text-red-400 hover:text-red-300"
            onClick={(e) => {
              e.stopPropagation()
              onSignOut()
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </ButtonGlow>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

