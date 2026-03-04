import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { documentAiPreviewSchema } from "@/lib/documents/schema"
import { generateDocumentPreviewSnapshot } from "@/lib/documents/ai-preview"
import { logAudit } from "@/lib/audit"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()
    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const parsed = documentAiPreviewSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid preview request" }, { status: 400 })
    }

    const preview = await generateDocumentPreviewSnapshot({
      userId: user.id,
      draft: parsed.data.draft,
      locale: parsed.data.locale,
      model: parsed.data.model,
    })

    logAudit({
      userId: user.id,
      action: "READ",
      resource: "ai_document",
      metadata: {
        mode: "preview",
      },
    })

    return NextResponse.json(preview)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to build AI document preview", error)
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to build AI document preview",
      },
      { status: 500 }
    )
  }
}
