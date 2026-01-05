import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "X-Conversation-Id",
}

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

interface ChatRequest {
  messages: Message[]
  conversationId?: string
}

// Token budget allocation - prioritize current conversation
const TOKEN_BUDGET = {
  systemPrompt: 2500,      // User profile + fitness data
  currentConversation: 2500, // PRIORITY: Recent messages from current conversation
  retrievedContext: 800,   // Lower budget for cross-conversation RAG
  total: 5800              // Safe limit
}

// Estimate tokens (rough: 1 token ≈ 4 chars for English)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// Generate embedding using OpenAI
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000), // Limit input length
    }),
  })
  
  if (!response.ok) {
    console.error("Embedding API error:", await response.text())
    throw new Error("Failed to generate embedding")
  }
  
  const data = await response.json()
  return data.data[0].embedding
}

// Retrieve relevant messages from OTHER conversations using vector similarity
async function retrieveRelevantHistory(
  supabase: any,
  userId: string,
  queryEmbedding: number[],
  currentConversationId: string | null,
  limit: number = 8
): Promise<any[]> {
  try {
    console.log("[VBot] RAG: Searching for relevant history...")
    console.log("[VBot] RAG: User ID:", userId)
    console.log("[VBot] RAG: Excluding conversation:", currentConversationId)
    console.log("[VBot] RAG: Embedding length:", queryEmbedding.length)
    
    // Format embedding as PostgreSQL vector literal
    const embeddingString = `[${queryEmbedding.join(',')}]`
    
    const { data, error } = await supabase.rpc('match_chat_messages', {
      query_embedding: embeddingString,
      match_user_id: userId,
      match_threshold: 0.4, // Lower threshold for better recall
      match_count: limit,
      exclude_conversation_id: currentConversationId,
    })
    
    if (error) {
      console.error("[VBot] RAG error:", JSON.stringify(error))
      return []
    }
    
    console.log("[VBot] RAG: Found", data?.length || 0, "relevant messages")
    if (data && data.length > 0) {
      console.log("[VBot] RAG: Top match similarity:", data[0].similarity)
      console.log("[VBot] RAG: Top match preview:", data[0].content?.slice(0, 100))
    }
    
    return data || []
  } catch (err) {
    console.error("[VBot] RAG exception:", err)
    return []
  }
}

// Get recent messages from current conversation
async function getRecentMessages(
  supabase: any,
  conversationId: string,
  limit: number = 10
): Promise<any[]> {
  if (!conversationId) return []
  
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error("[VBot] Recent messages error:", error)
      return []
    }
    
    return (data || []).reverse()
  } catch (err) {
    console.error("[VBot] Recent messages exception:", err)
    return []
  }
}

// Store a message with its embedding
async function storeMessage(
  supabase: any,
  conversationId: string,
  userId: string,
  role: string,
  content: string,
  embedding: number[] | null
): Promise<{ success: boolean; id?: string }> {
  try {
    const { data, error } = await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      user_id: userId,
      role,
      content,
      embedding: embedding ? `[${embedding.join(',')}]` : null,
      token_count: estimateTokens(content),
    }).select('id').single()
    
    if (error) {
      console.error(`[VBot] Failed to store message:`, error)
      return { success: false }
    }
    
    return { success: true, id: data.id }
  } catch (err) {
    console.error("[VBot] Store message exception:", err)
    return { success: false }
  }
}

// Create or get conversation
async function getOrCreateConversation(
  supabase: any,
  userId: string,
  conversationId?: string
): Promise<string> {
  if (conversationId) {
    const { data } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()
    
    if (data) return conversationId
  }
  
  const { data, error } = await supabase
    .from('chat_conversations')
    .insert({ user_id: userId })
    .select('id')
    .single()
  
  if (error) {
    console.error("[VBot] Create conversation error:", error)
    throw new Error("Failed to create conversation")
  }
  
  return data.id
}

