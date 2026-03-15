import { DIAGNOSTIC_KEYWORDS_PROMPT } from "@/lib/prompts"
import { safeParseAIJson } from "@/lib/validations"
import type { DiagnosticKeyword } from "@/types/session"

const DIAGNOSTIC_KEYWORD_CATEGORIES = new Set<DiagnosticKeyword["category"]>([
  "symptom",
  "diagnosis",
  "medication",
  "finding",
  "vital",
])

export function buildDiagnosticKeywordsSystemPrompt(): string {
  return DIAGNOSTIC_KEYWORDS_PROMPT
}

export function buildDiagnosticKeywordsPrompt(transcript: string): string {
  return `Extract diagnostic keywords from this consultation transcript:\n\n${transcript}`
}

export function parseDiagnosticKeywordsResponse(text: string): DiagnosticKeyword[] {
  const parsedResult = safeParseAIJson<unknown>(text)
  if (parsedResult.error) {
    throw new Error(parsedResult.error)
  }

  if (!Array.isArray(parsedResult.data)) {
    throw new Error("Invalid diagnostic keyword response format")
  }

  return parsedResult.data.flatMap((item) => {
    if (!item || typeof item !== "object") return []

    const candidate = item as Record<string, unknown>
    const phrase = typeof candidate.phrase === "string" ? candidate.phrase.trim() : ""
    const category =
      typeof candidate.category === "string" &&
      DIAGNOSTIC_KEYWORD_CATEGORIES.has(
        candidate.category as DiagnosticKeyword["category"]
      )
        ? (candidate.category as DiagnosticKeyword["category"])
        : null

    if (!phrase || !category) {
      return []
    }

    return [{ phrase, category }]
  })
}
