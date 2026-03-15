import { generateText, type ModelMessage, type UserContent } from "ai"
import { getModel } from "@/lib/ai-provider"
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
} from "@/lib/connectors"
import type { ConnectorState } from "@/types/insights"

type DetectedLanguage = "ko" | "en" | "other"

export interface ResearchGenerationInput {
  question: string
  conversationHistory?: Array<{
    role: "user" | "assistant"
    content: string
  }>
  enabledConnectors?: ConnectorState
  insightsContext?: {
    summary?: string
    keyFindings?: string[]
    redFlags?: string[]
  } | null
  imageUrls?: string[]
  customInstructions?: string
}

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

export async function extractResearchSearchTerms(
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

export async function buildResearchMessages(
  input: ResearchGenerationInput,
  modelId: string
): Promise<ModelMessage[]> {
  const requestedImageUrls = Array.isArray(input.imageUrls)
    ? input.imageUrls.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    : []

  const hasConnectorsEnabled =
    !!input.enabledConnectors && Object.values(input.enabledConnectors).some(Boolean)

  let ragContextText = ""
  if (hasConnectorsEnabled) {
    const enabledConnectors = input.enabledConnectors!
    const searchTerms = await extractResearchSearchTerms(input.question, modelId)
    const ragContext = await fetchRAGContext(searchTerms, enabledConnectors)
    ragContextText = formatRAGContextForPrompt(ragContext)
  }

  let userPrompt = `--- RESEARCH QUESTION ---\n${input.question}\n--- END QUESTION ---`

  if (input.insightsContext) {
    userPrompt += `\n\n--- CURRENT CONSULTATION CONTEXT ---
Summary: ${input.insightsContext.summary || "(none)"}
Key Findings: ${JSON.stringify(input.insightsContext.keyFindings || [])}
Red Flags: ${JSON.stringify(input.insightsContext.redFlags || [])}
--- END CONSULTATION CONTEXT ---`
  }

  if (ragContextText) {
    userPrompt += `\n\n--- EXTERNAL MEDICAL KNOWLEDGE ---${ragContextText}\n--- END EXTERNAL KNOWLEDGE ---`
  }

  if (requestedImageUrls.length > 0) {
    userPrompt += `\n\n--- ATTACHED MEDICAL IMAGES ---
The user attached ${requestedImageUrls.length} medical image(s).
Analyze the image findings in the context of the research question${input.insightsContext ? " and the consultation context" : ""}.
Do not ignore the images, and do not describe them in isolation from the clinical question.
--- END ATTACHED MEDICAL IMAGES ---`
  }

  const messages: ModelMessage[] = []
  input.conversationHistory?.forEach((message) => {
    messages.push({
      role: message.role,
      content: message.content,
    })
  })

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

  messages.push({
    role: "user",
    content: finalUserContent,
  })

  return messages
}

export function buildResearchSystemPrompt(
  question: string,
  customInstructions?: string
): string {
  const questionLanguage = detectQuestionLanguage(question)
  return `${buildSystemPrompt(
    RESEARCH_SYSTEM_PROMPT,
    customInstructions
  )}\n\n${getLanguageOverrideInstruction(questionLanguage)}`
}
