"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'

interface Props {
  children: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary for Workout Session
 *
 * Catches JavaScript errors in the workout component tree and displays
 * a fallback UI, allowing users to recover without losing their workout session.
 */
export class WorkoutErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('Workout Error Boundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // In production, you could send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })

    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  handleExit = () => {
    // Navigate back to fitness page
    window.location.href = '/fitness'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#101938] rounded-lg border border-[#1D295B] p-6 space-y-4">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-white">
                Workout Session Error
              </h2>
              <p className="text-[#8FD1FF]/80 text-sm">
                Something went wrong during your workout session. Your progress has been saved,
                but the session encountered an unexpected error.
              </p>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-[#0A0F1E] rounded-md p-3 space-y-2">
                <p className="text-xs font-mono text-red-400">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs font-mono text-[#8FD1FF]/60">
                    <summary className="cursor-pointer hover:text-[#8FD1FF]">
                      Stack trace
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap">
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
                className="flex-1 bg-[#FADF4A] hover:bg-[#FADF4A]/90 text-[#0A0F1E] font-semibold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={this.handleExit}
                variant="outline"
                className="flex-1 border-[#1D295B] text-[#8FD1FF] hover:bg-[#1D295B]/50"
              >
                <X className="w-4 h-4 mr-2" />
                Exit Workout
              </Button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-center text-[#8FD1FF]/60">
              If this problem persists, try refreshing the page or contact support.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
