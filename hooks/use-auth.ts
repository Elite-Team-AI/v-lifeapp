"use client"

import { useState, useEffect, useRef } from "react"
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const initialSessionVerified = useRef(false)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session - this is the source of truth
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          // Only sign out for specific errors, not general network issues
          if (error.message.includes("refresh_token") || error.message.includes("invalid")) {
            await supabase.auth.signOut({ scope: "local" })
          }
          setUser(null)
        } else {
          setUser(session?.user ?? null)
        }
      } catch (error) {
        setUser(null)
      } finally {
        initialSessionVerified.current = true
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes AFTER initial session is loaded
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {

      // This prevents the race condition where onAuthStateChange fires before getSession resolves
      if (event === "INITIAL_SESSION") {
        return
      }

      // Handle actual auth state changes
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(session?.user ?? null)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      } else if (event === "USER_UPDATED") {
        setUser(session?.user ?? null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
      }
      setUser(null)
    } catch (error) {
      setUser(null)
    }
  }

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  }
}
