"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [showMobileMessage, setShowMobileMessage] = useState(false)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if this is a mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

        // Get the full URL with hash and search params
        const hash = window.location.hash
        const search = window.location.search

        // If mobile, try to redirect to app
        if (isMobile && (hash || search)) {
          // Try to open the mobile app with deep link
          const deepLinkUrl = `vlife://auth/callback${hash}${search}`

          console.log('Redirecting to mobile app:', deepLinkUrl)

          // Attempt to open the app
          window.location.href = deepLinkUrl

          // Give the app 2 seconds to open, then show message
          setTimeout(() => {
            console.log('Showing mobile verification message')
            setShowMobileMessage(true)
          }, 2000)

          return
        }

        // Handle web authentication (only for desktop)
        await handleWebAuth()

      } catch (err: any) {
        console.error('Auth callback error:', err)
        setError(err.message || 'Authentication failed')

        // Redirect to login with error after 3 seconds
        setTimeout(() => {
          router.push(`/auth/login?error=${encodeURIComponent(err.message || 'Authentication failed')}`)
        }, 3000)
      }
    }

    const handleWebAuth = async () => {
      const supabase = createClient()

      // Check for error in URL
      const errorParam = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (errorParam) {
        throw new Error(errorDescription || errorParam)
      }

      // Exchange the code for a session (if using PKCE flow)
      const code = searchParams.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          throw error
        }
      }

      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      if (!session) {
        throw new Error('No session found')
      }

      // Check the type of auth action
      const type = searchParams.get('type')

      // Redirect based on auth type
      if (type === 'recovery') {
        // Password recovery - redirect to update password
        router.push('/auth/update-password')
      } else if (type === 'signup') {
        // New signup - check if onboarding is complete
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single()

        if (profile?.onboarding_completed) {
          router.push('/dashboard')
        } else {
          router.push('/onboarding/profile')
        }
      } else {
        // Regular login - redirect to dashboard
        router.push('/dashboard')
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6">
            <h1 className="text-xl font-bold text-red-400 mb-2">Authentication Error</h1>
            <p className="text-red-300 text-sm">{error}</p>
            <p className="text-white/50 text-xs mt-4">Redirecting to login...</p>
          </div>
        </div>
      </div>
    )
  }

  if (showMobileMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-8">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-400 mb-2">Verified</h1>
            <p className="text-white text-base">Go back to your app.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto" />
        <h1 className="text-xl font-bold text-white">Completing authentication...</h1>
        <p className="text-white/60 text-sm">Please wait while we sign you in</p>
      </div>
    </div>
  )
}
