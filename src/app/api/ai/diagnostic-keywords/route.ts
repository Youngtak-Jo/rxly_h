import { NextResponse } from "next/server"
import { generateText } from "ai"
import { DEFAULT_MODEL } from "@/lib/xai"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import {
  buildDiagnosticKeywordsPrompt,
  buildDiagnosticKeywordsSystemPrompt,
  parseDiagnosticKeywordsResponse,
} from "@/lib/ai/diagnostic-keywords-generator"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { errorResponse } from "@/lib/api-response"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import { withAiTelemetry } from "@/lib/telemetry/ai"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const { transcript, model: modelOverride, sessionId } = await req.json()

    if (!transcript?.trim()) {
      return errorResponse("No transcript provided", 400)
    }

    const modelId = modelOverride || DEFAULT_MODEL
    if (!isSupportedModel(modelId)) {
      return errorResponse("Unsupported model id", 400)
    }

    const text = await withAiTelemetry(
      {
        userId: user.id,
        sessionId: typeof sessionId === "string" ? sessionId : null,
        feature: "ai_keywords",
        model: modelId,
      },
      async () => {
        const result = await generateText({
          model: getModel(modelId),
          system: buildDiagnosticKeywordsSystemPrompt(),
          messages: [
            {
              role: "user",
              content: buildDiagnosticKeywordsPrompt(transcript),
            },
          ],
          ...buildGenerationOptions(modelId, {
            temperature: 0.1,
            maxOutputTokens: 1000,
          }),
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

    try {
      const parsed = parseDiagnosticKeywordsResponse(text)
      logAudit({ userId: user.id, action: "READ", resource: "ai_keywords" })
      return Response.json(parsed)
    } catch {
      logger.error("Diagnostic keywords: AI returned invalid JSON")
      return NextResponse.json({ error: "AI returned invalid response format" }, { status: 502 })
    }
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Diagnostic keyword extraction error:", error)
    return errorResponse("Failed to extract keywords", 500)
  }
}
