import { NextResponse } from "next/server"
import { streamText } from "ai"
import { DEFAULT_MODEL } from "@/lib/grok"
import { getModel } from "@/lib/ai-provider"
import { RECORD_SYSTEM_PROMPT } from "@/lib/prompts"
import { buildSystemPrompt } from "@/lib/prompt-sanitizer"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { errorResponse } from "@/lib/api-response"
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

    const model = getModel(modelOverride || DEFAULT_MODEL)

    const textContent = [
      transcript?.trim()
        ? `Transcript:\n${(transcript as string).slice(-6000)}`
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

    const result = streamText({
      model,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content,
        },
      ],
      temperature: 0.2,
    })

    logAudit({ userId: user.id, action: "READ", resource: "ai_record" })
    return result.toTextStreamResponse()
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Record generation error:", error)
    return errorResponse("Failed to generate record", 500)
  }
}
