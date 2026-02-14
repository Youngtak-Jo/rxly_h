import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

export async function POST() {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "token")
    if (!allowed) return rateLimitResponse()

    const apiKey = process.env.DEEPGRAM_API_KEY
    const projectId = process.env.DEEPGRAM_PROJECT_ID

    if (!apiKey) {
      return NextResponse.json(
        { error: "Deepgram API key not configured" },
        { status: 500 }
      )
    }

    // Use temporary key API if project ID is configured, otherwise fall back to API key
    if (projectId) {
      const response = await fetch(
        `https://api.deepgram.com/v1/projects/${projectId}/keys`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            comment: `temp-key-${Date.now()}`,
            scopes: ["usage:write"],
            time_to_live_in_seconds: 30,
          }),
        }
      )

      if (!response.ok) {
        logger.error("Failed to create Deepgram temp key:", {
          status: response.status,
        })
        return NextResponse.json(
          { error: "Failed to create temporary token" },
          { status: 500 }
        )
      }

      const data = await response.json()
      logAudit({ userId: user.id, action: "READ", resource: "deepgram_token" })
      return NextResponse.json({ token: data.key })
    }

    // Fail closed: never expose the raw API key to the client
    logger.error("DEEPGRAM_PROJECT_ID not configured. Cannot create temporary key.")
    return NextResponse.json(
      { error: "Speech-to-text is not configured properly. Contact support." },
      { status: 503 }
    )
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Deepgram token error:", error)
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    )
  }
}
