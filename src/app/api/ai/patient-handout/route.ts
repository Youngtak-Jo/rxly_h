import { NextResponse } from "next/server"
import { generateText } from "ai"
import { DEFAULT_MODEL } from "@/lib/xai"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import {
  buildPatientHandoutPrompt,
  buildPatientHandoutSystemPrompt,
  normalizePatientHandoutResponse,
} from "@/lib/ai/patient-handout-generator"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { errorResponse } from "@/lib/api-response"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import { safeParseAIJson } from "@/lib/validations"
import { logger } from "@/lib/logger"
import type { PatientHandoutCondition } from "@/types/patient-handout"
import { withAiTelemetry } from "@/lib/telemetry/ai"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const {
      transcript,
      doctorNotes,
      insights,
      diagnoses,
      selectedConditions,
      language,
      model: modelOverride,
      customInstructions,
      sessionId,
    } = (await req.json()) as {
      transcript?: string
      doctorNotes?: string
      insights?: unknown
      diagnoses?: unknown
      selectedConditions?: PatientHandoutCondition[]
      language?: "ko" | "en"
      model?: string
      customInstructions?: string
      sessionId?: string
    }

    if (!selectedConditions || selectedConditions.length === 0) {
      return errorResponse("No selected conditions provided", 400)
    }

    const modelId = modelOverride || DEFAULT_MODEL
    if (!isSupportedModel(modelId)) {
      return errorResponse("Unsupported model id", 400)
    }

    const model = getModel(modelId)
    const prompt = buildPatientHandoutPrompt({
      transcript,
      doctorNotes,
      insights,
      diagnoses,
      selectedConditions,
      language,
      customInstructions,
    })

    const text = await withAiTelemetry(
      {
        userId: user.id,
        sessionId: typeof sessionId === "string" ? sessionId : null,
        feature: "ai_patient_handout",
        model: modelId,
      },
      async () => {
        const result = await generateText({
          model,
          system: buildPatientHandoutSystemPrompt(customInstructions),
          prompt,
          ...buildGenerationOptions(modelId, { temperature: 0.2 }),
        })

        return {
          result: result.text,
          usage: result.usage
            ? {
                inputTokens: result.usage.inputTokens,
                outputTokens: result.usage.outputTokens,
              }
            : undefined,
        }
      }
    )

    const parsedResult = safeParseAIJson<{
      language?: string
      conditions?: unknown
      entries?: unknown
    }>(text)
    if (parsedResult.error || !parsedResult.data) {
      return errorResponse("AI returned invalid response format", 502)
    }

    const response = normalizePatientHandoutResponse(
      selectedConditions,
      parsedResult.data
    )

    logAudit({ userId: user.id, action: "READ", resource: "ai_patient_handout" })
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Patient handout generation error:", error)
    return errorResponse("Failed to generate patient handout", 500)
  }
}
