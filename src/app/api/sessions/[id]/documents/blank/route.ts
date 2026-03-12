import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { logAudit } from "@/lib/audit"
import { sessionDocumentBlankCreateSchema } from "@/lib/documents/schema"
import { createBlankSessionDocument } from "@/lib/documents/server"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth()
    await requireSessionOwnership(id, user.id)

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const parsed = sessionDocumentBlankCreateSchema.safeParse(
      await req.json().catch(() => ({}))
    )
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid blank document payload" },
        { status: 400 }
      )
    }

    const sessionDocument = await createBlankSessionDocument({
      sessionId: id,
      title: parsed.data.title ?? null,
    })

    logAudit({
      userId: user.id,
      action: "CREATE",
      resource: "session_document",
      resourceId: sessionDocument.id,
      sessionId: id,
    })

    return NextResponse.json({ sessionDocument })
  } catch (error) {
    if (error instanceof NextResponse) return error
    if (
      error instanceof Error &&
      /restart the development server/i.test(error.message)
    ) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    logger.error("Failed to create blank session document", error)
    return NextResponse.json(
      { error: "Failed to create blank session document" },
      { status: 500 }
    )
  }
}
