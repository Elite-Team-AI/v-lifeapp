"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, Bot, UserIcon, Plus, MessageSquare, ChevronLeft, Trash2, Sparkles, Mic, Info } from "lucide-react"
import { useState, useRef, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import ReactMarkdown from "react-markdown"
import { ButtonGlow } from "@/components/ui/button-glow"
import { BottomNav } from "@/components/bottom-nav"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { VoicePlayback, InlineVoiceInput } from "@/components/voice"
import type { VoicePreferences, GeminiVoiceName } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface Conversation {
  id: string
  title: string
  updated_at: string
  message_count: number
}

const DEFAULT_VOICE_PREFS: VoicePreferences = {
  selectedVoice: "Kore",
  voiceEnabled: true,
  autoPlayResponses: false,
}

function VBotPageContent() {
  const searchParams = useSearchParams()
  const initialPrompt = searchParams.get("prompt")
  const hasAutoSentRef = useRef(false)
  
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [voicePrefs, setVoicePrefs] = useState<VoicePreferences>(DEFAULT_VOICE_PREFS)
  const [lastAssistantMessageId, setLastAssistantMessageId] = useState<string | null>(null)
  const [lastMessageWasVoice, setLastMessageWasVoice] = useState(false)
  const [isStreamingComplete, setIsStreamingComplete] = useState(false)
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const conversationIdRef = useRef<string | null>(null)
  const shouldScrollRef = useRef(false)

  // Load conversations and voice preferences on mount
  useEffect(() => {
    loadConversations()
    loadVoicePreferences()
  }, [])

  const loadVoicePreferences = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("voice_preferences")
        .eq("id", user.id)
        .single()

      if (profile?.voice_preferences) {
        setVoicePrefs({
          ...DEFAULT_VOICE_PREFS,
          ...profile.voice_preferences,
        })
      }
    } catch (err) {
      console.error("Error loading voice preferences:", err)
    }
  }

  const loadConversations = async () => {
    setLoadingConversations(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('id, title, updated_at, message_count')
        .order('updated_at', { ascending: false })
        .limit(20)
      
      if (error) {
        console.error("Error loading conversations:", error)
      } else {
        setConversations(data || [])
      }
    } catch (err) {
      console.error("Error loading conversations:", err)
    } finally {
      setLoadingConversations(false)
    }
  }

  const loadConversation = async (convId: string) => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error("Error loading messages:", error)
        setError("Failed to load conversation")
      } else {
        setMessages((data || []).map((m: any) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        })))
        conversationIdRef.current = convId
        setConversationId(convId)
        setShowHistory(false)
      }
    } catch (err) {
      console.error("Error loading conversation:", err)
      setError("Failed to load conversation")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.from('chat_conversations').delete().eq('id', convId)
      setConversations(prev => prev.filter(c => c.id !== convId))
      if (conversationId === convId) {
        startNewConversation()
      }
    } catch (err) {
      console.error("Error deleting conversation:", err)
    }
  }

  const startNewConversation = () => {
    conversationIdRef.current = null
    setConversationId(null)
    setMessages([])
    setError(null)
    setShowHistory(false)
  }

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return

    const supabase = getSupabaseBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      setError("Please log in to use the chat")
      return
    }

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage.trim(),
    }
    
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)
    setError(null)

    abortControllerRef.current = new AbortController()

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      
      // Use ref to get the latest conversationId (avoids stale closure)
      const currentConversationId = conversationIdRef.current
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/vbot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMsg].map(m => ({
              role: m.role,
              content: m.content,
            })),
            conversationId: currentConversationId,
          }),
          signal: abortControllerRef.current.signal,
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error: ${response.status} - ${errorText}`)
      }

      // Get conversation ID from response header
      const newConversationId = response.headers.get("X-Conversation-Id")
      if (newConversationId) {
        // Update ref immediately (for next sendMessage call)
        conversationIdRef.current = newConversationId
        // Then update state (for UI)
        if (!currentConversationId) {
          setConversationId(newConversationId)
        }
      }

      // Create assistant message placeholder
      const assistantMsgId = `assistant-${Date.now()}`
      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: "assistant",
        content: "",
      }])
      setLastAssistantMessageId(assistantMsgId)
      setIsStreamingComplete(false)

      // Read streaming response
      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let assistantContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const text = JSON.parse(line.slice(2))
              assistantContent += text
              setMessages(prev => 
                prev.map(m => 
                  m.id === assistantMsgId 
                    ? { ...m, content: assistantContent }
                    : m
                )
              )
            } catch {
              // Ignore parse errors
            }
          } else if (line.startsWith("d:")) {
            // Handle done message with conversation ID
            try {
              const data = JSON.parse(line.slice(2))
              if (data.conversationId) {
                conversationIdRef.current = data.conversationId
                setConversationId(data.conversationId)
              }
            } catch {
              // Ignore
            }
          }
        }
      }

      // Mark streaming as complete - this triggers voice playback
      setIsStreamingComplete(true)

      // Refresh conversations list
      loadConversations()
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return
      }
      console.error("[VBot Error]", err)
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [messages, isLoading, conversationId])

  // Auto-send prompt from URL (e.g., from exercise help links)
  useEffect(() => {
    if (initialPrompt && !hasAutoSentRef.current && !isLoading) {
      hasAutoSentRef.current = true
      shouldScrollRef.current = true // Scroll to show the auto-sent message
      sendMessage(decodeURIComponent(initialPrompt))
    }
  }, [initialPrompt, isLoading, sendMessage])

  useEffect(() => {
    if (error) {
      console.log("[v0] VBot chat error:", error)
    }
  }, [error])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Track if we should scroll (only when user sends a message, not during bot streaming)
  useEffect(() => {
    // Only scroll if explicitly requested (when user sends message)
    if (shouldScrollRef.current) {
      scrollToBottom()
      shouldScrollRef.current = false
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    setLastMessageWasVoice(false)
    shouldScrollRef.current = true // Scroll to show user's message
    sendMessage(input)
  }

  // Handle voice transcript from speech-to-text
  const handleVoiceTranscript = useCallback((transcript: string) => {
    if (transcript.trim()) {
      setLastMessageWasVoice(true)
      shouldScrollRef.current = true // Scroll to show user's message
      sendMessage(transcript)
    }
  }, [sendMessage])


  // History sidebar
  const HistorySidebar = () => (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: 0 }}
      exit={{ x: "-100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-black"
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <h2 className="text-lg font-bold text-white">Chat History</h2>
          </div>
          <ButtonGlow
            variant="accent-glow"
            size="sm"
            onClick={startNewConversation}
          >
            <Plus className="mr-1 h-4 w-4" />
            New
          </ButtonGlow>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-8 text-center text-white/60">
              <MessageSquare className="mx-auto mb-2 h-8 w-8" />
              <p>No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "group flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10",
                    conversationId === conv.id && "border-accent bg-accent/10"
                  )}
                  onClick={() => loadConversation(conv.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {conv.title}
                    </p>
                    <p className="text-xs text-white/50">
                      {conv.message_count} messages · {new Date(conv.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="ml-2 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4 text-red-400 hover:text-red-300" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="relative flex h-screen max-h-screen flex-col bg-gradient-to-b from-black via-zinc-900 to-black noise-overlay overflow-hidden pb-20">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[25%] -top-[25%] h-[50%] w-[50%] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute -bottom-[25%] -right-[25%] h-[50%] w-[50%] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* History sidebar */}
      <AnimatePresence>
        {showHistory && <HistorySidebar />}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="container mx-auto max-w-md px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(true)}
                className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all hover:bg-white/10 hover:scale-105"
              >
                <MessageSquare className="h-5 w-5 text-white/70 transition-colors group-hover:text-white" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  VBot 
                  <button
                    onClick={() => setShowInfoModal(true)}
                    className="group flex h-5 w-5 items-center justify-center rounded-full text-white/40 hover:text-accent transition-colors"
                    title="How to use VBot"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">BETA</span>
                  {voicePrefs.voiceEnabled && (
                    <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
                      <Mic className="h-2.5 w-2.5" />
                      VOICE
                    </span>
                  )}
                </h1>
                <p className="text-xs text-white/50">
                  {conversationId ? "Continuing conversation" : "Your AI Fitness Coach"}
                </p>
                <p className="text-[10px] text-white/30 mt-1">
                  Not medical advice. Consult your physician before starting any fitness program.
                </p>
              </div>
            </div>
            <ButtonGlow
              variant="outline-glow"
              size="sm"
              onClick={startNewConversation}
              className="h-8 border-white/10 bg-white/5 hover:bg-white/10"
            >
              <Plus className="mr-1 h-3 w-3" />
              New Chat
            </ButtonGlow>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="relative z-0 container mx-auto max-w-2xl flex-1 overflow-y-auto px-4 pt-6 pb-32 max-h-[calc(100vh-240px)]">
        {messages.length === 0 ? (
          <motion.div
            className="flex flex-col items-center text-center pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="relative mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-b from-accent/20 to-accent/5 ring-1 ring-accent/20 backdrop-blur-sm"
              animate={{
                boxShadow: [
                  "0 0 20px -5px rgba(234, 179, 8, 0.1)",
                  "0 0 50px -10px rgba(234, 179, 8, 0.3)",
                  "0 0 20px -5px rgba(234, 179, 8, 0.1)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Bot className="h-14 w-14 text-accent drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
              </motion.div>
              <motion.div
                className="absolute -right-2 -top-2 rounded-full bg-black/80 p-2 shadow-lg ring-1 ring-white/10 backdrop-blur-md"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-4 w-4 text-accent" />
              </motion.div>
            </motion.div>

            <h2 className="mb-3 text-3xl font-bold tracking-tight">
              <span className="text-white">Hi! I'm </span>
              <span className="bg-gradient-to-r from-accent via-yellow-400 to-orange-400 bg-clip-text text-transparent">VBot</span>
            </h2>
            <p className="mb-4 max-w-sm text-lg text-white/60 leading-relaxed">
              I know everything about your fitness journey. What would you like to work on today?
            </p>
            
            {/* How to use VBot */}
            <div className="w-full max-w-sm mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs font-medium text-accent mb-2 uppercase tracking-wider">How to use VBot</p>
              <ul className="space-y-1.5 text-sm text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span><strong className="text-white/90">Situational coaching</strong> - traveling, sick, limited equipment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span><strong className="text-white/90">Personalized advice</strong> - uses your profile and progress data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span><strong className="text-white/90">On-demand Q&A</strong> - fitness, nutrition, recovery questions</span>
                </li>
              </ul>
            </div>

            <div className="w-full max-w-sm space-y-3">
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                Suggested questions
              </p>
              {[
                "How am I doing with my fitness goals?",
                "What should I focus on this week?",
                "Give me motivation based on my progress"
              ].map((text, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                  className="group relative flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-left text-sm text-white/80 transition-all hover:border-accent/30 hover:bg-white/10 hover:text-white active:scale-[0.98]"
                  onClick={() => setInput(text)}
                >
                  <span>{text}</span>
                  <ChevronLeft className="h-4 w-4 rotate-180 opacity-0 transition-all text-accent group-hover:translate-x-1 group-hover:opacity-100" />
                </motion.button>
              ))}
            </div>
            
            {/* Show recent conversations */}
            {conversations.length > 0 && (
              <div className="mt-12 w-full max-w-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Recent</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="space-y-2">
                  {conversations.slice(0, 2).map((conv, i) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                      className="group cursor-pointer rounded-lg border border-white/5 bg-white/[0.02] p-3 text-left transition-colors hover:bg-white/5 hover:border-white/10"
                      onClick={() => loadConversation(conv.id)}
                    >
                      <p className="truncate text-sm text-white/70 group-hover:text-white transition-colors">{conv.title}</p>
                      <p className="text-xs text-white/30 mt-1">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent">
                    <Bot className="h-5 w-5 text-black" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-accent text-black"
                      : "border border-white/10 bg-black/50 text-white backdrop-blur-sm",
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="space-y-2">
                      <div className="prose prose-invert prose-sm max-w-none leading-relaxed [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2 [&_p]:last:mb-0 [&_strong]:font-bold [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-4">
                        {message.content ? (
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-white/60">Thinking...</span>
                          </span>
                        )}
                      </div>
                      {/* Voice playback button for completed messages */}
                      {message.content && voicePrefs.voiceEnabled && (
                        <div className="flex items-center justify-end pt-1 border-t border-white/5">
                          <VoicePlayback
                            text={message.content}
                            voice={voicePrefs.selectedVoice}
                            autoPlay={(voicePrefs.autoPlayResponses || lastMessageWasVoice) && message.id === lastAssistantMessageId && isStreamingComplete}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </p>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
                    <UserIcon className="h-5 w-5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <motion.div className="flex gap-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent">
                  <Bot className="h-5 w-5 text-black" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 backdrop-blur-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  <span className="text-sm text-white/70">Thinking...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input - fixed above bottom nav */}
      <div className="fixed bottom-20 left-0 right-0 z-40 bg-black/90 backdrop-blur-lg border-t border-white/5 flex-shrink-0">
        <div className="container mx-auto max-w-2xl px-4 py-3">
          <form onSubmit={handleSubmit} className="relative">
            <AnimatePresence mode="wait">
              {isVoiceInputActive ? (
                <InlineVoiceInput
                  key="voice-input"
                  onTranscript={handleVoiceTranscript}
                  onActiveChange={setIsVoiceInputActive}
                  disabled={isLoading}
                  className="w-full"
                />
              ) : (
                <motion.div
                  key="text-input-wrapper"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message VBot..."
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 pr-24 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {/* Mic button */}
                    {voicePrefs.voiceEnabled && (
                      <button
                        type="button"
                        onClick={() => setIsVoiceInputActive(true)}
                        disabled={isLoading}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                      >
                        <Mic className="h-4 w-4" />
                      </button>
                    )}
                    {/* Send button */}
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-black transition-all hover:bg-accent/90 disabled:bg-white/10 disabled:text-white/30"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
          {error && <p className="mt-2 text-xs text-red-500">Error: {error}</p>}
        </div>
      </div>

      <BottomNav />

      {/* VBot Info Modal */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="bg-black/95 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-accent" />
              How to Use VBot
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Your AI Fitness Coach
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <p className="text-sm text-white/90 mb-3">
                VBot is your <strong className="text-accent">digital fitness coach</strong> that provides personalized, on-demand guidance tailored to your fitness journey. Unlike static features, VBot understands your profile, progress, and goals to give you real-time coaching.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent text-sm font-bold">1</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Situational Coaching</h4>
                  <p className="text-sm text-white/70">
                    Get personalized workout adjustments when traveling, sick, or with limited equipment. VBot adapts to your current situation.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent text-sm font-bold">2</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Personalized Advice</h4>
                  <p className="text-sm text-white/70">
                    Uses your profile data, workout history, and progress to provide tailored recommendations. Every answer is customized to you.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent text-sm font-bold">3</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">On-Demand Q&A</h4>
                  <p className="text-sm text-white/70">
                    Ask anything about fitness, nutrition, recovery, or form. Get instant answers with context from your journey.
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-white/50">
                <strong className="text-white/70">Note:</strong> VBot is not medical advice. Consult your physician before starting any fitness program.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function VBotPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-zinc-900 to-black">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <VBotPageContent />
    </Suspense>
  )
}
