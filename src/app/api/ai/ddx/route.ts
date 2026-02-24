import { NextResponse } from "next/server"
import { generateText } from "ai"
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
  DDX_SYSTEM_PROMPT,
  SEARCH_TERM_EXTRACTION_PROMPT,
} from "@/lib/prompts"
import { buildSystemPrompt } from "@/lib/prompt-sanitizer"
import {
  fetchRAGContext,
  formatRAGContextForPrompt,
  getRAGSourceMeta,
} from "@/lib/connectors"
import type { ConnectorState } from "@/types/insights"

async function extractSearchTerms(
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

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const {
      transcript,
      doctorNotes,
      currentInsights,
      currentDiagnoses,
      enabledConnectors,
      model: modelOverride,
      customInstructions,
    } = await req.json()

    if (!transcript?.trim() && !doctorNotes?.trim()) {
      return errorResponse("No transcript or notes provided", 400)
    }

    // Need at least some clinical context (insights) to generate meaningful DDx
    if (!currentInsights?.summary && !currentInsights?.keyFindings?.length) {
      return errorResponse("No insights context available yet", 400)
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
    if (
      hasConnectorsEnabled &&
      (currentInsights?.summary?.trim() || doctorNotes?.trim() || transcript?.trim())
    ) {
      try {
        // Use insights summary + key findings for search context instead of raw transcript if possible
        const insightsContext = currentInsights?.summary
          ? `${currentInsights.summary}\n${currentInsights.keyFindings?.join(", ") || ""}`
          : transcript || ""

        const searchTerms = await extractSearchTerms(
          insightsContext,
          doctorNotes || "",
          modelId
        )
        const ragContext = await fetchRAGContext(
          searchTerms,
          enabledConnectors
        )

        const meta = getRAGSourceMeta(ragContext)
        logger.info(
          `[DDx RAG] Sources: PubMed=${meta.pubmedCount} EPMC=${meta.europePmcCount} ICD-11=${meta.icd11Count} OpenFDA=${meta.openfdaCount} ClinicalTrials=${meta.clinicalTrialsCount} DailyMed=${meta.dailymedCount}`
        )

        ragContextText = formatRAGContextForPrompt(ragContext)
      } catch (error) {
        logger.error("DDx RAG context fetch failed:", error)
      }
    }

    // Build user prompt with clinical context (Omit raw transcript for token efficiency)
    let userPrompt = `--- PRE-PROCESSED CLINICAL INSIGHTS ---
Summary: ${currentInsights.summary || "(none yet)"}
Key Findings: ${JSON.stringify(currentInsights.keyFindings || [])}
Red Flags: ${JSON.stringify(currentInsights.redFlags || [])}
--- END CLINICAL INSIGHTS ---`

    if (doctorNotes?.trim()) {
      userPrompt += `\n\n--- DOCTOR'S NOTES ---\n${doctorNotes}\n--- END NOTES ---`
    }

    // Format existing diagnoses for citation preservation
    const existingDiagnoses = currentDiagnoses || []
    if (existingDiagnoses.length > 0) {
      userPrompt += "\n\n--- CURRENT DIAGNOSES (preserve citations from previous analysis) ---"
      existingDiagnoses.forEach(
        (dx: {
          icdCode: string
          diseaseName: string
          confidence: string
          citations: { source: string; title: string; url: string }[]
        }) => {
          userPrompt += `\n- ${dx.icdCode} ${dx.diseaseName} (${dx.confidence})`
          if (dx.citations && dx.citations.length > 0) {
            dx.citations.forEach(
              (c: { source: string; title: string; url: string }) => {
                userPrompt += `\n    [${c.source}] "${c.title}" ${c.url}`
              }
            )
          }
        }
      )
      userPrompt += "\n--- END CURRENT DIAGNOSES ---"
    }

    // Append RAG context if available
    if (ragContextText) {
      userPrompt += `\n\n--- EXTERNAL MEDICAL KNOWLEDGE (use for diagnosis citations) ---${ragContextText}\n--- END EXTERNAL KNOWLEDGE ---`
    }

    const systemPrompt = buildSystemPrompt(DDX_SYSTEM_PROMPT, customInstructions)

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      ...buildGenerationOptions(modelId, { temperature: 0.3 }),
    })

    const parsedResult = safeParseAIJson<{ diagnoses?: unknown[] }>(text)
    if (parsedResult.error || parsedResult.data === null) {
      logger.error("DDx: AI returned invalid JSON")
      return NextResponse.json({ error: "AI returned invalid response format" }, { status: 502 })
    }
    const parsed = parsedResult.data

    if (!parsed.diagnoses || !Array.isArray(parsed.diagnoses)) {
      return Response.json({ diagnoses: [] })
    }

    logAudit({ userId: user.id, action: "READ", resource: "ai_ddx" })
    return Response.json(parsed)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("DDx generation error:", error)
    return errorResponse("Failed to generate differential diagnosis", 500)
  }
}
