import { NextResponse } from "next/server"
import { streamText } from "ai"
import { logger } from "@/lib/logger"
import { DEFAULT_MODEL } from "@/lib/grok"
import { getModel } from "@/lib/ai-provider"
import { AI_DOCTOR_SYSTEM_PROMPT } from "@/lib/prompts"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { errorResponse } from "@/lib/api-response"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const { messages, model: modelOverride } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return errorResponse("No messages provided", 400)
    }

    const model = getModel(modelOverride || DEFAULT_MODEL)

    const result = streamText({
      model,
      system: AI_DOCTOR_SYSTEM_PROMPT,
      // content can be a plain string or multimodal array [{type:"text",...},{type:"image",...}]
      messages: messages.map((m: { role: string; content: unknown }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      temperature: 0.4,
    })

    logAudit({ userId: user.id, action: "READ", resource: "ai_doctor" })

    return result.toTextStreamResponse()
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("AI Doctor generation error:", error)
    return errorResponse("Failed to generate AI doctor response", 500)
  }
}
