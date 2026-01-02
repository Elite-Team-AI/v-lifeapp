import { NextResponse } from "next/server"

// This endpoint is not currently used - notifications are handled via server actions
export async function POST() {
  return NextResponse.json(
    { error: "Notification preferences are handled via server actions. Please use the settings page." },
    { status: 405 }
  )
}

