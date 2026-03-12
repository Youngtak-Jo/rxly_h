import {
  ExportLinkAccessMode,
  ExportLinkChannel,
  type ExportLink,
} from "@prisma/client"
import { encryptField } from "@/lib/encryption"
import { prisma } from "@/lib/prisma"
import type { PublicDocumentShareResponse } from "@/types/export"

export class ExportShareError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = "ExportShareError"
    this.status = status
  }
}

interface PublicDocumentShareLookup {
  sessionId: string
  sessionDocumentId: string
  userId: string
}

interface ReplacePublicDocumentShareInput extends PublicDocumentShareLookup {
  standaloneHtml: string
  title: string
}

async function requireOwnedSessionDocument({
  sessionId,
  sessionDocumentId,
  userId,
}: PublicDocumentShareLookup) {
  const sessionDocument = await prisma.sessionDocument.findFirst({
    where: {
      id: sessionDocumentId,
      sessionId,
      session: {
        userId,
      },
    },
    select: {
      id: true,
      sessionId: true,
      title: true,
    },
  })

  if (!sessionDocument) {
    throw new ExportShareError("Session document not found", 404)
  }

  return sessionDocument
}

export async function getActivePublicDocumentShareForUser(
  lookup: PublicDocumentShareLookup
): Promise<ExportLink | null> {
  await requireOwnedSessionDocument(lookup)

  return prisma.exportLink.findFirst({
    where: {
      sessionId: lookup.sessionId,
      sessionDocumentId: lookup.sessionDocumentId,
      accessMode: ExportLinkAccessMode.PUBLIC_LINK,
      channel: ExportLinkChannel.PATIENT_SHARE,
      revokedAt: null,
    },
    orderBy: [{ createdAt: "desc" }],
  })
}

export async function replacePublicDocumentShareForUser(
  input: ReplacePublicDocumentShareInput
): Promise<ExportLink> {
  const sessionDocument = await requireOwnedSessionDocument(input)
  const encryptedContent = encryptField(input.standaloneHtml.trim())

  if (!encryptedContent) {
    throw new ExportShareError("Export content is required", 400)
  }

  const title = input.title.trim() || sessionDocument.title?.trim() || "Shared document"

  return prisma.$transaction(async (tx) => {
    await tx.exportLink.updateMany({
      where: {
        sessionId: input.sessionId,
        sessionDocumentId: input.sessionDocumentId,
        accessMode: ExportLinkAccessMode.PUBLIC_LINK,
        channel: ExportLinkChannel.PATIENT_SHARE,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })

    return tx.exportLink.create({
      data: {
        userId: input.userId,
        sessionId: input.sessionId,
        sessionDocumentId: input.sessionDocumentId,
        title,
        content: encryptedContent,
        accessMode: ExportLinkAccessMode.PUBLIC_LINK,
        channel: ExportLinkChannel.PATIENT_SHARE,
        expiresAt: null,
      },
    })
  })
}

export function buildPublicShareUrl(origin: string, shareId: string): string {
  return new URL(`/share/${shareId}`, origin).toString()
}

export function serializePublicDocumentShare(
  link: ExportLink,
  origin: string
): PublicDocumentShareResponse {
  return {
    shareId: link.id,
    shareUrl: buildPublicShareUrl(origin, link.id),
    title: link.title ?? null,
    createdAt: link.createdAt.toISOString(),
    accessCount: link.accessCount,
    lastAccessedAt: link.lastAccessedAt?.toISOString() ?? null,
    revokedAt: link.revokedAt?.toISOString() ?? null,
  }
}
