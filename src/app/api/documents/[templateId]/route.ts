import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import {
  deleteDocumentTemplate,
  getDocumentTemplateForUser,
  patchDocumentTemplateDraft,
} from "@/lib/documents/server"
import { documentTemplatePatchSchema } from "@/lib/documents/schema"
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

    const result = await getDocumentTemplateForUser(user.id, templateId)
    logAudit({
      userId: user.id,
      action: "READ",
      resource: "document_template",
      resourceId: templateId,
    })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof NextResponse) return error
    if (error instanceof Error && error.message === "Template not found") {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    logger.error("Failed to fetch document template", error)
    return NextResponse.json(
      { error: "Failed to fetch document template" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params
  try {
    const user = await requireAuth()
    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const parsed = documentTemplatePatchSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid template patch" }, { status: 400 })
    }

    const template = await patchDocumentTemplateDraft({
      userId: user.id,
      templateId,
      title: parsed.data.title,
      description: parsed.data.description,
      iconKey: parsed.data.iconKey,
      category: parsed.data.category,
      visibility: parsed.data.visibility,
      schema: parsed.data.schema,
      generationConfig: parsed.data.generationConfig,
      changelog: parsed.data.changelog,
      previewContent: parsed.data.previewContent,
      previewCaseSummary: parsed.data.previewCaseSummary,
      previewLocale: parsed.data.previewLocale,
      previewModelId: parsed.data.previewModelId,
      previewGeneratedAt: parsed.data.previewGeneratedAt,
      previewInputChecksum: parsed.data.previewInputChecksum,
    })

    logAudit({
      userId: user.id,
      action: "UPDATE",
      resource: "document_template",
      resourceId: templateId,
    })

    return NextResponse.json(template)
  } catch (error) {
    if (error instanceof NextResponse) return error
    if (error instanceof Error && error.message === "Template not found") {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    logger.error("Failed to patch document template", error)
    return NextResponse.json(
      { error: "Failed to patch document template" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params
  try {
    const user = await requireAuth()
    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    await deleteDocumentTemplate({
      userId: user.id,
      templateId,
    })

    logAudit({
      userId: user.id,
      action: "DELETE",
      resource: "document_template",
      resourceId: templateId,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof NextResponse) return error
    if (error instanceof Error && error.message === "Template not found") {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    logger.error("Failed to delete document template", error)
    return NextResponse.json(
      { error: "Failed to delete document template" },
      { status: 500 }
    )
  }
}
