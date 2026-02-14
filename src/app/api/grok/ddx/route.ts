import { generateText } from "ai"
import { CLAUDE_MODEL } from "@/lib/anthropic"
import { getModel } from "@/lib/ai-provider"
import {
  DDX_SYSTEM_PROMPT,
  SEARCH_TERM_EXTRACTION_PROMPT,
} from "@/lib/prompts"
import {
  fetchRAGContext,
  formatRAGContextForPrompt,
  getRAGSourceMeta,
} from "@/lib/connectors"
import type { ConnectorState } from "@/types/insights"

async function extractSearchTerms(
  transcript: string,
  doctorNotes: string
): Promise<string[]> {
  try {
    const model = getModel(CLAUDE_MODEL)
    const { text } = await generateText({
      model,
      system: SEARCH_TERM_EXTRACTION_PROMPT,
      prompt: `Transcript excerpt: ${transcript.slice(-2000)}\nDoctor notes: ${doctorNotes?.slice(-500) || "none"}`,
      temperature: 0.1,
      maxOutputTokens: 200,
    })
    const cleaned = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "")
    const parsed = JSON.parse(cleaned)
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
    const {
      transcript,
      doctorNotes,
      currentInsights,
      currentDiagnoses,
      enabledConnectors,
      model: modelOverride,
    } = await req.json()

    if (!transcript?.trim() && !doctorNotes?.trim()) {
      return new Response("No transcript or notes provided", { status: 400 })
    }

    // Need at least some clinical context (insights) to generate meaningful DDx
    if (!currentInsights?.summary && !currentInsights?.keyFindings?.length) {
      return new Response("No insights context available yet", { status: 400 })
    }

    const model = getModel(modelOverride || CLAUDE_MODEL)

    // Check if any connectors are enabled
    const hasConnectorsEnabled =
      enabledConnectors &&
      Object.values(enabledConnectors as ConnectorState).some(Boolean)

    // Fetch RAG context from enabled connectors
    let ragContextText = ""
    if (
      hasConnectorsEnabled &&
      (transcript?.trim() || doctorNotes?.trim())
    ) {
      try {
        const searchTerms = await extractSearchTerms(
          transcript || "",
          doctorNotes || ""
        )
        const ragContext = await fetchRAGContext(
          searchTerms,
          enabledConnectors
        )

        const meta = getRAGSourceMeta(ragContext)
        console.log(
          `[DDx RAG] Search terms: ${JSON.stringify(searchTerms)} | ` +
          `PubMed: ${meta.pubmedCount} | ` +
          `Europe PMC: ${meta.europePmcCount} | ` +
          `ICD-11: ${meta.icd11Count} | ` +
          `OpenFDA: ${meta.openfdaCount} | ` +
          `ClinicalTrials: ${meta.clinicalTrialsCount} | ` +
          `DailyMed: ${meta.dailymedCount}`
        )

        ragContextText = formatRAGContextForPrompt(ragContext)
      } catch (error) {
        console.error("DDx RAG context fetch failed:", error)
      }
    }

    // Build user prompt with clinical context
    let userPrompt = `--- PRE-PROCESSED CLINICAL INSIGHTS ---
Summary: ${currentInsights.summary || "(none yet)"}
Key Findings: ${JSON.stringify(currentInsights.keyFindings || [])}
Red Flags: ${JSON.stringify(currentInsights.redFlags || [])}
--- END CLINICAL INSIGHTS ---

--- CONSULTATION TRANSCRIPT (last portion) ---
${(transcript || "").slice(-3000)}
--- END TRANSCRIPT ---`

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

    const { text } = await generateText({
      model,
      system: DDX_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.3,
    })

    // Parse and validate response (strip markdown code fences if present)
    const cleaned = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "")
    const parsed = JSON.parse(cleaned)
    if (!parsed.diagnoses || !Array.isArray(parsed.diagnoses)) {
      return Response.json({ diagnoses: [] })
    }

    return Response.json(parsed)
  } catch (error) {
    console.error("DDx generation error:", error)
    return new Response("Failed to generate differential diagnosis", {
      status: 500,
    })
  }
}
