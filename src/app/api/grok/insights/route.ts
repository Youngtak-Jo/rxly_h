import { streamText, generateText } from "ai"
import { xai, DEFAULT_MODEL } from "@/lib/grok"
import {
  INSIGHTS_SYSTEM_PROMPT,
  DIAGNOSIS_PROMPT_ADDENDUM,
  SEARCH_TERM_EXTRACTION_PROMPT,
} from "@/lib/prompts"
import {
  fetchRAGContext,
  formatRAGContextForPrompt,
  getRAGSourceMeta,
} from "@/lib/connectors"
import type { ConnectorState } from "@/types/insights"
import type { UserContent } from "ai"

async function extractSearchTerms(
  transcript: string,
  doctorNotes: string
): Promise<string[]> {
  try {
    const model = xai(DEFAULT_MODEL)
    const { text } = await generateText({
      model,
      system: SEARCH_TERM_EXTRACTION_PROMPT,
      prompt: `Transcript excerpt: ${transcript.slice(-2000)}\nDoctor notes: ${doctorNotes?.slice(-500) || "none"}`,
      temperature: 0.1,
      maxOutputTokens: 200,
    })
    const parsed = JSON.parse(text)
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
      imageUrls,
      currentInsights,
      sessionId,
      enabledConnectors,
    } = await req.json()

    if (
      !transcript?.trim() &&
      !doctorNotes?.trim() &&
      (!imageUrls || imageUrls.length === 0)
    ) {
      return new Response("No transcript, notes, or images provided", {
        status: 400,
      })
    }

    const model = xai(DEFAULT_MODEL)

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
          `[RAG] Search terms: ${JSON.stringify(searchTerms)} | ` +
          `PubMed: ${meta.pubmedCount} | ` +
          `Europe PMC: ${meta.europePmcCount} | ` +
          `ICD-11: ${meta.icd11Count} | ` +
          `OpenFDA: ${meta.openfdaCount} | ` +
          `ClinicalTrials: ${meta.clinicalTrialsCount} | ` +
          `DailyMed: ${meta.dailymedCount}`
        )

        ragContextText = formatRAGContextForPrompt(ragContext)
      } catch (error) {
        console.error("RAG context fetch failed:", error)
      }
    }

    // Build system prompt — conditionally append diagnosis instructions
    let systemPrompt = INSIGHTS_SYSTEM_PROMPT
    if (hasConnectorsEnabled) {
      systemPrompt += DIAGNOSIS_PROMPT_ADDENDUM
    }

    // Format existing checklist so the AI can see current state
    const checklistItems = currentInsights?.checklistItems || []
    const uncheckedItems = checklistItems.filter(
      (i: { isChecked: boolean }) => !i.isChecked
    )
    const checkedItems = checklistItems.filter(
      (i: { isChecked: boolean }) => i.isChecked
    )

    let existingChecklistText = ""
    if (checklistItems.length > 0) {
      existingChecklistText =
        "\n\n--- CURRENT CHECKLIST (output the full updated checklist in your response) ---"
      if (uncheckedItems.length > 0) {
        existingChecklistText += "\nPending:"
        uncheckedItems.forEach((item: { label: string }) => {
          existingChecklistText += `\n  [ ] ${item.label}`
        })
      }
      if (checkedItems.length > 0) {
        existingChecklistText += "\nCompleted:"
        checkedItems.forEach((item: { label: string }) => {
          existingChecklistText += `\n  [x] ${item.label}`
        })
      }
      existingChecklistText += "\n--- END CURRENT CHECKLIST ---"
    }

    // Format existing diagnoses so the AI can preserve citations
    let existingDiagnosesText = ""
    const existingDiagnoses = currentInsights?.diagnoses || []
    if (hasConnectorsEnabled && existingDiagnoses.length > 0) {
      existingDiagnosesText =
        "\n\n--- CURRENT DIAGNOSES (preserve citations from previous analysis) ---"
      existingDiagnoses.forEach(
        (dx: {
          icdCode: string
          diseaseName: string
          confidence: string
          citations: { source: string; title: string; url: string }[]
        }) => {
          existingDiagnosesText += `\n- ${dx.icdCode} ${dx.diseaseName} (${dx.confidence})`
          if (dx.citations && dx.citations.length > 0) {
            dx.citations.forEach(
              (c: { source: string; title: string; url: string }) => {
                existingDiagnosesText += `\n    [${c.source}] "${c.title}" ${c.url}`
              }
            )
          }
        }
      )
      existingDiagnosesText += "\n--- END CURRENT DIAGNOSES ---"
    }

    let textContent = `Current summary: ${currentInsights?.summary || "(none yet)"}\nCurrent key findings: ${JSON.stringify(currentInsights?.keyFindings || [])}\nCurrent red flags: ${JSON.stringify(currentInsights?.redFlags || [])}${existingChecklistText}${existingDiagnosesText}\n\nFull transcript:\n${transcript || "(No speech recorded yet)"}`
    if (doctorNotes?.trim()) {
      textContent += `\n\nDoctor's notes (from chat):\n${doctorNotes}`
    }

    // Append RAG context if available
    if (ragContextText) {
      textContent += `\n\n--- EXTERNAL MEDICAL KNOWLEDGE (use for diagnosis citations) ---${ragContextText}\n--- END EXTERNAL KNOWLEDGE ---`
    }

    // Build multimodal content: text + images
    const content: UserContent = [{ type: "text", text: textContent }]

    if (imageUrls && imageUrls.length > 0) {
      const findingsSummary = (currentInsights?.keyFindings || []).join("; ") || "None yet"
      const flagsSummary = (currentInsights?.redFlags || []).join("; ") || "None"
      content[0] = {
        type: "text",
        text:
          textContent +
          `\n\n--- UPLOADED MEDICAL IMAGES ---\nThe doctor has uploaded ${imageUrls.length} medical image(s) during this consultation.\n\nCRITICAL: Analyze each image IN THE CONTEXT of this consultation. The patient's current clinical picture:\n- Current assessment: ${currentInsights?.summary || "Not yet established"}\n- Key findings so far: ${findingsSummary}\n- Red flags identified: ${flagsSummary}\n\nCorrelate what you see in the image(s) with the transcript discussion, doctor's notes, and findings above. Do NOT provide a generic assessment disconnected from the consultation context.\nIncorporate your contextual image analysis into the summary, key findings, red flags, and checklist.\n--- END IMAGE INSTRUCTIONS ---`,
      }
      for (const url of imageUrls) {
        content.push({ type: "image", image: new URL(url) })
      }
    }

    const result = streamText({
      model,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content,
        },
      ],
      temperature: 0.3,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Insights generation error:", error)
    return new Response("Failed to generate insights", { status: 500 })
  }
}
