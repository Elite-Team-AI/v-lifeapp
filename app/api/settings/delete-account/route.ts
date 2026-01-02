import { NextResponse } from "next/server"

// This endpoint is not currently used - delete account is handled via server actions
export async function POST() {
  return NextResponse.json(
    { error: "Delete account is handled via server actions. Please use the settings page." },
    { status: 405 }
  )
}

