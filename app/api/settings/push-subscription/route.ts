import { NextResponse } from "next/server"

// This endpoint is not currently used - push subscriptions are handled via server actions
export async function POST() {
  return NextResponse.json(
    { error: "Push subscriptions are handled via server actions. Please use the settings page." },
    { status: 405 }
  )
}

