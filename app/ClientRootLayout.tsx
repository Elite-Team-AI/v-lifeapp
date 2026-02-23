"use client"

import type React from "react"
import { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { NavigationLoading } from "@/components/navigation-loading"
import { AppDataProvider } from "@/lib/contexts/app-data-context"
import { PageTransition } from "@/components/ui/page-transition"
import { Toaster } from "@/components/ui/toaster"

export function Providers({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  useEffect(() => {
    // Remove Next.js development error overlay
    const removeErrorOverlay = () => {
      // Remove build watcher
      const buildWatcher = document.getElementById("__next-build-watcher")
      if (buildWatcher) {
        buildWatcher.remove()
      }

      // Remove Next.js portal (error overlay container)
      const portals = document.querySelectorAll("nextjs-portal")
      portals.forEach((portal) => portal.remove())

      // Remove Next.js dialog overlays (but not app's own dialogs with data-slot)
      const dialogs = document.querySelectorAll("[data-nextjs-dialog]:not([data-slot])")
      dialogs.forEach((dialog) => dialog.remove())

      // Remove Next.js toast notifications (but not app's own Radix toasts)
      const toasts = document.querySelectorAll("[data-nextjs-toast]:not([data-radix-toast-viewport])")
      toasts.forEach((toast) => toast.remove())

      // Remove error toast notifications
      const errorToasts = document.querySelectorAll("[data-nextjs-toast-errors]")
      errorToasts.forEach((toast) => toast.remove())

      // Remove any elements with Next.js error overlay classes
      const errorOverlays = document.querySelectorAll(
        '[class*="__next-error-overlay"], [class*="nextjs-error-overlay"], [class*="__next-build-watcher"]'
      )
      errorOverlays.forEach((overlay) => overlay.remove())
    }

    // Run immediately
    removeErrorOverlay()

    // Set up observer to remove overlay when it appears
    const observer = new MutationObserver(() => {
      removeErrorOverlay()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <AppDataProvider>
        <NavigationLoading />
        <PageTransition>
          {children}
        </PageTransition>
        <Toaster />
      </AppDataProvider>
    </ThemeProvider>
  )
}

// Default export for compatibility
export default Providers