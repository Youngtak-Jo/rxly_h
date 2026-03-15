import type { UserContent } from "ai"
import { buildSystemPrompt } from "@/lib/prompt-sanitizer"
import { INSIGHTS_SYSTEM_PROMPT } from "@/lib/prompts"
import { safeParseAIJson } from "@/lib/validations"
import type {
  DiagnosisOutputItem,
  InsightsResponse,
} from "@/types/insights"

export interface InsightsGenerationInput {
  transcript?: string
  doctorNotes?: string
  newImageUrls?: string[]
  previousImageFindings?: Array<{
    storagePath: string
    findings: string
  }>
  mode?: string
  previousSummary?: string
  inlineComments?: Array<{
    section: string
    selectedText: string
    comment: string
  }>
  currentInsights?: {
    summary?: string
    keyFindings?: string[]
    redFlags?: string[]
    checklistItems?: Array<{
      id?: string
      label: string
      isChecked: boolean
    }>
  }
  customInstructions?: string
}

export function buildInsightsSystemPrompt(customInstructions?: string): string {
  return buildSystemPrompt(INSIGHTS_SYSTEM_PROMPT, customInstructions)
}

export function buildInsightsGenerationContent(
  input: InsightsGenerationInput
): UserContent {
  const hasNewImages = !!input.newImageUrls && input.newImageUrls.length > 0
  const hasPreviousImages =
    !!input.previousImageFindings && input.previousImageFindings.length > 0
  const hasInlineComments =
    !!input.inlineComments && input.inlineComments.length > 0

  const checklistItems = input.currentInsights?.checklistItems || []
  const uncheckedItems = checklistItems.filter((item) => !item.isChecked)
  const checkedItems = checklistItems.filter((item) => item.isChecked)

  let existingChecklistText = ""
  if (checklistItems.length > 0) {
    existingChecklistText =
      "\n\n--- CURRENT CHECKLIST ITEMS (preserve items with their IDs; add/remove based on clinical relevance) ---"
    if (uncheckedItems.length > 0) {
      existingChecklistText += "\nPending:"
      uncheckedItems.forEach((item) => {
        existingChecklistText += `\n  [id:${item.id}] [ ] ${item.label}`
      })
    }
    if (checkedItems.length > 0) {
      existingChecklistText += "\nCompleted:"
      checkedItems.forEach((item) => {
        existingChecklistText += `\n  [id:${item.id}] [x] ${item.label}`
      })
    }
    existingChecklistText += "\n--- END CURRENT CHECKLIST ---"
  }

  const transcriptSection =
    input.mode === "delta" && input.previousSummary
      ? `Previous analysis summary: ${input.previousSummary}\n\nNew dialogue since last analysis:\n${input.transcript || "(No new speech)"}`
      : `Full transcript:\n${input.transcript || "(No speech recorded yet)"}`

  let textContent = `Current summary: ${input.currentInsights?.summary || "(none yet)"}\nCurrent key findings: ${JSON.stringify(input.currentInsights?.keyFindings || [])}\nCurrent red flags: ${JSON.stringify(input.currentInsights?.redFlags || [])}${existingChecklistText}\n\n${transcriptSection}`

  if (input.doctorNotes?.trim()) {
    textContent += `\n\nDoctor's notes (from chat):\n${input.doctorNotes}`
  }

  if (hasInlineComments) {
    textContent += "\n\n--- DOCTOR'S INLINE COMMENTS ---"
    textContent +=
      "\nThe doctor has annotated specific parts of the current insights. Address each comment:"
    input.inlineComments?.forEach((comment) => {
      textContent += `\n\n[Section: ${comment.section}]`
      textContent += `\nSelected text: "${comment.selectedText}"`
      textContent += `\nDoctor's comment: "${comment.comment}"`
    })
    textContent +=
      "\n\nIMPORTANT: Prioritize these comments — they are authoritative corrections or requests from the clinician. Modify the relevant sections accordingly."
    textContent += "\n--- END DOCTOR'S INLINE COMMENTS ---"
  }

  const content: UserContent = [{ type: "text", text: textContent }]

  if (hasPreviousImages) {
    let previousImageText =
      "\n\n--- PREVIOUSLY ANALYZED IMAGES (text summaries, do not re-analyze) ---"
    input.previousImageFindings?.forEach((image, index) => {
      previousImageText += `\nImage ${index + 1}:\n${image.findings}`
    })
    previousImageText += "\n--- END PREVIOUSLY ANALYZED IMAGES ---"
    content[0] = {
      type: "text",
      text: textContent + previousImageText,
    }
  }

  if (hasNewImages) {
    const findingsSummary =
      (input.currentInsights?.keyFindings || []).join("; ") || "None yet"
    const flagsSummary =
      (input.currentInsights?.redFlags || []).join("; ") || "None"
    const currentText = (content[0] as { type: "text"; text: string }).text
    content[0] = {
      type: "text",
      text:
        currentText +
        `\n\n--- NEW MEDICAL IMAGES (${input.newImageUrls!.length}) ---\nCRITICAL: Analyze each NEW image IN THE CONTEXT of this consultation. The patient's current clinical picture:\n- Current assessment: ${input.currentInsights?.summary || "Not yet established"}\n- Key findings so far: ${findingsSummary}\n- Red flags identified: ${flagsSummary}\n\nCorrelate what you see in the image(s) with the transcript discussion, doctor's notes, and findings above. Do NOT provide a generic assessment disconnected from the consultation context.\nIncorporate your contextual image analysis into the summary, key findings, red flags, and checklist.\n--- END NEW IMAGES ---`,
    }

    input.newImageUrls?.forEach((url) => {
      content.push({ type: "image", image: new URL(url) })
    })
  }

  return content
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function normalizeDiagnosisOutput(value: unknown): DiagnosisOutputItem[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return []

    const source = item as Record<string, unknown>
    const icdCode = typeof source.icdCode === "string" ? source.icdCode.trim() : ""
    const diseaseName =
      typeof source.diseaseName === "string" ? source.diseaseName.trim() : ""
    const confidence =
      source.confidence === "high" ||
      source.confidence === "moderate" ||
      source.confidence === "low"
        ? source.confidence
        : "moderate"
    const evidence =
      typeof source.evidence === "string" ? source.evidence.trim() : ""

    if (!icdCode || !diseaseName || !evidence) {
      return []
    }

    const citations = Array.isArray(source.citations)
      ? source.citations.filter(
          (
            citation
          ): citation is DiagnosisOutputItem["citations"][number] =>
            !!citation &&
            typeof citation === "object" &&
            typeof (citation as { source?: unknown }).source === "string" &&
            typeof (citation as { title?: unknown }).title === "string" &&
            typeof (citation as { url?: unknown }).url === "string"
        )
      : []

    return [
      {
        icdCode,
        diseaseName,
        confidence,
        evidence,
        citations,
      },
    ]
  })
}

