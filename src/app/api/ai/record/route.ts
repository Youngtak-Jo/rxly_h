import { NextResponse } from "next/server"
import { streamObject } from "ai"
import { z } from "zod"
import { DEFAULT_MODEL } from "@/lib/xai"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import { RECORD_SYSTEM_PROMPT } from "@/lib/prompts"
import { buildSystemPrompt } from "@/lib/prompt-sanitizer"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { errorResponse } from "@/lib/api-response"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import type { UserContent } from "ai"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const {
      transcript,
      doctorNotes,
      imageUrls,
      insights,
      existingRecord,
      model: modelOverride,
      customInstructions,
    } = await req.json()

    if (!transcript?.trim() && !doctorNotes?.trim() && (!imageUrls || imageUrls.length === 0)) {
      return errorResponse("No transcript, notes, or images provided", 400)
    }

    const modelId = modelOverride || DEFAULT_MODEL
    if (!isSupportedModel(modelId)) {
      return errorResponse("Unsupported model id", 400)
    }
    const model = getModel(modelId)

    const textContent = [
      transcript?.trim()
        ? `Transcript:\n${transcript}`
        : "Transcript:\n(No speech recorded yet)",
      doctorNotes?.trim()
        ? `\nDoctor's notes (inline annotations during consultation):\n${doctorNotes}`
        : "",
      insights
        ? `\nCurrent insights:\n${JSON.stringify(insights)}`
        : "",
      existingRecord
        ? `\nExisting record to update:\n${JSON.stringify(existingRecord)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n")

    // Build multimodal content: text + images
    const content: UserContent = [{ type: "text", text: textContent }]

    if (imageUrls && imageUrls.length > 0) {
      const findingsSummary = (insights?.keyFindings || []).join("; ") || "None yet"
      content[0] = {
        type: "text",
        text: textContent + `\n\n--- UPLOADED MEDICAL IMAGES ---\nThe doctor has uploaded ${imageUrls.length} medical image(s) during this consultation.\n\nCRITICAL: Analyze each image IN THE CONTEXT of this consultation, not in isolation.\n- Current clinical summary: ${insights?.summary || "Not yet established"}\n- Key findings: ${findingsSummary}\n\nCorrelate image findings with the patient's presenting complaints, transcript discussion, and doctor's notes.\nIncorporate contextual image findings into: physicalExam, labsStudies, assessment, plan.\n--- END IMAGE INSTRUCTIONS ---`,
      }
      for (const url of imageUrls) {
        content.push({ type: "image", image: new URL(url) })
      }
    }

    const systemPrompt = buildSystemPrompt(RECORD_SYSTEM_PROMPT, customInstructions)

    const result = streamObject({
      model,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content,
        },
      ],
      ...buildGenerationOptions(modelId, { temperature: 0.2 }),
      schema: z.object({
        chiefComplaint: z.string().nullable().describe("Primary reason for visit in patient's words"),
        hpiText: z.string().nullable().describe("Detailed history of present illness narrative"),
        medications: z.array(z.string()).nullable().describe("Current medications list. Include both prescription and OTC medications."),
        rosText: z.string().nullable().describe("Review of systems findings"),
        pmh: z.string().nullable().describe("Past medical history"),
        socialHistory: z.string().nullable().describe("Social history (smoking, alcohol, occupation, etc.)"),
        familyHistory: z.string().nullable().describe("Family medical history"),
        vitals: z.object({
          bp: z.string(),
          hr: z.string(),
          temp: z.string(),
          rr: z.string(),
          spo2: z.string(),
        }).nullable(),
        physicalExam: z.string().nullable().describe("Physical examination findings"),
        labsStudies: z.array(z.string()).nullable().describe("Ordered or reviewed labs and studies"),
        assessment: z.array(z.string()).nullable().describe("Clinical assessment with problem list"),
        plan: z.string().nullable().describe("Treatment plan organized by problem")
      })
    })

    logAudit({ userId: user.id, action: "READ", resource: "ai_record" })
    return new Response(result.textStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Record generation error:", error)
    return errorResponse("Failed to generate record", 500)
  }
}
