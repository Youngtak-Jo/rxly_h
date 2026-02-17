import { NextResponse } from "next/server"
import { streamText, type ModelMessage } from "ai"
import { logger } from "@/lib/logger"
import { DEFAULT_MODEL } from "@/lib/xai"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import { AI_DOCTOR_SYSTEM_PROMPT } from "@/lib/prompts"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { errorResponse } from "@/lib/api-response"
import { buildGenerationOptions } from "@/lib/ai-request-options"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const { messages, model: modelOverride } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return errorResponse("No messages provided", 400)
    }

    const modelId = modelOverride || DEFAULT_MODEL
    if (!isSupportedModel(modelId)) {
      return errorResponse("Unsupported model id", 400)
    }
    const model = getModel(modelId)

    const result = streamText({
      model,
      system: AI_DOCTOR_SYSTEM_PROMPT,
      // content can be a plain string or multimodal array [{type:"text",...},{type:"image",...}]
      messages: messages as ModelMessage[],
      ...buildGenerationOptions(modelId, { temperature: 0.4 }),
    })

    logAudit({ userId: user.id, action: "READ", resource: "ai_doctor" })

    return result.toTextStreamResponse()
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("AI Doctor generation error:", error)
    return errorResponse("Failed to generate AI doctor response", 500)
  }
}
