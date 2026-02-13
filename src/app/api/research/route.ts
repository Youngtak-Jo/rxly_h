import { generateText, streamText } from "ai"
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import {
  RESEARCH_SYSTEM_PROMPT,
  SEARCH_TERM_EXTRACTION_PROMPT,
} from "@/lib/prompts"
import {
  fetchRAGContext,
  formatRAGContextForPrompt,
  getRAGSourceMeta,
} from "@/lib/connectors"
import type { ConnectorState } from "@/types/insights"

async function extractSearchTerms(question: string): Promise<string[]> {
  try {
    const model = anthropic(CLAUDE_MODEL)
    const { text } = await generateText({
      model,
      system: SEARCH_TERM_EXTRACTION_PROMPT,
      prompt: `Research question: ${question.slice(0, 2000)}`,
      temperature: 0.1,
      maxOutputTokens: 200,
    })
    const cleaned = text
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "")
    const parsed = JSON.parse(cleaned)
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
    const { question, conversationHistory, enabledConnectors, insightsContext } =
      await req.json()

    if (!question?.trim()) {
      return new Response("No question provided", { status: 400 })
    }

    const model = anthropic(CLAUDE_MODEL)

    // Check if any connectors are enabled
    const hasConnectorsEnabled =
      enabledConnectors &&
      Object.values(enabledConnectors as ConnectorState).some(Boolean)

    // Fetch RAG context from enabled connectors
    let ragContextText = ""
    if (hasConnectorsEnabled) {
      try {
        const searchTerms = await extractSearchTerms(question)
        const ragContext = await fetchRAGContext(
          searchTerms,
          enabledConnectors
        )

        const meta = getRAGSourceMeta(ragContext)
        console.log(
          `[Research RAG] Search terms: ${JSON.stringify(searchTerms)} | ` +
            `PubMed: ${meta.pubmedCount} | ` +
            `Europe PMC: ${meta.europePmcCount} | ` +
            `ICD-11: ${meta.icd11Count} | ` +
            `OpenFDA: ${meta.openfdaCount} | ` +
            `ClinicalTrials: ${meta.clinicalTrialsCount} | ` +
            `DailyMed: ${meta.dailymedCount}`
        )

        ragContextText = formatRAGContextForPrompt(ragContext)
      } catch (error) {
        console.error("Research RAG context fetch failed:", error)
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

    const result = streamText({
      model,
      system: RESEARCH_SYSTEM_PROMPT,
      messages,
      temperature: 0.3,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Research generation error:", error)
    return new Response("Failed to generate research response", {
      status: 500,
    })
  }
}
