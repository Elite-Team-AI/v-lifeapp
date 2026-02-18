"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Camera, Send, Loader2, X, Sparkles, ChevronDown } from "lucide-react"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { hasAIConsent } from "@/components/ai-consent-dialog"
import type { ParsedFood, FoodParseResult } from "@/lib/actions/food-logging"

interface FoodLoggerInputProps {
  selectedDate: string // ISO date string
  onParseComplete: (result: FoodParseResult, originalInput: string, inputType: "text" | "voice" | "image") => void
  onParseStart?: () => void
  disabled?: boolean
  className?: string
}

const MEAL_TYPES = ["Breakfast", "Snack (AM)", "Lunch", "Snack (PM)", "Dinner", "Late Snack"] as const
type MealType = typeof MEAL_TYPES[number]

export function FoodLoggerInput({ 
  selectedDate, 
  onParseComplete, 
  onParseStart,
  disabled, 
  className 
}: FoodLoggerInputProps) {
  const [input, setInput] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [mealTypeOverride, setMealTypeOverride] = useState<MealType | null>(null)
  const [showMealTypeDropdown, setShowMealTypeDropdown] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    resetRecording,
    isSupported: isVoiceSupported,
    error: recorderError,
  } = useAudioRecorder()

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSubmit = useCallback(async (
    inputText: string, 
    inputType: "text" | "voice" | "image" = "text",
    imageData?: string
  ) => {
    if (!inputText.trim() && !imageData) return

    if (!hasAIConsent()) {
      toast({
        title: "AI consent required",
        description: "Enable AI data sharing in Settings > Privacy & Data to use AI food parsing.",
        variant: "destructive",
      })
      return
    }

    setIsParsing(true)
    onParseStart?.()

    try {
      console.log("[FoodLogger] Calling parseFood with:", {
        inputText: inputText.substring(0, 50),
        inputType,
        hasImageData: !!imageData,
        mealTypeOverride,
        selectedDate
      })
      
      const { parseFood } = await import("@/lib/actions/food-logging")
      console.log("[FoodLogger] parseFood imported, calling...")
      
      const result = await parseFood(
        inputText,
        inputType,
        imageData,
        mealTypeOverride || undefined,
        selectedDate
      )

      console.log("[FoodLogger] Parse result received:", JSON.stringify({
        success: result.success,
        foodsCount: result.foods?.length || 0,
        error: result.error,
        hasFoods: !!result.foods && result.foods.length > 0,
      }, null, 2))

      if (result.success && result.foods && result.foods.length > 0) {
        console.log("[FoodLogger] Calling onParseComplete with", result.foods.length, "foods")
        onParseComplete(result, inputText, inputType)
        setInput("")
        setMealTypeOverride(null)
      } else {
        const errorMessage = result.error || "Unknown error"
        console.error("[FoodLogger] Parse failed or no foods. Error:", errorMessage)
        console.error("[FoodLogger] Full result:", JSON.stringify(result, null, 2))
        
        // Provide more helpful error messages
        let toastDescription = errorMessage
        if (errorMessage.includes("OPENAI_API_KEY")) {
          toastDescription = "AI service not configured. Please set OPENAI_API_KEY in Supabase secrets."
        } else if (errorMessage.includes("not authenticated") || errorMessage.includes("auth")) {
          toastDescription = "Please log in to use food logging."
        } else if (errorMessage === "Unknown error" || !errorMessage) {
          toastDescription = "Try describing your food differently"
        }
        
        toast({
          title: "Couldn't parse food",
          description: toastDescription,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[FoodLogger] Parse error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze food. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsParsing(false)
    }
  }, [mealTypeOverride, selectedDate, onParseComplete, onParseStart, toast])

  const handleTextSubmit = useCallback(() => {
    handleSubmit(input, "text")
  }, [input, handleSubmit])

  const handleVoiceToggle = useCallback(async () => {
    if (isRecording) {
      const audioBlob = await stopRecording()
      
      if (audioBlob && audioBlob.size > 0) {
        setIsTranscribing(true)
        
        try {
          console.log("[FoodLogger] Sending audio for transcription:", {
            type: audioBlob.type,
            size: audioBlob.size,
          })
          
          const formData = new FormData()
          formData.append("audio", audioBlob, "recording.webm")

          const response = await fetch("/api/vbot-stt", {
            method: "POST",
            body: formData,
          })

          const responseData = await response.json()
          
          if (!response.ok) {
            console.error("[FoodLogger] STT API error:", response.status, responseData)
            throw new Error(responseData.error || "Transcription failed")
          }

          const { transcript } = responseData
          console.log("[FoodLogger] Transcription result:", transcript)
          
          if (transcript && transcript.trim()) {
            // Parse the transcribed text
            await handleSubmit(transcript.trim(), "voice")
          } else {
            toast({
              title: "No speech detected",
              description: "Please speak clearly and try again",
              variant: "destructive",
            })
          }
        } catch (err) {
          console.error("[FoodLogger] Transcription error:", err)
          const errorMessage = err instanceof Error ? err.message : "Unknown error"
          
          // Provide helpful error messages based on the error type
          let description = "Please try again or type your food"
          if (errorMessage.includes("not configured")) {
            description = "Voice feature is not available. Please type your food instead."
          } else if (errorMessage.includes("Unauthorized")) {
            description = "Please log in to use voice input"
          }
          
          toast({
            title: "Voice input failed",
            description,
            variant: "destructive",
          })
        } finally {
          setIsTranscribing(false)
        }
      }
    } else {
      await startRecording()
    }
  }, [isRecording, stopRecording, startRecording, handleSubmit, toast])

  // Compress image to reduce memory usage on iPad
  const compressImage = useCallback(async (file: File, maxWidth: number = 1200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }

          // Also limit height for very tall images
          const maxHeight = 1200
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }

          canvas.width = width
          canvas.height = height

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height)

          // Get compressed base64 (JPEG at 80% quality)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
          const base64Data = dataUrl.split(",")[1]

          if (!base64Data) {
            reject(new Error("Failed to compress image"))
            return
          }

          // Clean up
          URL.revokeObjectURL(img.src)
          resolve(base64Data)
        } catch (err) {
          URL.revokeObjectURL(img.src)
          reject(err)
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        reject(new Error("Failed to load image for compression"))
      }

      // Create object URL from file
      img.src = URL.createObjectURL(file)
    })
  }, [])

  const handleImageCapture = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset file input immediately to prevent issues on subsequent captures
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please select an image file.",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 20MB before compression)
      const maxSizeBytes = 20 * 1024 * 1024
      if (file.size > maxSizeBytes) {
        toast({
          title: "Image too large",
          description: "Please select an image smaller than 20MB.",
          variant: "destructive",
        })
        return
      }

      // Compress image to prevent memory issues on iPad
      let base64: string
      try {
        base64 = await compressImage(file)
      } catch (compressionError) {
        console.warn("[FoodLogger] Compression failed, trying direct read:", compressionError)

        // Fallback to direct read if compression fails
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            try {
              const result = reader.result as string
              if (!result || !result.includes(",")) {
                reject(new Error("Invalid image data"))
                return
              }
              const base64Data = result.split(",")[1]
              if (!base64Data) {
                reject(new Error("Failed to extract image data"))
                return
              }
              resolve(base64Data)
            } catch (err) {
              reject(err)
            }
          }
          reader.onerror = () => reject(new Error("Failed to read image file"))
          reader.readAsDataURL(file)
        })
      }

      await handleSubmit("Analyze this food image", "image", base64)
    } catch (error) {
      console.error("[FoodLogger] Image error:", error)

      // Provide user-friendly error messages
      let errorMessage = "Failed to process image. Please try again."
      if (error instanceof Error) {
        if (error.message.includes("permission") || error.message.includes("denied")) {
          errorMessage = "Camera access denied. Please allow camera access in your device settings."
        } else if (error.message.includes("memory") || error.message.includes("quota")) {
          errorMessage = "Image too large for processing. Please try a smaller image."
        } else {
          errorMessage = error.message
        }
      }

      toast({
        title: "Image error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [handleSubmit, toast, compressImage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleTextSubmit()
    }
  }, [handleTextSubmit])

  const isProcessing = isParsing || isTranscribing || isRecording

  return (
    <div className={cn("relative", className)}>
      {/* Main input container */}
      <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-sm overflow-visible">
        {/* Meal type selector */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-xs font-medium text-white/70">AI Food Logger</span>
          </div>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMealTypeDropdown(!showMealTypeDropdown)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
            >
              {mealTypeOverride || "Auto-detect meal"}
              <ChevronDown className="h-3 w-3" />
            </button>
            
            <AnimatePresence>
              {showMealTypeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-1 z-20 rounded-lg border border-white/10 bg-charcoal/95 backdrop-blur-sm shadow-lg max-h-[240px] overflow-y-auto"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMealTypeOverride(null)
                      setShowMealTypeDropdown(false)
                    }}
                    className={cn(
                      "block w-full px-3 py-2 text-left text-xs hover:bg-white/5 transition-colors",
                      !mealTypeOverride ? "text-accent" : "text-white/70"
                    )}
                  >
                    Auto-detect
                  </button>
                  {MEAL_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setMealTypeOverride(type)
                        setShowMealTypeDropdown(false)
                      }}
                      className={cn(
                        "block w-full px-3 py-2 text-left text-xs hover:bg-white/5 transition-colors",
                        mealTypeOverride === type ? "text-accent" : "text-white/70"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Text input area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            placeholder="What did you eat? (e.g., '2 eggs with toast and coffee')"
            rows={2}
            disabled={isProcessing || disabled}
            className="relative z-10 w-full resize-none bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none disabled:opacity-50 cursor-text"
          />
          
          {/* Recording indicator overlay */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/80"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="h-3 w-3 rounded-full bg-red-500"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-sm font-medium text-white">{formatTime(recordingTime)}</span>
                  <button
                    type="button"
                    onClick={resetRecording}
                    className="p-1 rounded-full hover:bg-white/10"
                  >
                    <X className="h-4 w-4 text-white/70" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing overlay */}
          <AnimatePresence>
            {(isParsing || isTranscribing) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/80"
              >
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  <span className="text-sm text-white/70">
                    {isTranscribing ? "Transcribing..." : "Analyzing food..."}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            {/* Voice button */}
            {isVoiceSupported && (
              <motion.button
                type="button"
                onClick={handleVoiceToggle}
                disabled={isParsing || isTranscribing || disabled}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                  isRecording
                    ? "bg-red-500 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </motion.button>
            )}

            {/* Camera button */}
            <motion.button
              type="button"
              onClick={() => {
                try {
                  fileInputRef.current?.click()
                } catch (error) {
                  console.error("[FoodLogger] Camera button click error:", error)
                  toast({
                    title: "Camera unavailable",
                    description: "Unable to access camera. Please try selecting an image from your photos.",
                    variant: "destructive",
                  })
                }
              }}
              disabled={isProcessing || disabled}
              whileTap={{ scale: 0.95 }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Camera className="h-4 w-4" />
            </motion.button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageCapture}
              onClick={(e) => {
                // Reset value on click to allow re-selecting the same file
                (e.target as HTMLInputElement).value = ""
              }}
              className="hidden"
            />
          </div>

          {/* Submit button */}
          <motion.button
            type="button"
            onClick={handleTextSubmit}
            disabled={!input.trim() || isProcessing || disabled}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex h-9 items-center gap-2 px-4 rounded-full font-medium text-sm transition-colors",
              input.trim() && !isProcessing
                ? "bg-accent text-black hover:bg-accent/90"
                : "bg-white/5 text-white/30 cursor-not-allowed"
            )}
          >
            <Send className="h-4 w-4" />
            Log
          </motion.button>
        </div>
      </div>

      {/* Helper text */}
      <p className="mt-2 text-center text-xs text-white/40">
        Describe food in natural language, use voice, or snap a photo
      </p>
    </div>
  )
}
