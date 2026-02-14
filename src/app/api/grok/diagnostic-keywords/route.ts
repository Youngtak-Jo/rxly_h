import { NextResponse } from "next/server"
import { generateText } from "ai"
import { DEFAULT_MODEL } from "@/lib/grok"
import { getModel } from "@/lib/ai-provider"
import { DIAGNOSTIC_KEYWORDS_PROMPT } from "@/lib/prompts"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const { transcript, model: modelOverride } = await req.json()

    if (!transcript?.trim()) {
      return new Response("No transcript provided", { status: 400 })
    }

    const { text } = await generateText({
      model: getModel(modelOverride || DEFAULT_MODEL),
      system: DIAGNOSTIC_KEYWORDS_PROMPT,
      messages: [
        {
          role: "user",
          content: `Extract diagnostic keywords from this consultation transcript:\n\n${transcript}`,
        },
      ],
      temperature: 0.1,
      maxOutputTokens: 1000,
    })

    const cleaned = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "")
    const parsed = JSON.parse(cleaned)

    if (!Array.isArray(parsed)) {
      return new Response("Invalid response format", { status: 500 })
    }

    logAudit({ userId: user.id, action: "READ", resource: "ai_keywords" })
    return Response.json(parsed)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Diagnostic keyword extraction error:", error)
    return new Response("Failed to extract keywords", { status: 500 })
  }
}
