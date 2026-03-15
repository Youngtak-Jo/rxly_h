import { NextResponse } from "next/server"
import { generateText } from "ai"
import { logger } from "@/lib/logger"
import { CLAUDE_MODEL } from "@/lib/anthropic"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { errorResponse } from "@/lib/api-response"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import {
  buildDdxSystemPrompt,
  buildDdxUserPrompt,
  parseDdxResponse,
} from "@/lib/ai/ddx-generator"
import { withAiTelemetry } from "@/lib/telemetry/ai"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const {
      transcript,
      doctorNotes,
      currentInsights,
      currentDiagnoses,
      enabledConnectors,
      model: modelOverride,
      customInstructions,
      sessionId,
    } = await req.json()

    if (!transcript?.trim() && !doctorNotes?.trim()) {
      return errorResponse("No transcript or notes provided", 400)
    }

    // Need at least some clinical context (insights) to generate meaningful DDx
    if (!currentInsights?.summary && !currentInsights?.keyFindings?.length) {
      return errorResponse("No insights context available yet", 400)
    }

    const modelId = modelOverride || CLAUDE_MODEL
    if (!isSupportedModel(modelId)) {
      return errorResponse("Unsupported model id", 400)
    }
    const model = getModel(modelId)

    const userPrompt = await buildDdxUserPrompt(
      {
        transcript,
        doctorNotes,
        currentInsights,
        currentDiagnoses,
        enabledConnectors,
        customInstructions,
      },
      modelId
    )
    const systemPrompt = buildDdxSystemPrompt(customInstructions)

    const text = await withAiTelemetry(
      {
        userId: user.id,
        sessionId: typeof sessionId === "string" ? sessionId : null,
        feature: "ai_ddx",
        model: modelId,
      },
      async () => {
        const result = await generateText({
          model,
          system: systemPrompt,
          prompt: userPrompt,
          ...buildGenerationOptions(modelId, { temperature: 0.3 }),
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

    let diagnoses
    try {
      diagnoses = parseDdxResponse(text)
    } catch {
      logger.error("DDx: AI returned invalid JSON")
      return NextResponse.json({ error: "AI returned invalid response format" }, { status: 502 })
    }

    logAudit({ userId: user.id, action: "READ", resource: "ai_ddx" })
    return Response.json({ diagnoses })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("DDx generation error:", error)
    return errorResponse("Failed to generate differential diagnosis", 500)
  }
}
