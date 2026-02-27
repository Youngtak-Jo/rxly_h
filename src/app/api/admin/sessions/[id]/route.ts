import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { maskSessionDetailPayload } from "@/lib/admin/phi"
import { prisma } from "@/lib/prisma"
import type { AdminSessionDetail } from "@/types/admin"
import { logger } from "@/lib/logger"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    await requireAdmin()

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        insights: true,
        record: true,
        patientHandout: true,
        checklistItems: { orderBy: { sortOrder: "asc" } },
        diagnoses: { orderBy: { sortOrder: "asc" } },
      },
    })

    if (!session) {
      return adminJson({ error: "Session not found" }, 404)
    }

    const [transcriptEntries, notes, researchMessages, auditTimeline, exportLinks] =
      await Promise.all([
        prisma.transcriptEntry.findMany({
          where: { sessionId: id, isFinal: true },
          orderBy: { startTime: "asc" },
        }),
        prisma.note.findMany({
          where: { sessionId: id },
          orderBy: { createdAt: "asc" },
        }),
        prisma.researchMessage.findMany({
          where: { sessionId: id },
          orderBy: { createdAt: "asc" },
        }),
        prisma.auditLog.findMany({
          where: { sessionId: id },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
        prisma.exportLink.findMany({
          where: { sessionId: id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            expiresAt: true,
            accessCount: true,
            createdAt: true,
          },
        }),
      ])

    const detail: AdminSessionDetail = {
      session: {
        ...session,
        exportLinks,
      },
      transcriptEntries,
      insights: session.insights,
      diagnoses: session.diagnoses,
      record: session.record,
      notes,
      researchMessages,
      patientHandout: session.patientHandout,
      checklistItems: session.checklistItems,
      auditTimeline,
    }

    return adminJson(maskSessionDetailPayload(detail))
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch admin session detail", error)
    return adminJson({ error: "Failed to fetch admin session detail" }, 500)
  }
}
