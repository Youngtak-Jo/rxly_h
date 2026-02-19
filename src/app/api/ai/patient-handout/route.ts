import { NextResponse } from "next/server"
import { generateText } from "ai"
import { DEFAULT_MODEL } from "@/lib/xai"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import { PATIENT_HANDOUT_SYSTEM_PROMPT } from "@/lib/prompts"
import { buildSystemPrompt } from "@/lib/prompt-sanitizer"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { errorResponse } from "@/lib/api-response"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import { safeParseAIJson } from "@/lib/validations"
import { logger } from "@/lib/logger"
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
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  return {
    conditionOverview: toText(src.conditionOverview),
    signsSymptoms: toText(src.signsSymptoms),
    causesRiskFactors: toText(src.causesRiskFactors),
    complications: toText(src.complications),
    treatmentOptions: toText(src.treatmentOptions),
    whenToSeekHelp: toText(src.whenToSeekHelp),
    additionalAdviceFollowUp: toText(src.additionalAdviceFollowUp),
    disclaimer: toText(src.disclaimer),
  }
}

function normalizeEntries(
  selectedConditions: PatientHandoutCondition[],
  parsedEntries: unknown
): PatientHandoutEntry[] {
  const entries = Array.isArray(parsedEntries)
    ? (parsedEntries as Array<Record<string, unknown>>)
    : []

  const byConditionId = new Map<string, PatientHandoutSections>()

  for (const entry of entries) {
    const conditionId = toText(entry.conditionId)
    if (!conditionId) continue
    byConditionId.set(conditionId, normalizeSections(entry.sections))
  }

  return selectedConditions.map((condition) => ({
    conditionId: condition.id,
    sections: byConditionId.get(condition.id) || createEmptySections(),
  }))
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const {
      transcript,
      doctorNotes,
      insights,
      diagnoses,
      selectedConditions,
      language,
      model: modelOverride,
      customInstructions,
    } = (await req.json()) as {
      transcript?: string
      doctorNotes?: string
      insights?: unknown
      diagnoses?: unknown
      selectedConditions?: PatientHandoutCondition[]
      language?: "ko" | "en"
      model?: string
      customInstructions?: string
    }

    if (!selectedConditions || selectedConditions.length === 0) {
      return errorResponse("No selected conditions provided", 400)
    }

    const modelId = modelOverride || DEFAULT_MODEL
    if (!isSupportedModel(modelId)) {
      return errorResponse("Unsupported model id", 400)
    }

    const model = getModel(modelId)
    const normalizedLanguage = language === "ko" ? "ko" : "en"

    const prompt = [
      `Target language: ${normalizedLanguage}`,
      `Selected conditions:\n${JSON.stringify(selectedConditions)}`,
      transcript?.trim()
        ? `Transcript:\n${transcript.slice(-7000)}`
        : "Transcript:\n(No speech recorded yet)",
      doctorNotes?.trim() ? `Doctor notes:\n${doctorNotes}` : "",
      insights ? `Insights:\n${JSON.stringify(insights)}` : "",
      diagnoses ? `Differential diagnoses:\n${JSON.stringify(diagnoses)}` : "",
    ]
      .filter(Boolean)
      .join("\n\n")

    const { text } = await generateText({
      model,
      system: buildSystemPrompt(PATIENT_HANDOUT_SYSTEM_PROMPT, customInstructions),
      prompt,
      ...buildGenerationOptions(modelId, { temperature: 0.2 }),
    })

    const parsedResult = safeParseAIJson<ParsedHandout>(text)
    if (parsedResult.error || !parsedResult.data) {
      return errorResponse("AI returned invalid response format", 502)
    }

    const parsed = parsedResult.data
    const normalizedConditions = selectedConditions.map((condition) => ({
      id: condition.id,
      icdCode: condition.icdCode,
      diseaseName: condition.diseaseName,
      source: condition.source,
    }))

    const response = {
      language: parsed.language === "ko" ? "ko" : "en",
      conditions: normalizedConditions,
      entries: normalizeEntries(normalizedConditions, parsed.entries),
    }

    logAudit({ userId: user.id, action: "READ", resource: "ai_patient_handout" })
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Patient handout generation error:", error)
    return errorResponse("Failed to generate patient handout", 500)
  }
}
