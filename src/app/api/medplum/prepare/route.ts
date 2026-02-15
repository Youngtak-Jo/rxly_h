import { NextResponse } from "next/server"
import { generateText } from "ai"
import { logger } from "@/lib/logger"
import { CLAUDE_MODEL } from "@/lib/anthropic"
import { getModel } from "@/lib/ai-provider"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { errorResponse } from "@/lib/api-response"
import { FHIR_MAPPING_SYSTEM_PROMPT } from "@/lib/prompts"
import { buildClinicalDataPrompt } from "@/lib/medplum-utils"
import type { Bundle } from "@medplum/fhirtypes"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const { session, record, insights, diagnoses, transcript, model: modelOverride } =
      await req.json()

    if (!session) {
      return errorResponse("No session data provided", 400)
    }

    const clinicalData = buildClinicalDataPrompt({
      session,
      record,
      insights,
      diagnoses,
      transcript,
    })

    const model = getModel(modelOverride || CLAUDE_MODEL)
    const { text } = await generateText({
      model,
      system: FHIR_MAPPING_SYSTEM_PROMPT,
      prompt: clinicalData,
      temperature: 0.1,
      maxOutputTokens: 8000,
    })

    let bundle: Bundle
    try {
      const cleaned = text
        .replace(/^```(?:json)?\s*\n?/, "")
        .replace(/\n?```\s*$/, "")
      bundle = JSON.parse(cleaned)
    } catch {
      logger.error("Medplum prepare: AI returned invalid JSON")
      return errorResponse("AI returned invalid FHIR Bundle format", 502)
    }

    if (
      bundle.resourceType !== "Bundle" ||
      !bundle.entry ||
      bundle.entry.length === 0
    ) {
      return errorResponse("AI generated empty or invalid Bundle", 502)
    }

    logAudit({
      userId: user.id,
      action: "CREATE",
      resource: "medplum_prepare",
    })

    return NextResponse.json({ bundle })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Medplum prepare error:", error)
    return errorResponse("Failed to prepare FHIR data", 500)
  }
}
