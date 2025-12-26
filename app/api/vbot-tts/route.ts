import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { env } from "@/lib/env"

// Direct Gemini TTS - No Edge Function proxy for faster response
// This eliminates one network hop and reduces latency significantly

// Convert raw PCM (L16) audio to WAV format by adding a header
function pcmToWav(pcmData: Buffer, sampleRate: number = 24000, numChannels: number = 1, bitsPerSample: number = 16): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8)
  const blockAlign = numChannels * (bitsPerSample / 8)
  const dataSize = pcmData.length
  const headerSize = 44
  const fileSize = headerSize + dataSize - 8

  const header = Buffer.alloc(headerSize)
  
  // RIFF header
  header.write("RIFF", 0)
  header.writeUInt32LE(fileSize, 4)
  header.write("WAVE", 8)
  
  // fmt subchunk
  header.write("fmt ", 12)
  header.writeUInt32LE(16, 16) // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20) // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  
  // data subchunk
  header.write("data", 36)
  header.writeUInt32LE(dataSize, 40)

  return Buffer.concat([header, pcmData])
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const authTime = Date.now() - startTime
    console.log(`[VBot TTS] Auth check: ${authTime}ms`)

    // Check for Google API key
    if (!env.GOOGLE_API_KEY) {
      console.error("[VBot TTS] GOOGLE_API_KEY not configured")
      return NextResponse.json({ error: "TTS service not configured" }, { status: 500 })
    }

    // Get the request body
    const { text, voice = "Kore" } = await req.json()
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Limit text length to prevent abuse
    const truncatedText = text.slice(0, 4000)
    
    console.log(`[VBot TTS] Generating speech for ${truncatedText.length} chars, voice: ${voice}`)

    // Call Gemini TTS API directly (no Edge Function proxy)
    const geminiStart = Date.now()
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: truncatedText,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice,
                },
              },
            },
          },
        }),
      }
    )

    const geminiTime = Date.now() - geminiStart
    console.log(`[VBot TTS] Gemini API call: ${geminiTime}ms, status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[VBot TTS] Gemini API error:", errorText)
      return NextResponse.json(
        { error: "TTS generation failed", details: errorText },
        { status: 500 }
      )
    }

    const data = await response.json()
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
    const mimeType = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || "audio/l16"

    if (!audioData) {
      console.error("[VBot TTS] No audio data in response")
      return NextResponse.json({ error: "No audio generated" }, { status: 500 })
    }

    // Convert base64 to buffer
    const pcmData = Buffer.from(audioData, "base64")
    
    // If it's raw PCM (L16), convert to WAV for browser compatibility
    let outputData: Buffer
    let outputMimeType: string
    
    if (mimeType.includes("l16") || mimeType.includes("pcm")) {
      outputData = pcmToWav(pcmData)
      outputMimeType = "audio/wav"
    } else {
      outputData = pcmData
      outputMimeType = mimeType
    }

    const totalTime = Date.now() - startTime
    console.log(`[VBot TTS] Complete: ${totalTime}ms total (auth: ${authTime}ms, gemini: ${geminiTime}ms), output: ${outputData.length} bytes`)

    return new NextResponse(new Uint8Array(outputData), {
      status: 200,
      headers: {
        "Content-Type": outputMimeType,
        "Content-Length": outputData.length.toString(),
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("[VBot TTS Error]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
