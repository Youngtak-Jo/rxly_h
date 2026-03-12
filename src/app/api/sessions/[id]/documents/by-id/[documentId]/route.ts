import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { sessionDocumentPatchSchema } from "@/lib/documents/schema"
import {
  getSessionDocumentByIdForUser,
  normalizeGenericSessionDocumentContent,
  upsertSessionDocument,
} from "@/lib/documents/server"
import { logAudit } from "@/lib/audit"
import {
  genericStructuredContentToRichTextDocument,
  isRichTextDocument,
} from "@/lib/documents/rich-text"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const { id, documentId } = await params
  try {
    const user = await requireAuth()
    await requireSessionOwnership(id, user.id)
    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const parsed = sessionDocumentPatchSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid session document payload" },
        { status: 400 }
      )
    }

    const context = await getSessionDocumentByIdForUser({
      userId: user.id,
      sessionId: id,
      documentId,
    })
    if (context.template.renderer !== "GENERIC_STRUCTURED") {
      return NextResponse.json(
        { error: "Only generic structured documents are supported" },
        { status: 400 }
      )
    }

    const targetVersion = parsed.data.templateVersionId
      ? await prisma.documentTemplateVersion.findFirst({
          where: {
            id: parsed.data.templateVersionId,
            templateId: context.template.id,
          },
        })
      : await prisma.documentTemplateVersion.findUnique({
          where: { id: context.sessionDocument.templateVersionId },
        })

    if (!targetVersion) {
      return NextResponse.json(
        { error: "Document version not found" },
        { status: 404 }
      )
    }

    const contentJson = isRichTextDocument(parsed.data.contentJson)
      ? parsed.data.contentJson
      : normalizeGenericSessionDocumentContent({
          schema: targetVersion.schemaJson as never,
          contentJson: parsed.data.contentJson,
        })

    const normalizedDocument = isRichTextDocument(contentJson)
      ? contentJson
      : genericStructuredContentToRichTextDocument({
          contentJson,
          schemaNodes: (targetVersion.schemaJson as { nodes?: never[] }).nodes ?? [],
        })

    const sessionDocument = await upsertSessionDocument({
      documentId: context.sessionDocument.id,
      sessionId: id,
      templateId: context.sessionDocument.templateId,
      instanceKey: context.sessionDocument.instanceKey,
      templateVersionId: targetVersion.id,
      title:
        parsed.data.title !== undefined
          ? parsed.data.title
          : context.sessionDocument.title,
      contentJson: normalizedDocument as Record<string, unknown>,
      generationInputs:
        parsed.data.generationInputs ?? context.sessionDocument.generationInputs,
      generatedAt:
        parsed.data.generatedAt !== undefined
          ? parsed.data.generatedAt
          : context.sessionDocument.generatedAt,
    })

    logAudit({
      userId: user.id,
      action: "UPDATE",
      resource: "session_document",
      resourceId: sessionDocument.id,
      sessionId: id,
    })

    return NextResponse.json({
      sessionDocument,
      activeVersion: targetVersion,
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    if (
      error instanceof Error &&
      /not found|supported|installed/i.test(error.message)
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    logger.error("Failed to save session document by id", error)
    return NextResponse.json(
      { error: "Failed to save session document" },
      { status: 500 }
    )
  }
}
