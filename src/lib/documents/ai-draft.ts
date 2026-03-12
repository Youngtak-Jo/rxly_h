"use server"

import { generateObject } from "ai"
import { logger } from "@/lib/logger"
import { ensureDocumentGenerationRequirements } from "@/lib/documents/generation-requirements"
import { buildFallbackDocumentDraft } from "@/lib/documents/fallback-draft"
import { DOCUMENT_CATEGORIES } from "@/lib/documents/categories"
import { createDocumentGenerationConfig } from "@/lib/documents/generation-config"
import { ensureRepeatableItemLabels } from "@/lib/documents/repeatable-item-label"
import { documentTemplateCreateSchema } from "@/lib/documents/schema"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import { DEFAULT_MODEL } from "@/lib/xai"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import { withAiTelemetry } from "@/lib/telemetry/ai"
import type {
  DocumentBuilderDraft,
  DocumentClinicalContextMode,
  DocumentTemplateLanguage,
  DocumentTemplateRegion,
} from "@/types/document"

function buildBuilderSystemPrompt(input?: {
  quickDocument?: boolean
  availableClinicalContextModes?: DocumentClinicalContextMode[]
}) {
  const availableModes: DocumentClinicalContextMode[] =
    input?.availableClinicalContextModes?.length &&
    input.availableClinicalContextModes.length > 0
      ? input.availableClinicalContextModes
      : ["insights", "transcript"]

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
    `generationConfig.clinicalContextDefault must be one of: ${availableModes.join(", ")}.`,
    "generationConfig.includeSourceImages must be true only when the template needs original uploaded images as multimodal input.",
    input?.quickDocument
      ? "This template will be generated immediately without extra clinician review, so generationConfig.generationRequirements must be an empty array."
      : "generationConfig.generationRequirements may be omitted unless the template explicitly requires a clinician confirmation step before generation.",
    "Do not mention prompts, generation process, or fallback behavior in description.",
    `Category must be one of: ${DOCUMENT_CATEGORIES.join(", ")}.`,
  ]
    .filter(Boolean)
    .join("\n")
}

function finalizeDraft(
  draft: DocumentBuilderDraft,
  input: {
    quickDocument?: boolean
    availableClinicalContextModes?: DocumentClinicalContextMode[]
  }
): DocumentBuilderDraft {
  const availableModes: DocumentClinicalContextMode[] =
    input.availableClinicalContextModes && input.availableClinicalContextModes.length > 0
      ? input.availableClinicalContextModes
      : ["insights", "transcript"]
  const normalizedClinicalContextDefault = availableModes.includes(
    draft.generationConfig.clinicalContextDefault
  )
    ? draft.generationConfig.clinicalContextDefault
    : (availableModes[0] ?? "insights")

  const baseDraft = {
    ...draft,
    schema: ensureRepeatableItemLabels(draft.schema),
    generationConfig: createDocumentGenerationConfig({
      ...draft.generationConfig,
      clinicalContextDefault: normalizedClinicalContextDefault,
      generationRequirements: input.quickDocument
        ? []
        : draft.generationConfig.generationRequirements,
    }),
  }

  if (input.quickDocument) {
    return baseDraft
  }

  return {
    ...baseDraft,
    generationConfig: ensureDocumentGenerationRequirements({
      category: baseDraft.category,
      schema: baseDraft.schema,
      generationConfig: baseDraft.generationConfig,
    }),
  }
}

export async function generateDocumentBuilderDraft(input: {
  userId: string
  prompt: string
  defaultLanguage: DocumentTemplateLanguage
  defaultRegion: DocumentTemplateRegion
  model?: string
  quickDocument?: boolean
  availableClinicalContextModes?: DocumentClinicalContextMode[]
  promptContext?: string[]
}): Promise<DocumentBuilderDraft> {
  const modelId = input.model || DEFAULT_MODEL
  if (!isSupportedModel(modelId)) {
    throw new Error("Unsupported model id")
  }

  const model = getModel(modelId)

  try {
    const result = await withAiTelemetry<DocumentBuilderDraft>(
      {
        userId: input.userId,
        sessionId: null,
        feature: "ai_document",
        model: modelId,
      },
      async () => {
        const generated = await generateObject({
          model,
          schema: documentTemplateCreateSchema,
          system: buildBuilderSystemPrompt({
            quickDocument: input.quickDocument,
            availableClinicalContextModes: input.availableClinicalContextModes,
          }),
          prompt: [
            `Default language: ${input.defaultLanguage}`,
            `Default region: ${input.defaultRegion}`,
            "Infer language/region only if the request clearly specifies them. Otherwise use the provided defaults.",
            ...(input.promptContext ?? []),
            "",
            input.prompt,
          ]
            .filter(Boolean)
            .join("\n"),
          ...buildGenerationOptions(modelId, { temperature: 0.2 }),
        })

        return {
          result: finalizeDraft(generated.object, {
            quickDocument: input.quickDocument,
            availableClinicalContextModes: input.availableClinicalContextModes,
          }),
          usage: generated.usage
            ? {
                inputTokens: generated.usage.inputTokens,
                outputTokens: generated.usage.outputTokens,
              }
            : undefined,
        }
      }
    )

    return result
  } catch (error) {
    logger.warn("AI document draft generation failed, using fallback draft", {
      error: error instanceof Error ? error.message : String(error),
      modelId,
      quickDocument: !!input.quickDocument,
    })

    return finalizeDraft(
      buildFallbackDocumentDraft(input.prompt, {
        defaultLanguage: input.defaultLanguage,
        defaultRegion: input.defaultRegion,
      }),
      {
        quickDocument: input.quickDocument,
        availableClinicalContextModes: input.availableClinicalContextModes,
      }
    )
  }
}