// Build context with token management - PRIORITIZE current conversation
function buildContextMessages(
  recentMessages: any[],
  retrievedMessages: any[],
  currentConvBudget: number,
  retrievedBudget: number
): { currentContext: Message[], retrievedContext: string } {
  const currentContext: Message[] = []
  let currentTokens = 0
  
  // PRIORITY: Add ALL recent messages from current conversation first
  for (const msg of recentMessages) {
    const tokens = estimateTokens(msg.content)
    if (currentTokens + tokens < currentConvBudget) {
      currentContext.push({ role: msg.role, content: msg.content })
      currentTokens += tokens
    }
  }
  
  
  // Only add retrieved context if we have room and relevant messages
  let retrievedContext = ""
  
  if (retrievedMessages.length > 0) {
    // Deduplicate - don't include content already in current conversation
    const currentContent = new Set(recentMessages.map(m => m.content.toLowerCase().trim()))
    const uniqueRetrieved = retrievedMessages.filter(m => 
      !currentContent.has(m.content.toLowerCase().trim())
    )
    
    if (uniqueRetrieved.length > 0) {
      let retrievedTokens = 0
      const snippets: string[] = []
      
      for (const msg of uniqueRetrieved) {
        // Include the role so the AI knows who said what
        const roleLabel = msg.role === 'user' ? 'User previously said' : 'You previously told them'
        const briefContent = msg.content.length > 300 
          ? msg.content.slice(0, 300) + "..." 
          : msg.content
        const snippet = `- ${roleLabel}: "${briefContent}"`
        const tokens = estimateTokens(snippet)
        
        if (retrievedTokens + tokens < retrievedBudget) {
          snippets.push(snippet)
          retrievedTokens += tokens
        }
      }
      
      if (snippets.length > 0) {
        retrievedContext = snippets.join("\n")
      }
    }
  }
  
  return { currentContext, retrievedContext }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured")
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error("[VBot] Auth error:", JSON.stringify(authError))
    }
    if (!user) {
      console.error("[VBot] No user found from auth token")
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
    console.log("[VBot] Authenticated user:", user.id, user.email)

    // Parse request body
    const { messages, conversationId: requestConversationId } = await req.json() as ChatRequest
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid request: messages required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Get or create conversation
    const conversationId = await getOrCreateConversation(supabase, user.id, requestConversationId)
    
    // Get the latest user message for embedding
    const latestUserMessage = messages.filter(m => m.role === "user").pop()
    if (!latestUserMessage) {
      return new Response(
        JSON.stringify({ error: "No user message found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Generate embedding for the user's query (for RAG)
    let queryEmbedding: number[] | null = null
    let retrievedMessages: any[] = []
    
    try {
      console.log("[VBot] Generating embedding for query:", latestUserMessage.content.slice(0, 100))
      queryEmbedding = await generateEmbedding(latestUserMessage.content, openaiApiKey)
      console.log("[VBot] Embedding generated successfully, length:", queryEmbedding.length)
      
      // Retrieve relevant history from other conversations
      retrievedMessages = await retrieveRelevantHistory(
        supabase,
        user.id,
        queryEmbedding,
        conversationId,
        8  // Increased limit for better coverage
      )
      console.log("[VBot] Retrieved", retrievedMessages.length, "relevant messages from history")
      
      // Log RAG results for debugging
      if (retrievedMessages.length > 0) {
        console.log("[VBot] RAG top result similarity:", retrievedMessages[0]?.similarity)
      } else {
        console.log("[VBot] RAG: No relevant history found (this is normal for new users)")
      }
    } catch (embeddingError) {
      console.error("[VBot] Embedding/RAG error:", embeddingError instanceof Error ? embeddingError.message : embeddingError)
      console.error("[VBot] Embedding/RAG full error:", JSON.stringify(embeddingError))
    }

    // Get recent messages from current conversation (PRIORITY)
    const recentMessages = await getRecentMessages(supabase, conversationId, 10)
    
    // Build context - prioritize current conversation
    const { currentContext, retrievedContext } = buildContextMessages(
      recentMessages,
      retrievedMessages,
      TOKEN_BUDGET.currentConversation,
      TOKEN_BUDGET.retrievedContext
    )

    // Store the user's message AFTER getting context (so it doesn't duplicate)
    await storeMessage(
      supabase,
      conversationId,
      user.id,
      "user",
      latestUserMessage.content,
      queryEmbedding
    )

    // Fetch all user fitness data in parallel
    console.log("[VBot] Fetching user data for user:", user.id)
    
    const [
      profileResult,
      habitsResult,
      workoutsResult,
      mealsResult,
      weightEntriesResult,
      progressPhotosResult,
      streaksResult,
      supplementsResult,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("habits").select("*, habit_logs(*)").eq("user_id", user.id),
      supabase
        .from("workouts")
        .select("*, workout_exercises(*, exercises(*))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("meals")
        .select("*, meal_logs(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("weight_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(10),
      supabase
        .from("progress_photos")
        .select("*")
        .eq("user_id", user.id)
        .order("taken_at", { ascending: false })
        .limit(5),
      supabase.from("streaks").select("*").eq("user_id", user.id),
      supabase
        .from("supplement_logs")
        .select("*, supplements(*)")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(10),
    ])

    // Log any errors from data fetching
    if (profileResult.error) {
      console.error("[VBot] Profile fetch error:", JSON.stringify(profileResult.error))
    }
    if (habitsResult.error) {
      console.error("[VBot] Habits fetch error:", JSON.stringify(habitsResult.error))
    }
    if (workoutsResult.error) {
      console.error("[VBot] Workouts fetch error:", JSON.stringify(workoutsResult.error))
    }
    if (mealsResult.error) {
      console.error("[VBot] Meals fetch error:", JSON.stringify(mealsResult.error))
    }
    if (weightEntriesResult.error) {
      console.error("[VBot] Weight entries fetch error:", JSON.stringify(weightEntriesResult.error))
    }
    if (progressPhotosResult.error) {
      console.error("[VBot] Progress photos fetch error:", JSON.stringify(progressPhotosResult.error))
    }
    if (streaksResult.error) {
      console.error("[VBot] Streaks fetch error:", JSON.stringify(streaksResult.error))
    }
    if (supplementsResult.error) {
      console.error("[VBot] Supplements fetch error:", JSON.stringify(supplementsResult.error))
    }

    // Build comprehensive user context
    const profile = profileResult.data
    const habits = habitsResult.data || []
    const workouts = workoutsResult.data || []
    const meals = mealsResult.data || []
    const weightEntries = weightEntriesResult.data || []
    const progressPhotos = progressPhotosResult.data || []
    const streaks = streaksResult.data || []
    const supplements = supplementsResult.data || []
    
    // Log data summary for debugging
    console.log("[VBot] Data loaded - Profile:", profile ? "YES" : "NO", 
      "| Habits:", habits.length, 
      "| Workouts:", workouts.length,
      "| Meals:", meals.length,
      "| Weight entries:", weightEntries.length,
      "| Streaks:", streaks.length)
    
    if (profile) {
      console.log("[VBot] Profile data - Name:", profile.name, 
        "| Weight:", profile.weight,
        "| Goal:", profile.primary_goal,
        "| Goal Weight:", profile.goal_weight)
    } else {
      console.warn("[VBot] WARNING: No profile found for user", user.id)
    }

    // Calculate stats
    const completedHabitsToday = habits.filter((h: any) =>
      h.habit_logs?.some(
        (log: { completed: boolean; logged_at: string }) =>
          log.completed && new Date(log.logged_at).toDateString() === new Date().toDateString()
      )
    ).length

    const completedWorkouts = workouts.filter((w: any) => w.completed).length
    const totalWorkoutMinutes = workouts.reduce((sum: number, w: any) => sum + (w.duration_minutes || 0), 0)
    const totalCalories = meals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0)
    const totalProtein = meals.reduce((sum: number, m: any) => sum + (m.protein || 0), 0)

    const currentWeight = weightEntries[0]?.weight
    const startWeight = weightEntries[weightEntries.length - 1]?.weight
    const weightChange = currentWeight && startWeight ? currentWeight - startWeight : 0

    // Build system context
    const systemContext = `You are VBot, an intelligent AI fitness coach for V-Life. You have complete access to the user's fitness data and can provide personalized advice, motivation, and insights.

Focus on the current conversation. ${retrievedContext ? "You may have some context from previous conversations if highly relevant." : ""}

USER PROFILE:
- Name: ${profile?.name || "User"}
- Age: ${profile?.age || "N/A"}
- Gender: ${profile?.gender || "N/A"}
- Height: ${profile?.height_feet || 0}'${profile?.height_inches || 0}"
- Current Weight: ${currentWeight || profile?.weight || "N/A"} lbs
- Goal Weight: ${profile?.goal_weight || "N/A"} lbs
- Weight Change: ${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} lbs
- Primary Goal: ${profile?.primary_goal || "N/A"}
- Activity Level: ${profile?.activity_level || "N/A"}/5
- Gym Access: ${profile?.gym_access || "N/A"}
- Selected Gym: ${profile?.selected_gym || "N/A"}
- Allergies: ${profile?.allergies?.join(", ") || "None"}
- Dietary Restrictions: ${profile?.custom_restrictions?.join(", ") || "None"}

HABITS (${habits.length} total):
${habits.slice(0, 5).map((h: any) => `- ${h.name} (${h.category}) - Streak: ${h.current_streak} days`).join("\n")}
- Completed Today: ${completedHabitsToday}/${habits.length}

RECENT WORKOUTS:
${workouts.slice(0, 3).map((w: any) => `- ${w.name} - ${w.completed ? "✓" : "○"} - ${w.duration_minutes || 0} min`).join("\n")}
- Total Completed: ${completedWorkouts}, Total Minutes: ${totalWorkoutMinutes}

NUTRITION SUMMARY:
- Recent Calories: ${totalCalories}, Protein: ${totalProtein}g

WEIGHT TREND:
${weightEntries.slice(0, 3).map((w: any) => `- ${new Date(w.logged_at).toLocaleDateString()}: ${w.weight} lbs`).join("\n")}

STREAKS:
${streaks.map((s: any) => `- ${s.streak_type}: ${s.current_streak} days`).join("\n")}

Your role is to:
1. Provide personalized fitness and nutrition advice based on their data
2. Remember context from previous conversations when relevant
3. Motivate and encourage based on their progress
4. Be supportive, knowledgeable, and conversational
5. Keep responses concise and actionable`

    // Build final messages array - current conversation is priority
    const finalMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemContext },
    ]
    
    // Add retrieved context as memories from past conversations
    if (retrievedContext) {
      console.log("[VBot] Adding retrieved context to prompt")
      finalMessages.push({
        role: "system",
        content: `IMPORTANT - MEMORIES FROM PAST CONVERSATIONS WITH THIS USER:
The following are relevant excerpts from previous conversations you've had with this user. Use this information to provide personalized, context-aware responses. If the user asks about something they've mentioned before, reference this information.

${retrievedContext}

Remember to naturally incorporate this context when relevant to the user's current question.`
      })
    } else {
      console.log("[VBot] No retrieved context available")
    }
    
    // Add current conversation messages (the main context)
    finalMessages.push(...currentContext)
    
    // Add the latest user message
    finalMessages.push({ role: "user", content: latestUserMessage.content })

    // Call OpenAI API with streaming
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: finalMessages,
        stream: true,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error("OpenAI API error:", errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    // Stream the response back and collect for storage
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    let fullAssistantResponse = ""

    const stream = new ReadableStream({
      async start(controller) {
        const reader = openaiResponse.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        let buffer = ""
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6)
                if (data === "[DONE]") {
                  controller.enqueue(encoder.encode(`d:{"finishReason":"stop","conversationId":"${conversationId}"}\n`))
                  continue
                }
                
                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    fullAssistantResponse += content
                    const escapedContent = JSON.stringify(content)
                    controller.enqueue(encoder.encode(`0:${escapedContent}\n`))
                  }
                } catch {
                  // Ignore parse errors
                }
              }
            }
          }

          // Store assistant response with embedding after streaming completes
          if (fullAssistantResponse) {
            try {
              const assistantEmbedding = await generateEmbedding(fullAssistantResponse, openaiApiKey)
              await storeMessage(
                supabase,
                conversationId,
                user.id,
                "assistant",
                fullAssistantResponse,
                assistantEmbedding
              )
            } catch (storeError) {
              console.error("Error storing assistant message:", storeError)
              // Still store without embedding if embedding fails
              await storeMessage(
                supabase,
                conversationId,
                user.id,
                "assistant",
                fullAssistantResponse,
                null
              )
            }
          }
        } catch (error) {
          console.error("Stream error:", error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
        "X-Conversation-Id": conversationId,
      },
    })
  } catch (error) {
    console.error("[VBot Edge Function Error]", error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
