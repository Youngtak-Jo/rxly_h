import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { requireAuth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import {
  documentAiReviseSchema,
  documentTemplateCreateSchema,
} from "@/lib/documents/schema"
import { buildFallbackRevisedDocumentDraft } from "@/lib/documents/fallback-draft"
import { DOCUMENT_CATEGORIES } from "@/lib/documents/categories"
import { ensureRepeatableItemLabels } from "@/lib/documents/repeatable-item-label"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import { DEFAULT_MODEL } from "@/lib/xai"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import { withAiTelemetry } from "@/lib/telemetry/ai"
import { logAudit } from "@/lib/audit"

const systemPrompt = [
  "You revise structured medical document templates.",
  "Preserve valid existing structure when possible and only change what the user asks.",
  "Return JSON only.",
  "Preserve language and region unless the revision request clearly changes them.",
  "For repeatableGroup nodes, label names the overall repeating section and itemLabel names one repeated entry.",
  "Preserve existing itemLabel values unless the user asks to change them, and include itemLabel on every repeatableGroup.",
  "Language must be one of: en, ko.",
  "Region must be one of: global, kr, us.",
  "Keep description focused on document purpose and workflow context.",
  "Do not mention prompts, generation process, or fallback behavior in description.",
  `Category must be one of: ${DOCUMENT_CATEGORIES.join(", ")}.`,
].join("\n")

export async function POST(
  req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  await params
  try {
    const user = await requireAuth()
    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const parsed = documentAiReviseSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid revise payload" }, { status: 400 })
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
            system: systemPrompt,
            prompt: [
              `Revision request:\n${parsed.data.prompt}`,
              `Current draft:\n${JSON.stringify(parsed.data.draft)}`,
            ].join("\n\n"),
            ...buildGenerationOptions(modelId, { temperature: 0.15 }),
          })

          return {
            result: {
              ...generated.object,
              schema: ensureRepeatableItemLabels(
                generated.object.schema,
                parsed.data.draft.schema
              ),
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
      logger.warn("AI document draft revise failed, using fallback draft", {
        error: error instanceof Error ? error.message : String(error),
        modelId,
      })
      result = buildFallbackRevisedDocumentDraft(
        parsed.data.prompt,
        parsed.data.draft
      )
    }

    logAudit({
      userId: user.id,
      action: "READ",
      resource: "ai_document",
      metadata: { mode: "revise" },
    })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to revise AI document draft", error)
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to revise AI document draft",
      },
      { status: 500 }
    )
  }
}
