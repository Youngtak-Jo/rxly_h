import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { forkDocumentTemplate } from "@/lib/documents/server"
import { logAudit } from "@/lib/audit"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params
  try {
    const user = await requireAuth()
    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const template = await forkDocumentTemplate({
      userId: user.id,
      templateId,
    })

    logAudit({
      userId: user.id,
      action: "CREATE",
      resource: "document_template",
      resourceId: template.id,
      metadata: {
        forkedFromTemplateId: templateId,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    if (error instanceof Error && /not found/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    logger.error("Failed to fork document template", error)
    return NextResponse.json(
      { error: "Failed to fork document template" },
      { status: 500 }
    )
  }
}
