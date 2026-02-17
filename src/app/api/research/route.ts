import { NextResponse } from "next/server"
import { generateText, streamText } from "ai"
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

    const { question, conversationHistory, enabledConnectors, insightsContext, model: modelOverride, customInstructions } =
      await req.json()

    if (!question?.trim()) {
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
        const searchTerms = await extractSearchTerms(question, modelId)
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
    let userPrompt = `--- RESEARCH QUESTION ---\n${question}\n--- END QUESTION ---`

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

    // Build messages array for multi-turn conversation
    const messages: { role: "user" | "assistant"; content: string }[] = []

    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })
      }
    }

    // Add the current enriched question as the final user message
    messages.push({ role: "user", content: userPrompt })

    const questionLanguage = detectQuestionLanguage(question)
    const systemPrompt = `${buildSystemPrompt(
      RESEARCH_SYSTEM_PROMPT,
      customInstructions
    )}\n\n${getLanguageOverrideInstruction(questionLanguage)}`

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      ...buildGenerationOptions(modelId, { temperature: 0.3 }),
    })

    logAudit({ userId: user.id, action: "READ", resource: "ai_research" })
    return result.toTextStreamResponse()
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Research generation error:", error)
    return errorResponse("Failed to generate research response", 500)
  }
}
