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
import { documentLanguageToUiLocale } from "@/lib/documents/language-region"

function buildPreviewSystemPrompt(args: {
  draft: DocumentBuilderDraft
  locale: string
}) {
  const regionInstruction =
    args.draft.region === "global"
      ? "Use globally applicable wording. Avoid country-specific regulatory assumptions unless the template explicitly asks for them."
      : args.draft.region === "kr"
        ? "Use Korean clinical and administrative conventions when region-specific details are relevant."
        : "Use United States clinical and administrative conventions when region-specific details are relevant."

  return [
    "You generate synthetic but realistic medical document previews.",
    "Imagine a plausible post-consultation scenario and fill the document as if it had just been generated for its intended document purpose.",
    "Return only valid structured output matching the supplied schema.",
    "Populate every field with specific, non-placeholder values whenever a realistic synthetic value can be inferred.",
    "For long-text fields, write complete concise content rather than fragments.",
    "For repeatable groups, vary the items meaningfully instead of duplicating the same phrasing.",
    "Do not use real PHI, real phone numbers, or real addresses.",
    "Keep the case clinically coherent.",
    "If the document is regulatory, billing, or administrative, produce values that look ready for that workflow.",
    "Use the title, description, category, schema, and system instructions to infer the document's intended use and writing style.",
    "If the document is patient-facing, use plain language.",
    "If the document is clinician-facing, use concise clinical wording.",
    `Document language: ${args.draft.language}`,
    `Document region: ${args.draft.region}`,
    `Preview language: ${args.locale}`,
    `Title: ${args.draft.title}`,
    `Description: ${args.draft.description}`,
    `Category: ${args.draft.category}`,
    `Context sources: ${args.draft.generationConfig.contextSources.join(", ")}`,
    regionInstruction,
    args.draft.generationConfig.systemInstructions
      ? `Template-specific instructions:\n${args.draft.generationConfig.systemInstructions}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n")
}

function buildPreviewPrompt(args: { draft: DocumentBuilderDraft }) {
  return [
    "Document schema:",
    JSON.stringify(args.draft.schema, null, 2),
    "",
    "Generate:",
    "- previewContent: a complete structured document matching the schema",
    "- Avoid placeholders like 'sample value', 'TBD', or repeated billing codes in note fields unless the field itself is specifically a code field",
    "- If the template looks like a HIRA/EDI review workflow, use payer-review language, Korean claim-review terminology, and actionable submission guidance",
    args.draft.region === "global"
      ? "- Keep the content globally reusable rather than tied to one country's forms or regulations"
      : "",
  ].join("\n")
}

function buildFallbackPreviewSnapshot(args: {
  draft: DocumentBuilderDraft
  modelId: string
  checksum: string
}) {
  const locale = documentLanguageToUiLocale(args.draft.language)
  return {
    previewContent: buildSampleDocumentContent(
      args.draft.schema,
      locale as UiLocale
    ) as Record<string, unknown>,
    previewLocale: locale,
    previewModelId: `${args.modelId}:fallback`,
    previewGeneratedAt: new Date().toISOString(),
    previewInputChecksum: args.checksum,
  }
}

export async function generateDocumentPreviewSnapshot(input: {
  userId: string
  draft: DocumentBuilderDraft
  model?: string
}) {
  const modelId = input.model || DEFAULT_MODEL
  if (!isSupportedModel(modelId)) {
    throw new Error("Unsupported model id")
  }

  const locale = documentLanguageToUiLocale(input.draft.language)
  const checksum = buildDocumentPreviewInputChecksum({
    title: input.draft.title,
    description: input.draft.description,
    category: input.draft.category,
    language: input.draft.language,
    region: input.draft.region,
    schema: input.draft.schema,
    generationConfig: input.draft.generationConfig,
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
            previewContent: buildDocumentContentSchema(input.draft.schema),
          }),
          system: buildPreviewSystemPrompt({
            draft: input.draft,
            locale,
          }),
          prompt: buildPreviewPrompt({ draft: input.draft }),
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
      modelId,
      checksum,
    })
  }
}
