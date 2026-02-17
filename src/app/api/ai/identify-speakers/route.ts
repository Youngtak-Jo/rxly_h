import { NextResponse } from "next/server"
import { generateText } from "ai"
import { DEFAULT_MODEL } from "@/lib/xai"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import { SPEAKER_IDENTIFICATION_PROMPT } from "@/lib/prompts"
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

    const { utterances, model: modelOverride } = await req.json()

    if (!utterances?.length) {
      return errorResponse("No utterances provided", 400)
    }

    // Format utterances with raw speaker IDs for analysis
    const formatted = utterances
      .map(
        (u: { speakerId: number; text: string }) =>
          `[speaker_${u.speakerId}]: ${u.text}`
      )
      .join("\n")

    const modelId = modelOverride || DEFAULT_MODEL
    if (!isSupportedModel(modelId)) {
      return errorResponse("Unsupported model id", 400)
    }

    const { text } = await generateText({
      model: getModel(modelId),
      system: SPEAKER_IDENTIFICATION_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze these transcript utterances and identify the doctor and patient:\n\n${formatted}`,
        },
      ],
      ...buildGenerationOptions(modelId, { temperature: 0.1 }),
    })

    const parsedResult = safeParseAIJson<unknown>(text)
    if (parsedResult.error) {
      logger.error("Speaker identification: AI returned invalid JSON")
      return NextResponse.json({ error: "AI returned invalid response format" }, { status: 502 })
    }
    const parsed = parsedResult.data

    logAudit({ userId: user.id, action: "READ", resource: "ai_speakers" })
    return Response.json(parsed)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Speaker identification error:", error)
    return errorResponse("Failed to identify speakers", 500)
  }
}
