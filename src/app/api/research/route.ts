import { NextResponse } from "next/server"
import { generateText, streamText, type ModelMessage, type UserContent } from "ai"
import { logger } from "@/lib/logger"
import { CLAUDE_MODEL } from "@/lib/anthropic"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { errorResponse } from "@/lib/api-response"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import { safeParseAIJson } from "@/lib/validations"
import {
  RESEARCH_SYSTEM_PROMPT,
  SEARCH_TERM_EXTRACTION_PROMPT,
} from "@/lib/prompts"
import { buildSystemPrompt } from "@/lib/prompt-sanitizer"
import {
  fetchRAGContext,
  formatRAGContextForPrompt,
  getRAGSourceMeta,
} from "@/lib/connectors"
import type { ConnectorState } from "@/types/insights"
import { withAiTelemetry } from "@/lib/telemetry/ai"

type DetectedLanguage = "ko" | "en" | "other"

function detectQuestionLanguage(text: string): DetectedLanguage {
  const hangul = (text.match(/[가-힣]/g) || []).length
  const latin = (text.match(/[A-Za-z]/g) || []).length

  if (hangul > latin) return "ko"
  if (latin > 0 && hangul === 0) return "en"
  return "other"
}

function getLanguageOverrideInstruction(language: DetectedLanguage) {
  if (language === "ko") {
    return "LANGUAGE OVERRIDE: Respond in Korean only. Ignore the language used in earlier conversation history."
  }
  if (language === "en") {
    return "LANGUAGE OVERRIDE: Respond in English only. Ignore the language used in earlier conversation history."
  }
  return "LANGUAGE OVERRIDE: Respond in the same language as the latest user question. Ignore the language used in earlier conversation history."
}

async function extractSearchTerms(
  question: string,
  modelId: string
): Promise<string[]> {
  try {
    const model = getModel(modelId)
    const { text } = await generateText({
      model,
      system: SEARCH_TERM_EXTRACTION_PROMPT,
      prompt: `Research question: ${question.slice(0, 2000)}`,
      ...buildGenerationOptions(modelId, {
        temperature: 0.1,
        maxOutputTokens: 200,
      }),
    })
    const parsedResult = safeParseAIJson<unknown>(text)
    if (parsedResult.error) {
      return [question.slice(0, 500).trim()]
    }
    const parsed = parsedResult.data
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(String)
    }
    return [question.slice(0, 500).trim()]
  } catch {
    return [question.slice(0, 500).trim()]
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const { question, conversationHistory, enabledConnectors, insightsContext, imageUrls, model: modelOverride, customInstructions, sessionId } =
      await req.json()

    const requestedImageUrls = Array.isArray(imageUrls)
      ? imageUrls.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
      : []
    const effectiveQuestion =
      typeof question === "string" && question.trim()
        ? question.trim()
        : requestedImageUrls.length > 0
          ? "Analyze the attached medical image(s) in a research context."
          : ""

    if (!effectiveQuestion) {
      return errorResponse("No question provided", 400)
    }

    const modelId = modelOverride || CLAUDE_MODEL
    if (!isSupportedModel(modelId)) {
      return errorResponse("Unsupported model id", 400)
    }
    const model = getModel(modelId)

    // Check if any connectors are enabled
    const hasConnectorsEnabled =
      enabledConnectors &&
      Object.values(enabledConnectors as ConnectorState).some(Boolean)

    // Fetch RAG context from enabled connectors
    let ragContextText = ""
    if (hasConnectorsEnabled) {
      try {
        const searchTerms = await extractSearchTerms(effectiveQuestion, modelId)
        const ragContext = await fetchRAGContext(
          searchTerms,
          enabledConnectors
        )

        const meta = getRAGSourceMeta(ragContext)
        logger.info(
          `[Research RAG] Sources: PubMed=${meta.pubmedCount} EPMC=${meta.europePmcCount} ICD-11=${meta.icd11Count} OpenFDA=${meta.openfdaCount} ClinicalTrials=${meta.clinicalTrialsCount} DailyMed=${meta.dailymedCount}`
        )

        ragContextText = formatRAGContextForPrompt(ragContext)
      } catch (error) {
        logger.error("Research RAG context fetch failed:", error)
      }
    }

    // Build the enriched user prompt
    let userPrompt = `--- RESEARCH QUESTION ---\n${effectiveQuestion}\n--- END QUESTION ---`

    if (insightsContext) {
      userPrompt += `\n\n--- CURRENT CONSULTATION CONTEXT ---
Summary: ${insightsContext.summary || "(none)"}
Key Findings: ${JSON.stringify(insightsContext.keyFindings || [])}
Red Flags: ${JSON.stringify(insightsContext.redFlags || [])}
--- END CONSULTATION CONTEXT ---`
    }

    if (ragContextText) {
      userPrompt += `\n\n--- EXTERNAL MEDICAL KNOWLEDGE ---${ragContextText}\n--- END EXTERNAL KNOWLEDGE ---`
    }

    if (requestedImageUrls.length > 0) {
      userPrompt += `\n\n--- ATTACHED MEDICAL IMAGES ---
The user attached ${requestedImageUrls.length} medical image(s).
Analyze the image findings in the context of the research question${insightsContext ? " and the consultation context" : ""}.
Do not ignore the images, and do not describe them in isolation from the clinical question.
--- END ATTACHED MEDICAL IMAGES ---`
    }

    // Build messages array for multi-turn conversation
    const messages: ModelMessage[] = []

    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })
      }
    }

    const finalUserContent: string | UserContent =
      requestedImageUrls.length > 0
        ? [
            { type: "text", text: userPrompt },
            ...requestedImageUrls.map((url) => ({
              type: "image" as const,
              image: new URL(url),
            })),
          ]
        : userPrompt

    messages.push({ role: "user", content: finalUserContent })

    const questionLanguage = detectQuestionLanguage(effectiveQuestion)
    const systemPrompt = `${buildSystemPrompt(
      RESEARCH_SYSTEM_PROMPT,
      customInstructions
    )}\n\n${getLanguageOverrideInstruction(questionLanguage)}`

    const response = await withAiTelemetry(
      {
        userId: user.id,
        sessionId: typeof sessionId === "string" ? sessionId : null,
        feature: "ai_research",
        model: modelId,
      },
      async () => {
        const result = streamText({
          model,
          system: systemPrompt,
          messages,
          ...buildGenerationOptions(modelId, { temperature: 0.3 }),
        })

        return { result: result.toTextStreamResponse() }
      }
    )

    logAudit({ userId: user.id, action: "READ", resource: "ai_research" })
    return response
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Research generation error:", error)
    return errorResponse("Failed to generate research response", 500)
  }
}
