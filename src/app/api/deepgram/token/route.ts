import { NextResponse } from "next/server"

export async function POST() {
  const apiKey = process.env.DEEPGRAM_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: "Deepgram API key not configured" },
      { status: 500 }
    )
  }

  // Return the API key for WebSocket authentication.
  // In production, use Deepgram's temporary token API for better security.
  return NextResponse.json({ token: apiKey })
}
