import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET() {
  return NextResponse.json({
    openai_key_exists: !!env.OPENAI_API_KEY,
    openai_key_prefix: env.OPENAI_API_KEY?.substring(0, 20) || 'NOT SET',
    supabase_url_exists: !!env.NEXT_PUBLIC_SUPABASE_URL,
  })
}
