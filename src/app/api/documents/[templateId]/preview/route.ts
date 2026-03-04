import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { getDocumentPreviewForUser } from "@/lib/documents/server"
import { logAudit } from "@/lib/audit"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params
  try {
    const user = await requireAuth()
    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const preview = await getDocumentPreviewForUser({
      userId: user.id,
      templateId,
    })

    logAudit({
      userId: user.id,
      action: "READ",
      resource: "document_template_version",
      resourceId: templateId,
      metadata: {
        mode: "preview",
      },
    })

    return NextResponse.json(preview)
  } catch (error) {
    if (error instanceof NextResponse) return error
    if (error instanceof Error && error.message === "Template not found") {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    logger.error("Failed to fetch document preview", error)
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to fetch document preview",
      },
      { status: 500 }
    )
  }
}
