import { NextResponse } from "next/server"

// This endpoint is not currently used - profile updates are handled via server actions
export async function POST() {
  return NextResponse.json(
    { error: "Profile updates are handled via server actions. Please use the settings page." },
    { status: 405 }
  )
}

