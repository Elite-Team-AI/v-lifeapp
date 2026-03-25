"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary for Fitness Page
 *
 * Catches JavaScript errors in the fitness component tree and displays
 * a fallback UI, allowing users to recover without losing their session.
 *
 * Version: 1.1.0 - Enhanced error handling with better recovery options
 */
export class FitnessErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('[FitnessErrorBoundary] Caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // In production, this could be sent to an error reporting service
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      // Example: Send to error tracking service
      // Sentry.captureException(error, { extra: errorInfo })
    }
  }

  handleReset = () => {
    // Clear error state and try to render again
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })

    // Force a page refresh to ensure clean state
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  handleGoHome = () => {
    // Navigate to dashboard
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard'
    }
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development'

      return (
        <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-neutral-900/90 backdrop-blur-xl rounded-2xl border border-neutral-800 p-6 space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-white">
                Fitness Page Error
              </h2>
              <p className="text-neutral-400 text-sm">
                We encountered an unexpected error while loading the fitness page.
                Your data is safe and you can try again.
              </p>
            </div>

            {/* Error Details (Development Only) */}
            {isDevelopment && this.state.error && (
              <div className="bg-black/50 rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                <p className="text-xs font-mono text-red-400">
                  {this.state.error.toString()}
                </p>
                {this.state.error.message && (
                  <p className="text-xs font-mono text-red-300">
                    Message: {this.state.error.message}
                  </p>
                )}
                {this.state.errorInfo && (
                  <details className="text-xs font-mono text-neutral-500">
                    <summary className="cursor-pointer hover:text-neutral-400 select-none">
                      Component Stack
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={this.handleReset}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800/50"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-center text-neutral-500">
              If this problem persists, please try refreshing your browser or contact support.
            </p>
          </div>
        </div>
      )
    }

    // No error, render children normally
    return this.props.children
  }
}