"use client"

import { useEffect, useCallback, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mic, Loader2, Volume2, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { useGeminiLive, type LiveVoiceState } from "@/hooks/use-gemini-live"
import type { GeminiVoiceName } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Cleans up AI response text by removing markdown formatting and internal reasoning
 */
function cleanTranscription(text: string): string {
  if (!text) return ""
  
  let cleaned = text
  
  // Remove markdown bold/italic formatting (e.g., **text** or *text*)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1")
  cleaned = cleaned.replace(/\*([^*]+)\*/g, "$1")
  
  // Remove markdown headers (e.g., ## Header)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, "")
  
  // Remove internal reasoning patterns (e.g., "I realize I can't...", "I need to...", "I'm thinking about...")
  // These are meta-commentary that shouldn't be spoken aloud
  const internalPatterns = [
    /I realize I (?:can't|cannot|need to)[^.!?]*[.!?]/gi,
    /I need to (?:ask|check|think|consider)[^.!?]*[.!?]/gi,
    /I'm thinking about[^.!?]*[.!?]/gi,
    /I'll frame my[^.!?]*[.!?]/gi,
    /I've noted[^.!?]*[.!?]/gi,
    /This information[^.!?]*key to[^.!?]*[.!?]/gi,
    /Recognizing their[^.!?]*[.!?]/gi,
  ]
  
  for (const pattern of internalPatterns) {
    cleaned = cleaned.replace(pattern, "")
  }
  
  // Remove section labels that look like internal thinking (e.g., "Clarifying Fitness Status")
  // These are typically short phrases followed by explanatory text
  cleaned = cleaned.replace(/^[A-Z][a-zA-Z\s]+(?=\s+I\s)/gm, "")
  
  // Clean up extra whitespace and newlines
  cleaned = cleaned.replace(/\s+/g, " ").trim()
  
  // Remove leading/trailing punctuation artifacts
  cleaned = cleaned.replace(/^[,.\s]+|[,.\s]+$/g, "").trim()
  
  return cleaned
}

interface VoiceLiveModalProps {
  isOpen: boolean
  onClose: () => void
  voice?: GeminiVoiceName
}

export function VoiceLiveModal({
  isOpen,
  onClose,
  voice = "Kore",
}: VoiceLiveModalProps) {
  const hasTriedConnect = useRef(false)

  const {
    state,
    transcript,
    response,
    error,
    connect,
    disconnect,
    startListening,
  } = useGeminiLive({
    voice,
    systemInstruction: `You are VBot, a friendly AI fitness coach for V-Life.

CRITICAL RULES FOR VOICE RESPONSES:
- Keep responses very brief: 1-2 sentences maximum
- Speak directly to the user - do NOT include any internal thoughts, reasoning, or meta-commentary
- Do NOT use markdown formatting (no asterisks, headers, or bullet points)
- Do NOT narrate what you're doing (e.g., "I'm thinking about..." or "Let me consider...")
- Just give a natural, conversational response as if talking face-to-face
- Be warm, encouraging, and supportive in tone

Example of what NOT to do: "**Acknowledging your question** I realize I need to ask for clarification..."
Example of what TO do: "That's a great question! How's your workout routine been going lately?"`,
  })

  // Connect when modal opens (only once per open)
  useEffect(() => {
    if (isOpen && state === 'disconnected' && !hasTriedConnect.current && !error) {
      hasTriedConnect.current = true
      console.log("[VoiceLiveModal] Attempting to connect...")
      connect().catch((err) => {
        console.error("[VoiceLiveModal] Connection failed:", err)
      })
    }
  }, [isOpen, state, connect, error])

  // Reset connection attempt flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasTriedConnect.current = false
      if (state !== 'disconnected') {
        disconnect()
      }
    }
  }, [isOpen, state, disconnect])

  // Manual retry connection
  const handleRetry = useCallback(() => {
    hasTriedConnect.current = false
    connect()
  }, [connect])

  const handleClose = useCallback(() => {
    disconnect()
    onClose()
  }, [disconnect, onClose])

  // Auto-start listening when connected (VAD handles turn-taking)
  useEffect(() => {
    if (state === 'idle') {
      startListening()
    }
  }, [state, startListening])

  const getStateConfig = (currentState: LiveVoiceState) => {
    switch (currentState) {
      case 'connecting':
        return {
          icon: Loader2,
          label: 'Connecting...',
          color: 'from-blue-500 to-blue-600',
          animate: true,
        }
      case 'listening':
        return {
          icon: Mic,
          label: 'Listening...',
          color: 'from-green-500 to-emerald-600',
          animate: true,  // Pulse while listening
        }
      case 'responding':
        return {
          icon: Volume2,
          label: 'Speaking...',
          color: 'from-accent to-yellow-600',
          animate: false,
        }
      case 'error':
        return {
          icon: WifiOff,
          label: 'Error',
          color: 'from-red-500 to-red-600',
          animate: false,
        }
      case 'idle':
        return {
          icon: Mic,
          label: 'Tap to speak',
          color: 'from-white/20 to-white/10',
          animate: false,
        }
      default:
        return {
          icon: Wifi,
          label: 'Disconnected',
          color: 'from-gray-500 to-gray-600',
          animate: false,
        }
    }
  }

  const config = getStateConfig(state)
  const Icon = config.icon
  
  // Clean the response text for display
  const cleanedResponse = useMemo(() => cleanTranscription(response), [response])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Background effects */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-[25%] -top-[25%] h-[50%] w-[50%] rounded-full bg-accent/10 blur-[120px]" />
            <div className="absolute -bottom-[25%] -right-[25%] h-[50%] w-[50%] rounded-full bg-green-500/10 blur-[120px]" />
          </div>

          {/* Close button - always on top and clickable */}
          <button
            className="absolute right-6 top-6 z-[100] flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:scale-90"
            onClick={handleClose}
            type="button"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Connection status */}
          <div className="absolute left-6 top-6 flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              state === 'disconnected' || state === 'error' ? "bg-red-500" :
              state === 'connecting' ? "bg-yellow-500 animate-pulse" :
              "bg-green-500"
            )} />
            <span className="text-xs text-white/50">
              {state === 'disconnected' ? 'Disconnected' :
               state === 'connecting' ? 'Connecting...' :
               state === 'error' ? 'Error' :
               'Connected'}
            </span>
          </div>

          {/* Main content */}
          <div className="relative z-10 flex h-full w-full max-w-md flex-col items-center justify-center px-6 py-12">
            
            {/* Voice Orb - Visual feedback only in continuous mode */}
            <motion.div
              className={cn(
                "relative mb-12 flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br shadow-2xl transition-all",
                config.color
              )}
              whileTap={{ scale: 0.95 }}
              animate={{
                scale: state === 'listening' ? [1, 1.05, 1] : 1,
              }}
              transition={{
                scale: {
                  duration: 1.5,
                  repeat: state === 'listening' ? Infinity : 0,
                  ease: "easeInOut",
                },
              }}
            >
              {/* Pulsing rings for listening */}
              {state === 'listening' && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-green-400"
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-green-400"
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                  />
                </>
              )}

              {/* Icon */}
              {config.animate ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Icon className="h-16 w-16 text-white drop-shadow-lg" />
                </motion.div>
              ) : (
                <Icon className="h-16 w-16 text-white drop-shadow-lg" />
              )}
            </motion.div>

            {/* State label */}
            <motion.p
              key={state}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-xl font-semibold text-white"
            >
              {config.label}
            </motion.p>

            {/* Live transcript */}
            <div className="w-full flex-1 space-y-4 overflow-y-auto">
              {/* User transcript */}
              <AnimatePresence>
                {transcript && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">
                      You
                    </p>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                      <p className="text-sm leading-relaxed text-white">{transcript}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI response */}
              <AnimatePresence>
                {cleanedResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent/70">
                      VBot
                    </p>
                    <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 backdrop-blur-sm">
                      <p className="text-sm leading-relaxed text-white">{cleanedResponse}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 backdrop-blur-sm">
                      <p className="text-sm leading-relaxed text-red-400 mb-3">{error}</p>
                      <button
                        onClick={handleRetry}
                        className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/30"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Retry Connection
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Instructions */}
            <div className="mt-8 text-center">
              <p className="text-sm text-white/50">
                {state === 'idle' && "Starting microphone..."}
                {state === 'listening' && "Speak naturally - I'll respond when you pause"}
                {state === 'responding' && "I'm responding..."}
                {state === 'connecting' && "Setting up voice connection..."}
                {state === 'error' && "Connection failed - tap retry above"}
                {state === 'disconnected' && error && "Connection failed"}
              </p>
              <p className="mt-2 text-xs text-white/30">
                Real-time voice with automatic turn-taking
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
