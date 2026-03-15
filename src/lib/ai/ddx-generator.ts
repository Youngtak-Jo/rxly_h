import { generateText } from "ai"
import { getModel } from "@/lib/ai-provider"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import { safeParseAIJson } from "@/lib/validations"
import {
  DDX_SYSTEM_PROMPT,
  SEARCH_TERM_EXTRACTION_PROMPT,
} from "@/lib/prompts"
import { buildSystemPrompt } from "@/lib/prompt-sanitizer"
import {
  fetchRAGContext,
  formatRAGContextForPrompt,
} from "@/lib/connectors"
import type { ConnectorState } from "@/types/insights"
import type { DiagnosisOutputItem } from "@/types/insights"

export interface DdxGenerationInput {
  transcript?: string
  doctorNotes?: string
  currentInsights: {
    summary?: string
    keyFindings?: string[]
    redFlags?: string[]
  }
  currentDiagnoses?: Array<{
    icdCode: string
    diseaseName: string
    confidence: string
    citations?: Array<{
      source: string
      title: string
      url: string
    }>
  }>
  enabledConnectors?: ConnectorState
  customInstructions?: string
}

export async function extractDdxSearchTerms(
  transcript: string,
  doctorNotes: string,
  modelId: string
): Promise<string[]> {
  try {
    const model = getModel(modelId)
    const { text } = await generateText({
      model,
      system: SEARCH_TERM_EXTRACTION_PROMPT,
      prompt: `Transcript excerpt: ${transcript.slice(-2000)}\nDoctor notes: ${doctorNotes?.slice(-500) || "none"}`,
      ...buildGenerationOptions(modelId, {
        temperature: 0.1,
        maxOutputTokens: 200,
      }),
    })
    const parsedResult = safeParseAIJson<unknown>(text)
    if (parsedResult.error) {
      return [transcript.slice(-500).replace(/\[.*?\]/g, "").trim()]
    }
    const parsed = parsedResult.data
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(String)
    }
    return [transcript.slice(-500).replace(/\[.*?\]/g, "").trim()]
  } catch {
    return [transcript.slice(-500).replace(/\[.*?\]/g, "").trim()]
  }
}

export async function buildDdxUserPrompt(
  input: DdxGenerationInput,
  modelId: string
): Promise<string> {
  const hasConnectorsEnabled =
    !!input.enabledConnectors &&
    Object.values(input.enabledConnectors).some(Boolean)

  let ragContextText = ""
  if (
    hasConnectorsEnabled &&
    (input.currentInsights.summary?.trim() ||
      input.doctorNotes?.trim() ||
      input.transcript?.trim())
  ) {
    const enabledConnectors = input.enabledConnectors!
    const insightsContext = input.currentInsights.summary
      ? `${input.currentInsights.summary}\n${input.currentInsights.keyFindings?.join(", ") || ""}`
      : input.transcript || ""

    const searchTerms = await extractDdxSearchTerms(
      insightsContext,
      input.doctorNotes || "",
      modelId
    )
    const ragContext = await fetchRAGContext(searchTerms, enabledConnectors)
    ragContextText = formatRAGContextForPrompt(ragContext)
  }

  let userPrompt = `--- PRE-PROCESSED CLINICAL INSIGHTS ---
Summary: ${input.currentInsights.summary || "(none yet)"}
Key Findings: ${JSON.stringify(input.currentInsights.keyFindings || [])}
Red Flags: ${JSON.stringify(input.currentInsights.redFlags || [])}
--- END CLINICAL INSIGHTS ---`

  if (input.doctorNotes?.trim()) {
    userPrompt += `\n\n--- DOCTOR'S NOTES ---\n${input.doctorNotes}\n--- END NOTES ---`
  }

  const existingDiagnoses = input.currentDiagnoses || []
  if (existingDiagnoses.length > 0) {
    userPrompt +=
      "\n\n--- CURRENT DIAGNOSES (preserve citations from previous analysis) ---"
    existingDiagnoses.forEach((diagnosis) => {
      userPrompt += `\n- ${diagnosis.icdCode} ${diagnosis.diseaseName} (${diagnosis.confidence})`
      diagnosis.citations?.forEach((citation) => {
        userPrompt += `\n    [${citation.source}] "${citation.title}" ${citation.url}`
      })
    })
    userPrompt += "\n--- END CURRENT DIAGNOSES ---"
  }

  if (ragContextText) {
    userPrompt += `\n\n--- EXTERNAL MEDICAL KNOWLEDGE (use for diagnosis citations) ---${ragContextText}\n--- END EXTERNAL KNOWLEDGE ---`
  }

  return userPrompt
}

export function buildDdxSystemPrompt(customInstructions?: string): string {
  return buildSystemPrompt(DDX_SYSTEM_PROMPT, customInstructions)
}

const DIAGNOSIS_CITATION_SOURCES = new Set<
  DiagnosisOutputItem["citations"][number]["source"]
>([
  "pubmed",
  "europe_pmc",
  "icd11",
  "openfda",
  "clinical_trials",
  "dailymed",
])

export function parseDdxResponse(text: string): DiagnosisOutputItem[] {
  const parsedResult = safeParseAIJson<{ diagnoses?: unknown[] }>(text)
  if (parsedResult.error || parsedResult.data === null) {
    throw new Error("AI returned invalid response format")
  }

  if (!Array.isArray(parsedResult.data.diagnoses)) {
    return []
  }

  return parsedResult.data.diagnoses.flatMap((item) => {
    if (!item || typeof item !== "object") return []

    const candidate = item as Record<string, unknown>
    const icdCode = typeof candidate.icdCode === "string" ? candidate.icdCode.trim() : ""
    const diseaseName =
      typeof candidate.diseaseName === "string" ? candidate.diseaseName.trim() : ""
    const confidence =
      candidate.confidence === "high" ||
      candidate.confidence === "moderate" ||
      candidate.confidence === "low"
        ? candidate.confidence
        : "moderate"
    const evidence =
      typeof candidate.evidence === "string" ? candidate.evidence.trim() : ""

    if (!icdCode || !diseaseName || !evidence) {
      return []
    }

    const citations = Array.isArray(candidate.citations)
      ? candidate.citations.flatMap((citation) => {
          if (!citation || typeof citation !== "object") return []

          const value = citation as Record<string, unknown>
          const source =
            typeof value.source === "string" &&
            DIAGNOSIS_CITATION_SOURCES.has(
              value.source as DiagnosisOutputItem["citations"][number]["source"]
            )
              ? (value.source as DiagnosisOutputItem["citations"][number]["source"])
              : null
          const title = typeof value.title === "string" ? value.title.trim() : ""
          const url = typeof value.url === "string" ? value.url.trim() : ""
          const snippet =
            typeof value.snippet === "string" && value.snippet.trim()
              ? value.snippet.trim()
              : undefined

          if (!source || !title || !url) {
            return []
          }

          return [{ source, title, url, ...(snippet ? { snippet } : {}) }]
        })
      : []

    return [{ icdCode, diseaseName, confidence, evidence, citations }]
  })
}
