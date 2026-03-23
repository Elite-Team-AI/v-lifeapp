import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

/**
 * Diagnostic endpoint to test AI provider configuration
 * GET /api/workouts/test-ai-config
 */
export async function GET(request: NextRequest) {
  const results = {
    openai: {
      configured: false,
      working: false,
      error: null as string | null
    },
    anthropic: {
      configured: false,
      working: false,
      error: null as string | null
    },
    timestamp: new Date().toISOString()
  }

  // Test OpenAI
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    results.openai.configured = true
    try {
      const openai = new OpenAI({ apiKey: openaiKey })
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 10
      })
      results.openai.working = true
    } catch (error: any) {
      results.openai.error = error.message
    }
  }

  // Test Anthropic
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    results.anthropic.configured = true
    try {
      const anthropic = new Anthropic({ apiKey: anthropicKey })
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "OK"' }]
      })
      results.anthropic.working = true
    } catch (error: any) {
      results.anthropic.error = error.message
    }
  }

  return NextResponse.json(results)
}
