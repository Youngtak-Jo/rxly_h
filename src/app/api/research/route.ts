import { NextResponse } from "next/server"
import { streamText } from "ai"
import { logger } from "@/lib/logger"
import { CLAUDE_MODEL } from "@/lib/anthropic"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { errorResponse } from "@/lib/api-response"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import {
  buildResearchMessages,
  buildResearchSystemPrompt,
} from "@/lib/ai/research-generator"
import { withAiTelemetry } from "@/lib/telemetry/ai"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const { question, conversationHistory, enabledConnectors, insightsContext, imageUrls, model: modelOverride, customInstructions, sessionId } =
      await req.json()

    const requestedImageUrls = Array.isArray(imageUrls)
      ? imageUrls.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
      : []
    const effectiveQuestion =
      typeof question === "string" && question.trim()
        ? question.trim()
        : requestedImageUrls.length > 0
          ? "Analyze the attached medical image(s) in a research context."
          : ""

    if (!effectiveQuestion) {
      return errorResponse("No question provided", 400)
    }

    const modelId = modelOverride || CLAUDE_MODEL
    if (!isSupportedModel(modelId)) {
      return errorResponse("Unsupported model id", 400)
    }
    const model = getModel(modelId)

    const messages = await buildResearchMessages(
      {
        question: effectiveQuestion,
        conversationHistory,
        enabledConnectors,
        insightsContext,
        imageUrls: requestedImageUrls,
        customInstructions,
      },
      modelId
    )
    const systemPrompt = buildResearchSystemPrompt(
      effectiveQuestion,
      customInstructions
    )

    const response = await withAiTelemetry(
      {
        userId: user.id,
        sessionId: typeof sessionId === "string" ? sessionId : null,
        feature: "ai_research",
        model: modelId,
      },
      async () => {
        const result = streamText({
          model,
          system: systemPrompt,
          messages,
          ...buildGenerationOptions(modelId, { temperature: 0.3 }),
        })

        return { result: result.toTextStreamResponse() }
      }
    )

    logAudit({ userId: user.id, action: "READ", resource: "ai_research" })
    return response
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Research generation error:", error)
    return errorResponse("Failed to generate research response", 500)
  }
}
