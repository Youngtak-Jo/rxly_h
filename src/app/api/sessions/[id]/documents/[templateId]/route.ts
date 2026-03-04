import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { sessionDocumentSaveSchema } from "@/lib/documents/schema"
import {
  createInitialSessionDocumentIfMissing,
  getSessionDocumentForUser,
  normalizeGenericSessionDocumentContent,
  upsertSessionDocument,
} from "@/lib/documents/server"
import { logAudit } from "@/lib/audit"

async function getGenericTemplateContext(
  userId: string,
  sessionId: string,
  templateId: string
) {
  const result = await getSessionDocumentForUser({
    userId,
    sessionId,
    templateId,
  })

  if (result.template.renderer !== "GENERIC_STRUCTURED") {
    throw new Error("Only generic structured documents are supported")
  }

  const activeVersionId =
    result.installedDocument?.installedVersionId ??
    result.template.latestPublishedVersionId ??
    result.template.latestDraftVersionId
  if (!activeVersionId) {
    throw new Error("Document version not found")
  }

  const activeVersion = await prisma.documentTemplateVersion.findUnique({
    where: { id: activeVersionId },
  })
  if (!activeVersion) {
    throw new Error("Document version not found")
  }

  return {
    ...result,
    activeVersion,
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const { id, templateId } = await params
  try {
    const user = await requireAuth()
    await requireSessionOwnership(id, user.id)
    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const context = await getGenericTemplateContext(user.id, id, templateId)
    const sessionDocument =
      context.sessionDocument ??
      (await createInitialSessionDocumentIfMissing({
        sessionId: id,
        templateId,
        templateVersionId: context.activeVersion.id,
        schema: context.activeVersion.schemaJson as never,
      }))

    logAudit({
      userId: user.id,
      action: "READ",
      resource: "session_document",
      resourceId: sessionDocument.id,
      sessionId: id,
    })

    return NextResponse.json({
      sessionDocument,
      template: context.template,
      installedDocument: context.installedDocument,
      activeVersion: context.activeVersion,
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    if (error instanceof Error && /not found|supported/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    logger.error("Failed to fetch session document", error)
    return NextResponse.json(
      { error: "Failed to fetch session document" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const { id, templateId } = await params
  try {
    const user = await requireAuth()
    await requireSessionOwnership(id, user.id)
    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const parsed = sessionDocumentSaveSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid session document payload" }, { status: 400 })
    }

    const context = await getGenericTemplateContext(user.id, id, templateId)
    const templateVersionId =
      parsed.data.templateVersionId ?? context.activeVersion.id

    const contentJson = normalizeGenericSessionDocumentContent({
      schema: context.activeVersion.schemaJson as never,
      contentJson: parsed.data.contentJson,
    })

    const sessionDocument = await upsertSessionDocument({
      sessionId: id,
      templateId,
      templateVersionId,
      contentJson,
      generatedAt: parsed.data.generatedAt ?? null,
    })

    logAudit({
      userId: user.id,
      action: "UPDATE",
      resource: "session_document",
      resourceId: sessionDocument.id,
      sessionId: id,
    })

    return NextResponse.json(sessionDocument)
  } catch (error) {
    if (error instanceof NextResponse) return error
    if (error instanceof Error && /not found|supported/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    logger.error("Failed to save session document", error)
    return NextResponse.json(
      { error: "Failed to save session document" },
      { status: 500 }
    )
  }
}
