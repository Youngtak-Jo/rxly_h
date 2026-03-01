import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { getDeepgramClient } from "@/lib/deepgram"

function shouldFallbackToApiKey(status?: number): boolean {
  return process.env.NODE_ENV !== "production" && status === 403
}

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
      const detail = error instanceof Error ? error.message : undefined
      const upstreamStatus =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof error.status === "number"
          ? error.status
          : undefined

      console.error("Deepgram temporary token grant failed", {
        detail,
        upstreamStatus,
      })

      if (shouldFallbackToApiKey(upstreamStatus)) {
        logAudit({ userId: user.id, action: "READ", resource: "deepgram_token" })
        return NextResponse.json({
          token: process.env.DEEPGRAM_API_KEY,
          tokenType: "token",
          fallback: "api-key",
        })
      }

      return NextResponse.json(
        {
          error: "Failed to generate Deepgram temporary token",
          detail,
          upstreamStatus,
        },
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
    if (error instanceof Response) return error

    console.error("Deepgram token route failed", error)

    return NextResponse.json(
      {
        error: "Failed to generate token",
        detail: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
