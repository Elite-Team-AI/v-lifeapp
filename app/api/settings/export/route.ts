import { NextResponse } from "next/server"

// This endpoint is not currently used - export is handled via server actions
export async function GET() {
  return NextResponse.json(
    { error: "Export data is handled via server actions. Please use the settings page." },
    { status: 405 }
  )
}

