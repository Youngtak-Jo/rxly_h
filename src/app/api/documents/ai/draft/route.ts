import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { requireAuth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import {
  documentAiDraftSchema,
  documentTemplateCreateSchema,
} from "@/lib/documents/schema"
import { buildFallbackDocumentDraft } from "@/lib/documents/fallback-draft"
import { DOCUMENT_CATEGORIES } from "@/lib/documents/categories"
import { ensureRepeatableItemLabels } from "@/lib/documents/repeatable-item-label"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import { DEFAULT_MODEL } from "@/lib/xai"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import { withAiTelemetry } from "@/lib/telemetry/ai"
import { logAudit } from "@/lib/audit"

function buildBuilderSystemPrompt() {
  return [
    "You design structured medical document templates for clinicians.",
    "Return a JSON object only.",
    "Renderer is always GENERIC_STRUCTURED.",
    "Include template language and region in the response.",
    "Language must be one of: en, ko.",
    "Region must be one of: global, kr, us.",
    "Use only field types shortText, longText, stringList and group types group, repeatableGroup.",
    "For repeatableGroup nodes, label names the whole repeating section and itemLabel names one repeated entry such as Claim item, Service line, or Problem.",
    "Whenever you use repeatableGroup, include itemLabel.",
    "Keys must be snake_case and unique across the whole schema.",
    "Keep schema depth <= 3 and total leaf fields <= 60.",
    "Favor structured sections that are practical for real-world clinical workflows, including region-specific regulations if requested.",
    "For publishability, description must explain the document purpose and usage context in 1-2 sentences.",
    "Do not mention prompts, generation process, or fallback behavior in description.",
    `Category must be one of: ${DOCUMENT_CATEGORIES.join(", ")}.`,
  ].join("\n")
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth()
    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const parsed = documentAiDraftSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 })
    }

    const modelId = parsed.data.model || DEFAULT_MODEL
    if (!isSupportedModel(modelId)) {
      return NextResponse.json({ error: "Unsupported model id" }, { status: 400 })
    }
    const model = getModel(modelId)

    let result
    try {
      result = await withAiTelemetry(
        {
          userId: user.id,
          sessionId: null,
          feature: "ai_document",
          model: modelId,
        },
        async () => {
          const generated = await generateObject({
            model,
            schema: documentTemplateCreateSchema,
            system: buildBuilderSystemPrompt(),
            prompt: [
              `Default language: ${parsed.data.defaultLanguage}`,
              `Default region: ${parsed.data.defaultRegion}`,
              "Infer language/region only if the request clearly specifies them. Otherwise use the provided defaults.",
              "",
              parsed.data.prompt,
            ].join("\n"),
            ...buildGenerationOptions(modelId, { temperature: 0.2 }),
          })

          return {
            result: {
              ...generated.object,
              schema: ensureRepeatableItemLabels(generated.object.schema),
            },
            usage: generated.usage
              ? {
                  inputTokens: generated.usage.inputTokens,
                  outputTokens: generated.usage.outputTokens,
                }
              : undefined,
          }
        }
      )
    } catch (error) {
      logger.warn("AI document draft generation failed, using fallback draft", {
        error: error instanceof Error ? error.message : String(error),
        modelId,
      })
      result = buildFallbackDocumentDraft(parsed.data.prompt, {
        defaultLanguage: parsed.data.defaultLanguage,
        defaultRegion: parsed.data.defaultRegion,
      })
    }

    logAudit({
      userId: user.id,
      action: "READ",
      resource: "ai_document",
      metadata: { mode: "draft_builder" },
    })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to build AI document draft", error)
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to build AI document draft",
      },
      { status: 500 }
    )
  }
}
