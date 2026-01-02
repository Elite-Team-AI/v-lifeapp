import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { env } from "@/lib/env"

// Proxy to Supabase Edge Function for STT
// This route forwards the audio to the vbot-stt edge function which uses Google Gemini

export async function POST(req: NextRequest) {
  try {
    // Verify authentication and get session
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      console.error("[VBot STT Proxy] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the audio formdata from the request
    const formData = await req.formData()
    const audioFile = formData.get("audio") as File | null
    
    if (!audioFile) {
      console.error("[VBot STT Proxy] No audio file in request")
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }
    
    console.log("[VBot STT Proxy] Processing audio:", {
      type: audioFile.type,
      size: audioFile.size,
      name: audioFile.name,
    })
    
    // Build the edge function URL
    const edgeFunctionUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/vbot-stt`

    // Forward the request to the edge function
    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "apikey": env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Edge function error" }))
      console.error("[VBot STT Proxy] Edge function error:", response.status, errorData)
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    console.log("[VBot STT Proxy] Transcription success:", data.transcript?.slice(0, 50))
    return NextResponse.json(data)
  } catch (error) {
    console.error("[VBot STT Proxy Error]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
