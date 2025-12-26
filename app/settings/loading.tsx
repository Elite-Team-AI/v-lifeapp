import { ArrowLeft } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { ButtonGlow } from "@/components/ui/button-glow"
import { SettingsSkeleton } from "@/components/ui/skeleton-loaders"

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-charcoal pb-nav-safe">
      <div className="container max-w-md px-4 py-6">
        <div className="mb-6 flex items-center">
          <ButtonGlow variant="outline-glow" size="icon" className="mr-3 h-8 w-8" disabled>
            <ArrowLeft className="h-4 w-4" />
          </ButtonGlow>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-white/70">Manage your preferences</p>
          </div>
        </div>
        <SettingsSkeleton />
      </div>
      <BottomNav />
    </div>
  )
}

