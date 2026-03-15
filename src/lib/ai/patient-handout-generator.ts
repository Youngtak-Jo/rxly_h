import { buildSystemPrompt } from "@/lib/prompt-sanitizer"
import { PATIENT_HANDOUT_SYSTEM_PROMPT } from "@/lib/prompts"
import type {
  PatientHandoutCondition,
  PatientHandoutEntry,
  PatientHandoutSections,
} from "@/types/patient-handout"

interface ParsedHandout {
  language?: string
  conditions?: unknown
  entries?: unknown
}

export interface PatientHandoutGenerationInput {
  transcript?: string
  doctorNotes?: string
  insights?: unknown
  diagnoses?: unknown
  selectedConditions: PatientHandoutCondition[]
  language?: "ko" | "en"
  customInstructions?: string
}

function createEmptySections(): PatientHandoutSections {
  return {
    conditionOverview: "",
    signsSymptoms: "",
    causesRiskFactors: "",
    complications: "",
    treatmentOptions: "",
    whenToSeekHelp: "",
    additionalAdviceFollowUp: "",
    disclaimer: "",
  }
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeSections(raw: unknown): PatientHandoutSections {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  return {
    conditionOverview: toText(source.conditionOverview),
    signsSymptoms: toText(source.signsSymptoms),
    causesRiskFactors: toText(source.causesRiskFactors),
    complications: toText(source.complications),
    treatmentOptions: toText(source.treatmentOptions),
    whenToSeekHelp: toText(source.whenToSeekHelp),
    additionalAdviceFollowUp: toText(source.additionalAdviceFollowUp),
    disclaimer: toText(source.disclaimer),
  }
}

export function buildPatientHandoutSystemPrompt(
  customInstructions?: string
): string {
  return buildSystemPrompt(PATIENT_HANDOUT_SYSTEM_PROMPT, customInstructions)
}

export function buildPatientHandoutPrompt(
  input: PatientHandoutGenerationInput
): string {
  const normalizedLanguage = input.language === "ko" ? "ko" : "en"

  return [
    `Target language: ${normalizedLanguage}`,
    `Selected conditions:\n${JSON.stringify(input.selectedConditions)}`,
    input.transcript?.trim()
      ? `Transcript:\n${input.transcript.slice(-7000)}`
      : "Transcript:\n(No speech recorded yet)",
    input.doctorNotes?.trim() ? `Doctor notes:\n${input.doctorNotes}` : "",
    input.insights ? `Insights:\n${JSON.stringify(input.insights)}` : "",
    input.diagnoses ? `Differential diagnoses:\n${JSON.stringify(input.diagnoses)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")
}

export function normalizePatientHandoutResponse(
  selectedConditions: PatientHandoutCondition[],
  parsed: ParsedHandout
): {
  language: "ko" | "en"
  conditions: PatientHandoutCondition[]
  entries: PatientHandoutEntry[]
} {
  const entries = Array.isArray(parsed.entries)
    ? (parsed.entries as Array<Record<string, unknown>>)
    : []
  const byConditionId = new Map<string, PatientHandoutSections>()

  entries.forEach((entry) => {
    const conditionId = toText(entry.conditionId)
    if (!conditionId) return
    byConditionId.set(conditionId, normalizeSections(entry.sections))
  })

  const normalizedConditions = selectedConditions.map((condition) => ({
    id: condition.id,
    icdCode: condition.icdCode,
    diseaseName: condition.diseaseName,
    source: condition.source,
  }))

  return {
    language: parsed.language === "ko" ? "ko" : "en",
    conditions: normalizedConditions,
    entries: normalizedConditions.map((condition) => ({
      conditionId: condition.id,
      sections: byConditionId.get(condition.id) || createEmptySections(),
    })),
  }
}
