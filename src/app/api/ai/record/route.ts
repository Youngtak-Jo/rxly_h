import { NextResponse } from "next/server"
import { streamObject } from "ai"
import { DEFAULT_MODEL } from "@/lib/xai"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import {
  buildRecordGenerationContent,
  buildRecordSystemPrompt,
  RECORD_OUTPUT_SCHEMA,
} from "@/lib/ai/record-generator"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { errorResponse } from "@/lib/api-response"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import { logger } from "@/lib/logger"
import { withAiTelemetry } from "@/lib/telemetry/ai"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const {
      transcript,
      doctorNotes,
      imageUrls,
      insights,
      existingRecord,
      sessionId,
      model: modelOverride,
      customInstructions,
    } = await req.json()

    if (!transcript?.trim() && !doctorNotes?.trim() && (!imageUrls || imageUrls.length === 0)) {
      return errorResponse("No transcript, notes, or images provided", 400)
    }

    const modelId = modelOverride || DEFAULT_MODEL
    if (!isSupportedModel(modelId)) {
      return errorResponse("Unsupported model id", 400)
    }
    const model = getModel(modelId)

    const content = buildRecordGenerationContent({
      transcript,
      doctorNotes,
      imageUrls,
      insights,
      existingRecord,
      customInstructions,
    })
    const systemPrompt = buildRecordSystemPrompt(customInstructions)

    const response = await withAiTelemetry(
      {
        userId: user.id,
        sessionId: typeof sessionId === "string" ? sessionId : null,
        feature: "ai_record",
        model: modelId,
      },
      async () => {
        const result = streamObject({
          model,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content,
            },
          ],
          ...buildGenerationOptions(modelId, { temperature: 0.2 }),
          schema: RECORD_OUTPUT_SCHEMA,
        })

        return {
          result: new Response(result.textStream, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          }),
        }
      }
    )

    logAudit({ userId: user.id, action: "READ", resource: "ai_record" })
    return response
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Record generation error:", error)
    return errorResponse("Failed to generate record", 500)
  }
}
