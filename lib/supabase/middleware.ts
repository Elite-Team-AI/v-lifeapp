import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { env } from "@/lib/env"

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/auth", "/privacy", "/privacy-policy", "/terms-of-service", "/help-support", "/health-sources"]

// Protected routes within the app (for checking referer)
const PROTECTED_ROUTES = ["/dashboard", "/fitness", "/nutrition", "/community", "/settings", "/vbot", "/workout", "/ai-coach", "/tools", "/grocery-list", "/delete"]

// Supabase auth cookie name pattern
const AUTH_COOKIE_PREFIX = "sb-"

/**
 * Check if request has a valid-looking session cookie
 * This is a fast check without network calls
 */
function hasSessionCookie(request: NextRequest): boolean {
  const cookies = request.cookies.getAll()
  // Look for Supabase auth cookies (sb-*-auth-token pattern)
  return cookies.some(cookie => 
    cookie.name.startsWith(AUTH_COOKIE_PREFIX) && 
    cookie.name.includes("-auth-token") &&
    cookie.value.length > 0
  )
}

/**
 * Check if this is a client-side navigation (soft navigation)
 * These happen when user clicks links within the app
 */
function isClientNavigation(request: NextRequest): boolean {
  // Next.js adds this header for client-side navigations
  const hasNextRouterState = request.headers.has("next-router-state-tree")
  
  // RSC requests are also client-side fetches
  const isRSCRequest = request.headers.get("rsc") === "1"
  
  return hasNextRouterState || isRSCRequest
}

/**
 * Check if this is a prefetch request
 * These should be super fast and not block navigation
 */
function isPrefetchRequest(request: NextRequest): boolean {
  return request.headers.get("x-middleware-prefetch") === "1" ||
         request.headers.get("purpose") === "prefetch" ||
         request.headers.get("sec-purpose") === "prefetch"
}

/**
 * Check if referer is from an authenticated route
 */
function isFromAuthenticatedRoute(request: NextRequest): boolean {
  const referer = request.headers.get("referer")
  if (!referer) return false
  
  try {
    const refererUrl = new URL(referer)
    const origin = request.nextUrl.origin
    
    // Must be same origin
    if (refererUrl.origin !== origin) return false
    
    // Check if coming from a protected route
    return PROTECTED_ROUTES.some(route => refererUrl.pathname.startsWith(route))
  } catch {
    return false
  }
}

export async function updateSession(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname

    // Fast path: Skip auth check entirely for public routes and API routes
    // API routes handle their own authentication and should not redirect
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) || pathname === "/"
    const isApiRoute = pathname.startsWith("/api/")

    if (!isPublicRoute && !isApiRoute) {
      // OPTIMIZATION 1: Skip prefetch requests entirely if session cookie exists
      // This allows instant prefetching for authenticated users
      if (isPrefetchRequest(request) && hasSessionCookie(request)) {
        return NextResponse.next({ request })
      }

      // OPTIMIZATION 2: For client-side navigations from authenticated routes,
      // trust the session cookie without a full validation call
      // The initial page load already validated, and client components check auth separately
      if (isClientNavigation(request) && hasSessionCookie(request) && isFromAuthenticatedRoute(request)) {
        return NextResponse.next({ request })
      }

      // For initial page loads or when we can't trust the session, do full validation
      let supabaseResponse = NextResponse.next({
        request,
      })

      const supabase = createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              supabaseResponse = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
            },
          },
        },
      )

      // Single call - refreshes session if needed and returns user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Redirect unauthenticated users to login
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        return NextResponse.redirect(url)
      }

      return supabaseResponse
    }

    // For auth routes, check if authenticated users should be redirected away
    if (pathname.startsWith("/auth")) {
      // Quick check: if no session cookie, definitely not authenticated
      if (!hasSessionCookie(request)) {
        return NextResponse.next({ request })
      }

      let supabaseResponse = NextResponse.next({
        request,
      })

      const supabase = createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              supabaseResponse = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
            },
          },
        },
      )

      // Use getUser() to refresh session and validate auth
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Redirect authenticated users away from auth pages
      if (user) {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }

      return supabaseResponse
    }

    return NextResponse.next({
      request,
    })
  } catch (error) {
    // If middleware fails, allow the request to proceed to avoid breaking hard reloads
    // Log error for debugging but don't block the request
    console.error("[Middleware Error]", error)
    return NextResponse.next({
      request,
    })
  }
}
