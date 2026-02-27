import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { getDeepgramClient } from "@/lib/deepgram"

export async function POST() {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "token")
    if (!allowed) return rateLimitResponse()

    if (!process.env.DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: "Deepgram API key not configured" },
        { status: 500 }
      )
    }

    const deepgram = getDeepgramClient()
    const { result, error } = await deepgram.auth.grantToken({
      // Long enough for typical consultation sessions while still rotating credentials.
      ttl_seconds: 60 * 60,
    })

    if (error || !result?.access_token) {
      return NextResponse.json(
        { error: "Failed to generate Deepgram temporary token" },
        { status: 502 }
      )
    }

    logAudit({ userId: user.id, action: "READ", resource: "deepgram_token" })
    return NextResponse.json({
      token: result.access_token,
      tokenType: "bearer",
      expiresIn: result.expires_in,
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    )
  }
}
