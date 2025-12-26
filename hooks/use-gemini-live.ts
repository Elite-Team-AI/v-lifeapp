"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { GeminiLiveClient, createAudioProcessor, StreamingAudioPlayer } from "@/lib/gemini-live"
import type { GeminiVoiceName } from "@/lib/types"

export type LiveVoiceState = 'disconnected' | 'connecting' | 'idle' | 'listening' | 'responding' | 'error'

interface UseGeminiLiveOptions {
  voice?: GeminiVoiceName
  systemInstruction?: string
  onTranscript?: (text: string) => void
}

interface UseGeminiLiveReturn {
  state: LiveVoiceState
  transcript: string
  response: string
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  startListening: () => Promise<void>
  stopListening: () => void
  sendText: (text: string) => void
}

export function useGeminiLive({
  voice = "Kore",
  systemInstruction,
  onTranscript,
}: UseGeminiLiveOptions = {}): UseGeminiLiveReturn {
  const [state, setState] = useState<LiveVoiceState>('disconnected')
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [error, setError] = useState<string | null>(null)

  const clientRef = useRef<GeminiLiveClient | null>(null)
  const audioProcessorRef = useRef<{ start: () => Promise<void>; stop: () => void } | null>(null)
  const audioPlayerRef = useRef<StreamingAudioPlayer | null>(null)

  // Initialize audio player
  useEffect(() => {
    audioPlayerRef.current = new StreamingAudioPlayer()
    return () => {
      audioPlayerRef.current?.stop()
    }
  }, [])

  const connect = useCallback(async () => {
    try {
      setState('connecting')
      setError(null)

      // Get API key from environment
      // NOTE: For production, use a WebSocket proxy to keep the key server-side
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
      if (!apiKey) {
        throw new Error("NEXT_PUBLIC_GOOGLE_API_KEY not configured")
      }

      const client = new GeminiLiveClient(
        {
          apiKey,
          voice,
          systemInstruction: systemInstruction || 
            "You are VBot, a helpful AI fitness coach for V-Life. Keep responses brief and conversational - 1-2 sentences maximum. Be encouraging and supportive. IMPORTANT: Speak directly to the user without any internal reasoning, meta-commentary, or markdown formatting. Just give natural conversational responses.",
        },
        {
          onAudioData: (audioData) => {
            // Play streamed audio immediately
            console.log("[GeminiLive] 🔊 Received audio data:", audioData.byteLength, "bytes")
            audioPlayerRef.current?.play(audioData)
            setState('responding')
          },
          onTranscript: (text, isFinal) => {
            console.log("[GeminiLive] 📝 Transcript:", text, "isFinal:", isFinal)
            setResponse(prev => prev + text)
            if (isFinal) {
              onTranscript?.(text)
              // When model finishes speaking, go back to listening
              console.log("[GeminiLive] ✅ Turn complete, back to listening")
              setState('listening')
            }
          },
          onError: (err) => {
            console.error("[GeminiLive] Error:", err)
            setError(err.message)
            setState('error')
          },
          onConnectionChange: (connected) => {
            if (connected) {
              setState('idle')
              console.log("[GeminiLive] Connected and ready")
            } else {
              setState('disconnected')
              console.log("[GeminiLive] Disconnected")
            }
          },
        }
      )

      await client.connect()
      clientRef.current = client
    } catch (err) {
      console.error("[GeminiLive] Connection error:", err)
      setError(err instanceof Error ? err.message : "Failed to connect")
      setState('error')
    }
  }, [voice, systemInstruction, onTranscript])

  const disconnect = useCallback(() => {
    audioProcessorRef.current?.stop()
    clientRef.current?.disconnect()
    clientRef.current = null
    setState('disconnected')
    setTranscript("")
    setResponse("")
  }, [])

  const startListening = useCallback(async () => {
    if (!clientRef.current?.connected) {
      setError("Not connected")
      return
    }

    try {
      setState('listening')
      setTranscript("")
      setResponse("")

      // Create audio processor that sends to Gemini
      audioProcessorRef.current = createAudioProcessor((audioData) => {
        clientRef.current?.sendAudio(audioData)
      })

      await audioProcessorRef.current.start()
      console.log("[GeminiLive] Started listening")
    } catch (err) {
      console.error("[GeminiLive] Failed to start listening:", err)
      setError(err instanceof Error ? err.message : "Failed to start microphone")
      setState('error')
    }
  }, [])

  const stopListening = useCallback(() => {
    audioProcessorRef.current?.stop()
    audioProcessorRef.current = null
    
    if (state === 'listening') {
      setState('idle')
    }
    console.log("[GeminiLive] Stopped listening")
  }, [state])

  const sendText = useCallback((text: string) => {
    if (!clientRef.current?.connected) {
      setError("Not connected")
      return
    }

    setTranscript(text)
    setResponse("")
    clientRef.current.sendText(text)
    setState('responding')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioProcessorRef.current?.stop()
      clientRef.current?.disconnect()
    }
  }, [])

  return {
    state,
    transcript,
    response,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendText,
  }
}
