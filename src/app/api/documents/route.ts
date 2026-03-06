import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { documentTemplateCreateSchema } from "@/lib/documents/schema"
import { createDocumentTemplateDraft } from "@/lib/documents/server"
import { logAudit } from "@/lib/audit"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()
    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const parsed = documentTemplateCreateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid document draft" }, { status: 400 })
    }

    const template = await createDocumentTemplateDraft({
      userId: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      language: parsed.data.language,
      region: parsed.data.region,
      renderer: "GENERIC_STRUCTURED",
      schema: parsed.data.schema,
      generationConfig: parsed.data.generationConfig,
      previewContent: parsed.data.previewContent,
      previewLocale: parsed.data.previewLocale,
      previewModelId: parsed.data.previewModelId,
      previewGeneratedAt: parsed.data.previewGeneratedAt,
      previewInputChecksum: parsed.data.previewInputChecksum,
    })

    logAudit({
      userId: user.id,
      action: "CREATE",
      resource: "document_template",
      resourceId: template.id,
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to create document template", error)
    return NextResponse.json(
      { error: "Failed to create document template" },
      { status: 500 }
    )
  }
}