export function parseInsightsResponse(text: string): InsightsResponse {
  const parsedResult = safeParseAIJson<unknown>(text)
  if (parsedResult.error) {
    throw new Error(parsedResult.error)
  }

  const parsed =
    parsedResult.data && typeof parsedResult.data === "object"
      ? (parsedResult.data as Record<string, unknown>)
      : null
  if (!parsed) {
    throw new Error("Invalid insights response format")
  }

  const checklist = Array.isArray(parsed.checklist)
    ? parsed.checklist.flatMap((item) => {
        if (!item || typeof item !== "object") return []

        const candidate = item as Record<string, unknown>
        const label = typeof candidate.label === "string" ? candidate.label.trim() : ""
        if (!label) return []

        return [
          {
            ...(typeof candidate.id === "string" && candidate.id.trim()
              ? { id: candidate.id.trim() }
              : {}),
            label,
            checked: Boolean(candidate.checked),
          },
        ]
      })
    : []

  return {
    ...(typeof parsed.title === "string" && parsed.title.trim()
      ? { title: parsed.title.trim() }
      : {}),
    summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
    keyFindings: toStringArray(parsed.keyFindings),
    redFlags: toStringArray(parsed.redFlags),
    checklist,
    diagnoses: normalizeDiagnosisOutput(parsed.diagnoses),
  }
}
