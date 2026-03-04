import { generateObject } from "ai"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import { DEFAULT_MODEL } from "@/lib/xai"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import { withAiTelemetry } from "@/lib/telemetry/ai"
import {
  buildDocumentContentSchema,
  normalizeDocumentContentForStorage,
} from "@/lib/documents/schema"
import { buildSampleDocumentContent } from "@/lib/documents/preview"
import { buildDocumentPreviewInputChecksum } from "@/lib/documents/preview-checksum"
import type { UiLocale } from "@/i18n/config"
import type { DocumentBuilderDraft } from "@/types/document"

function normalizePreviewLocale(locale: string): string {
  return locale.toLowerCase().startsWith("ko") ? "ko" : "en"
}

function buildPreviewSystemPrompt(args: {
  draft: DocumentBuilderDraft
  locale: string
}) {
  return [
    "You generate synthetic but realistic medical document previews.",
    "Imagine a plausible post-consultation scenario and fill the document as if it had just been generated for clinician review.",
    "Return only valid structured output matching the supplied schema plus a short case summary.",
    "Populate every field with specific, non-placeholder values whenever a realistic synthetic value can be inferred.",
    "For long-text fields, write complete concise content rather than fragments.",
    "For repeatable groups, vary the items meaningfully instead of duplicating the same phrasing.",
    "Do not use real PHI, real phone numbers, or real addresses.",
    "Keep the case clinically coherent.",
    "If the document is regulatory, billing, or administrative, produce values that look ready for that workflow.",
    "If the document is patient-facing, use plain language.",
    "If the document is clinician-facing, use concise clinical wording.",
    `Locale: ${args.locale}`,
    `Title: ${args.draft.title}`,
    `Description: ${args.draft.description}`,
    `Category: ${args.draft.category}`,
    `Audience: ${args.draft.generationConfig.audience}`,
    `Output tone: ${args.draft.generationConfig.outputTone}`,
    `Context sources: ${args.draft.generationConfig.contextSources.join(", ")}`,
    args.draft.generationConfig.systemInstructions
      ? `Template-specific instructions:\n${args.draft.generationConfig.systemInstructions}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n")
}

function buildPreviewPrompt(args: {
  draft: DocumentBuilderDraft
  locale: string
}) {
  return [
    "Document schema:",
    JSON.stringify(args.draft.schema, null, 2),
    "",
    "Generate:",
    "- previewCaseSummary: 2-3 sentences summarizing the synthetic case and why this document exists",
    "- previewContent: a complete structured document matching the schema",
    "- Avoid placeholders like 'sample value', 'TBD', or repeated billing codes in note fields unless the field itself is specifically a code field",
    "- If the template looks like a HIRA/EDI review workflow, use payer-review language, Korean claim-review terminology, and actionable submission guidance",
  ].join("\n")
}

function buildFallbackPreviewSnapshot(args: {
  draft: DocumentBuilderDraft
  locale: string
  modelId: string
  checksum: string
}) {
  const locale = normalizePreviewLocale(args.locale)
  return {
    previewContent: buildSampleDocumentContent(
      args.draft.schema,
      locale as UiLocale
    ) as Record<string, unknown>,
    previewCaseSummary:
      locale === "ko"
        ? `${args.draft.title} 문서가 실제 진료 후 생성된 상황을 가정한 예시 프리뷰입니다.`
        : `Synthetic post-consultation preview for ${args.draft.title}.`,
    previewLocale: locale,
    previewModelId: `${args.modelId}:fallback`,
    previewGeneratedAt: new Date().toISOString(),
    previewInputChecksum: args.checksum,
  }
}

export async function generateDocumentPreviewSnapshot(input: {
  userId: string
  draft: DocumentBuilderDraft
  locale: string
  model?: string
}) {
  const modelId = input.model || DEFAULT_MODEL
  if (!isSupportedModel(modelId)) {
    throw new Error("Unsupported model id")
  }

  const locale = normalizePreviewLocale(input.locale)
  const checksum = buildDocumentPreviewInputChecksum({
    title: input.draft.title,
    description: input.draft.description,
    category: input.draft.category,
    schema: input.draft.schema,
    generationConfig: input.draft.generationConfig,
    locale,
  })

  try {
    const model = getModel(modelId)
    const generated = await withAiTelemetry(
      {
        userId: input.userId,
        sessionId: null,
        feature: "ai_document",
        model: modelId,
      },
      async () => {
        const result = await generateObject({
          model,
          schema: z.object({
            previewCaseSummary: z.string().min(1).max(400),
            previewContent: buildDocumentContentSchema(input.draft.schema),
          }),
          system: buildPreviewSystemPrompt({
            draft: input.draft,
            locale,
          }),
          prompt: buildPreviewPrompt({
            draft: input.draft,
            locale,
          }),
          ...buildGenerationOptions(modelId, { temperature: 0.2 }),
        })

        return {
          result: result.object,
          usage: result.usage
            ? {
                inputTokens: result.usage.inputTokens,
                outputTokens: result.usage.outputTokens,
              }
            : undefined,
        }
      }
    )

    return {
      previewContent: normalizeDocumentContentForStorage(
        input.draft.schema,
        generated.previewContent
      ),
      previewCaseSummary: generated.previewCaseSummary,
      previewLocale: locale,
      previewModelId: modelId,
      previewGeneratedAt: new Date().toISOString(),
      previewInputChecksum: checksum,
    }
  } catch (error) {
    logger.warn("AI document preview generation failed, using fallback preview", {
      error: error instanceof Error ? error.message : String(error),
      modelId,
      title: input.draft.title,
    })

    return buildFallbackPreviewSnapshot({
      draft: input.draft,
      locale,
      modelId,
      checksum,
    })
  }
}
