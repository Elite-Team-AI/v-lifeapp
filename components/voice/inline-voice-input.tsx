"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, X, Loader2 } from "lucide-react"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import { cn } from "@/lib/utils"

interface InlineVoiceInputProps {
  onTranscript: (text: string) => void
  onActiveChange?: (isActive: boolean) => void
  disabled?: boolean
  className?: string
}

export function InlineVoiceInput({
  onTranscript,
  onActiveChange,
  disabled = false,
  className,
}: InlineVoiceInputProps) {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    resetRecording,
    isSupported,
    error: recorderError,
  } = useAudioRecorder()

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleStartRecording = useCallback(async () => {
    if (disabled || !isSupported) return
    setError(null)
    await startRecording()
    onActiveChange?.(true)
  }, [disabled, isSupported, startRecording, onActiveChange])

  const handleStopRecording = useCallback(async () => {
    if (!isRecording) return

    const audioBlob = await stopRecording()
    
    if (!audioBlob || audioBlob.size === 0) {
      setError("No audio recorded")
      resetRecording()
      return
    }

    setIsTranscribing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")

      const response = await fetch("/api/vbot-stt", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Transcription failed" }))
        throw new Error(errorData.error || "Transcription failed")
      }

      const { transcript } = await response.json()
      
      if (transcript && transcript.trim()) {
        onTranscript(transcript.trim())
      } else {
        setError("No speech detected")
      }
    } catch (err) {
      console.error("[InlineVoiceInput] Transcription error:", err)
      setError(err instanceof Error ? err.message : "Transcription failed")
    } finally {
      setIsTranscribing(false)
      resetRecording()
    }
  }, [isRecording, stopRecording, resetRecording, onTranscript])

  const handleCancel = useCallback(() => {
    resetRecording()
    setIsTranscribing(false)
    setError(null)
    onActiveChange?.(false)
  }, [resetRecording, onActiveChange])

  // Notify parent when active state changes
  useEffect(() => {
    const isActive = isRecording || isTranscribing
    onActiveChange?.(isActive)
  }, [isRecording, isTranscribing, onActiveChange])

  const displayError = error || recorderError

  // Show inline voice UI when recording or transcribing
  if (isRecording || isTranscribing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "relative flex items-center gap-3 rounded-full border px-6 py-3.5",
          isTranscribing && "border-blue-500/50 bg-blue-500/10",
          isRecording && "border-green-500/50 bg-green-500/10",
          displayError && "border-red-500/50 bg-red-500/10",
          className
        )}
      >
        {/* Wave animation for recording */}
        {isRecording && !isTranscribing && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-0.5 rounded-full bg-green-400"
                initial={{ height: 4 }}
                animate={{ height: [4, 20, 4] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        )}

        {/* Loading spinner for transcribing */}
        {isTranscribing && (
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
        )}

        {/* Status text */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {displayError ? (
              <motion.p
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-red-400"
              >
                {displayError}
              </motion.p>
            ) : isTranscribing ? (
              <motion.p
                key="transcribing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-white/80"
              >
                Transcribing...
              </motion.p>
            ) : (
              <motion.p
                key="recording"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-white"
              >
                {formatTime(recordingTime)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Stop/Cancel button */}
        <button
          onClick={isRecording ? handleStopRecording : handleCancel}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white active:scale-90"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    )
  }

  // Auto-start recording when component mounts (becomes active)
  useEffect(() => {
    if (!disabled && isSupported && !isRecording && !isTranscribing) {
      handleStartRecording()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-red-500/50 bg-red-500/10 px-6 py-3.5">
        <p className="text-sm text-red-400">Voice input not supported</p>
      </div>
    )
  }

  // Show loading state while starting
  if (!isRecording && !isTranscribing) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3.5">
        <Loader2 className="h-5 w-5 animate-spin text-white/60" />
        <p className="text-sm text-white/60">Starting microphone...</p>
      </div>
    )
  }
}

