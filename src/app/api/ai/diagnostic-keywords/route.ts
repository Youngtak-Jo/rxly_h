import { NextResponse } from "next/server"
import { generateText } from "ai"
import { DEFAULT_MODEL } from "@/lib/xai"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import { DIAGNOSTIC_KEYWORDS_PROMPT } from "@/lib/prompts"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { errorResponse } from "@/lib/api-response"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import { safeParseAIJson } from "@/lib/validations"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const { transcript, model: modelOverride } = await req.json()

    if (!transcript?.trim()) {
      return errorResponse("No transcript provided", 400)
    }

    const modelId = modelOverride || DEFAULT_MODEL
    if (!isSupportedModel(modelId)) {
      return errorResponse("Unsupported model id", 400)
    }

    const { text } = await generateText({
      model: getModel(modelId),
      system: DIAGNOSTIC_KEYWORDS_PROMPT,
      messages: [
        {
          role: "user",
          content: `Extract diagnostic keywords from this consultation transcript:\n\n${transcript}`,
        },
      ],
      ...buildGenerationOptions(modelId, {
        temperature: 0.1,
        maxOutputTokens: 1000,
      }),
    })

    const parsedResult = safeParseAIJson<unknown>(text)
    if (parsedResult.error) {
      logger.error("Diagnostic keywords: AI returned invalid JSON")
      return NextResponse.json({ error: "AI returned invalid response format" }, { status: 502 })
    }
    const parsed = parsedResult.data

    if (!Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid response format" }, { status: 502 })
    }

    logAudit({ userId: user.id, action: "READ", resource: "ai_keywords" })
    return Response.json(parsed)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Diagnostic keyword extraction error:", error)
    return errorResponse("Failed to extract keywords", 500)
  }
}
