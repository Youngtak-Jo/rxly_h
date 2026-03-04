import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { generateDocumentPreviewSnapshot } from "@/lib/documents/ai-preview"
import { buildDocumentPreviewInputChecksum } from "@/lib/documents/preview-checksum"
import {
  getDocumentTemplateForUser,
  patchDocumentTemplateDraft,
  publishDocumentTemplate,
} from "@/lib/documents/server"
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

    const body = (await req.json().catch(() => ({}))) as {
      locale?: string
      model?: string
    }
    const locale = body.locale?.trim() || "en"
    const detail = await getDocumentTemplateForUser(user.id, templateId)
    const draftVersion = detail.latestDraftVersion
    if (!draftVersion) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    const previewChecksum = buildDocumentPreviewInputChecksum({
      title: detail.template.title,
      description: detail.template.description,
      category: detail.template.category,
      schema: draftVersion.schemaJson,
      generationConfig: draftVersion.generationConfigJson,
      locale,
    })

    if (
      !draftVersion.previewContentJson ||
      draftVersion.previewInputChecksum !== previewChecksum
    ) {
      const preview = await generateDocumentPreviewSnapshot({
        userId: user.id,
        draft: {
          title: detail.template.title,
          description: detail.template.description,
          iconKey: detail.template.iconKey,
          category: detail.template.category,
          visibility: detail.template.visibility,
          schema: draftVersion.schemaJson,
          generationConfig: draftVersion.generationConfigJson,
        },
        locale,
        model: body.model,
      })

      await patchDocumentTemplateDraft({
        userId: user.id,
        templateId,
        previewContent: preview.previewContent,
        previewCaseSummary: preview.previewCaseSummary,
        previewLocale: preview.previewLocale,
        previewModelId: preview.previewModelId,
        previewGeneratedAt: preview.previewGeneratedAt,
        previewInputChecksum: preview.previewInputChecksum,
      })
    }

    const template = await publishDocumentTemplate({
      userId: user.id,
      templateId,
    })

    logAudit({
      userId: user.id,
      action: "UPDATE",
      resource: "document_template_version",
      resourceId: template.latestPublishedVersionId ?? template.id,
      metadata: {
        templateId,
        publishedVersionId: template.latestPublishedVersionId,
      },
    })
    return NextResponse.json(template)
  } catch (error) {
    if (error instanceof NextResponse) return error
    if (error instanceof Error && error.message === "Draft not found") {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }
    logger.error("Failed to publish document template", error)
    return NextResponse.json(
      { error: "Failed to publish document template" },
      { status: 500 }
    )
  }
}
