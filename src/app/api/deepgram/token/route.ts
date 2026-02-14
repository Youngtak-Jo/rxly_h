import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

export async function POST() {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "token")
    if (!allowed) return rateLimitResponse()

    const apiKey = process.env.DEEPGRAM_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "Deepgram API key not configured" },
        { status: 500 }
      )
    }

    logAudit({ userId: user.id, action: "READ", resource: "deepgram_token" })
    return NextResponse.json({ token: apiKey })
  } catch (error) {
    if (error instanceof NextResponse) return error
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    )
  }
}
