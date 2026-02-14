import { NextResponse } from "next/server"
import { generateText } from "ai"
import { DEFAULT_MODEL } from "@/lib/grok"
import { getModel } from "@/lib/ai-provider"
import { SINGLE_SPEAKER_CLASSIFICATION_PROMPT } from "@/lib/prompts"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { errorResponse } from "@/lib/api-response"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const { entries, context, model: modelOverride } = await req.json()

    if (!entries?.length) {
      return errorResponse("No entries provided", 400)
    }

    // Build prompt with optional context entries for conversation flow
    let content = ""

    if (context?.length) {
      const contextFormatted = context
        .map((e: { id: string; text: string }) => `[${e.id}]: ${e.text}`)
        .join("\n")
      content += `Context (already classified, for reference only):\n${contextFormatted}\n\n`
    }

    const entriesFormatted = entries
      .map((e: { id: string; text: string }) => `[${e.id}]: ${e.text}`)
      .join("\n")
    content += `Entries to classify:\n${entriesFormatted}`

    const { text } = await generateText({
      model: getModel(modelOverride || DEFAULT_MODEL),
      system: SINGLE_SPEAKER_CLASSIFICATION_PROMPT,
      messages: [
        {
          role: "user",
          content,
        },
      ],
      temperature: 0.1,
    })

    let parsed: unknown
    try {
      const cleaned = text
        .replace(/^```(?:json)?\s*\n?/, "")
        .replace(/\n?```\s*$/, "")
      parsed = JSON.parse(cleaned)
    } catch {
      logger.error("Single-speaker classification: AI returned invalid JSON")
      return NextResponse.json(
        { error: "AI returned invalid response format" },
        { status: 502 }
      )
    }

    logAudit({
      userId: user.id,
      action: "READ",
      resource: "ai_single_speaker",
    })
    return Response.json(parsed)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Single-speaker classification error:", error)
    return errorResponse("Failed to classify speakers", 500)
  }
}
