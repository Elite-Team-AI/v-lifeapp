import { NextResponse } from "next/server"
import { env } from "@/lib/env"

export async function GET() {
  return NextResponse.json({
    envCheck: {
      SUPABASE_SERVICE_ROLE_KEY_exists: !!env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_SERVICE_ROLE_KEY_length: env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      SUPABASE_SERVICE_ROLE_KEY_preview: env.SUPABASE_SERVICE_ROLE_KEY
        ? `${env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`
        : "NOT SET",
      NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
      processEnvCheck: {
        SUPABASE_SERVICE_ROLE_KEY_raw: process.env.SUPABASE_SERVICE_ROLE_KEY
          ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`
          : "NOT SET"
      }
    }
  })
}
