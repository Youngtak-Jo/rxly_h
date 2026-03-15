import { NextResponse } from "next/server"
import { streamText } from "ai"
import { logger } from "@/lib/logger"
import { DEFAULT_MODEL } from "@/lib/xai"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import {
  buildInsightsGenerationContent,
  buildInsightsSystemPrompt,
} from "@/lib/ai/insights-generator"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { errorResponse } from "@/lib/api-response"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import { withAiTelemetry } from "@/lib/telemetry/ai"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const {
      transcript,
      doctorNotes,
      newImageUrls,
      previousImageFindings,
      mode,
      previousSummary,
      inlineComments,
      currentInsights,
      model: modelOverride,
      customInstructions,
      sessionId,
    } = await req.json()

    const hasNewImages = newImageUrls && newImageUrls.length > 0
    const hasInlineComments = inlineComments && inlineComments.length > 0

    if (
      !transcript?.trim() &&
      !doctorNotes?.trim() &&
      !hasNewImages &&
      !hasInlineComments
    ) {
      return errorResponse("No transcript, notes, or images provided", 400)
    }

    const modelId = modelOverride || DEFAULT_MODEL
    if (!isSupportedModel(modelId)) {
      return errorResponse("Unsupported model id", 400)
    }
    const model = getModel(modelId)

    const content = buildInsightsGenerationContent({
      transcript,
      doctorNotes,
      newImageUrls,
      previousImageFindings,
      mode,
      previousSummary,
      inlineComments,
      currentInsights,
      customInstructions,
    })
    const systemPrompt = buildInsightsSystemPrompt(customInstructions)

    const response = await withAiTelemetry(
      {
        userId: user.id,
        sessionId: typeof sessionId === "string" ? sessionId : null,
        feature: "ai_insights",
        model: modelId,
      },
      async () => {
        const result = streamText({
          model,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content,
            },
          ],
          ...buildGenerationOptions(modelId, { temperature: 0.3 }),
        })

        return { result: result.toTextStreamResponse() }
      }
    )

    logAudit({ userId: user.id, action: "READ", resource: "ai_insights" })
    return response
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Insights generation error:", error)
    return errorResponse("Failed to generate insights", 500)
  }
}
