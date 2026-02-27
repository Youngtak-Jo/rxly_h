import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { getNestedValue, isRevealAllowedField } from "@/lib/admin/phi"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { decryptField } from "@/lib/encryption"
import type { PhiRevealResponse } from "@/types/admin"
import { logger } from "@/lib/logger"

const revealSchema = z.object({
  entityType: z.enum([
    "session",
    "transcriptEntry",
    "insights",
    "consultationRecord",
    "patientHandout",
    "note",
    "researchMessage",
    "diagnosis",
    "checklistItem",
    "exportLink",
  ]),
  entityId: z.string().min(1),
  fieldPath: z.string().min(1),
  reason: z.string().min(3).max(500),
})

async function loadEntity(entityType: z.infer<typeof revealSchema>["entityType"], entityId: string) {
  switch (entityType) {
    case "session":
      return prisma.session.findUnique({ where: { id: entityId } })
    case "transcriptEntry":
      return prisma.transcriptEntry.findUnique({ where: { id: entityId } })
    case "insights":
      return prisma.insights.findUnique({ where: { id: entityId } })
    case "consultationRecord":
      return prisma.consultationRecord.findUnique({ where: { id: entityId } })
    case "patientHandout":
      return prisma.patientHandout.findUnique({ where: { id: entityId } })
    case "note":
      return prisma.note.findUnique({ where: { id: entityId } })
    case "researchMessage":
      return prisma.researchMessage.findUnique({ where: { id: entityId } })
    case "diagnosis":
      return prisma.diagnosis.findUnique({ where: { id: entityId } })
    case "checklistItem":
      return prisma.checklistItem.findUnique({ where: { id: entityId } })
    case "exportLink":
      return prisma.exportLink.findUnique({ where: { id: entityId } })
    default:
      return null
  }
}

function extractSessionId(record: unknown): string | undefined {
  if (!record || typeof record !== "object") return undefined
  const value = (record as Record<string, unknown>).sessionId
  return typeof value === "string" ? value : undefined
}

export async function POST(req: Request) {
  try {
    const adminUser = await requireAdmin()

    const body = await req.json()
    const parsed = revealSchema.safeParse(body)
    if (!parsed.success) {
      return adminJson({ error: "Invalid reveal payload" }, 400)
    }

    const { entityType, entityId, fieldPath, reason } = parsed.data

    if (!isRevealAllowedField(entityType, fieldPath)) {
      return adminJson({ error: "Field reveal is not allowed" }, 400)
    }

    const record = await loadEntity(entityType, entityId)
    if (!record) {
      return adminJson({ error: "Entity not found" }, 404)
    }

    let value = getNestedValue(record, fieldPath)

    if (entityType === "exportLink" && fieldPath === "content" && typeof value === "string") {
      value = decryptField(value)
    }

    if (value === undefined) {
      return adminJson({ error: "Field not found" }, 404)
    }

    logAudit({
      userId: adminUser.id,
      action: "READ",
      resource: "admin_phi_reveal",
      resourceId: entityId,
      sessionId: extractSessionId(record),
      metadata: {
        entityType,
        entityId,
        fieldPath,
        reason,
        adminUserId: adminUser.id,
        timestamp: new Date().toISOString(),
      },
      success: true,
    })

    const response: PhiRevealResponse = {
      entityType,
      entityId,
      fieldPath,
      value,
    }

    return adminJson(response)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to reveal PHI field", error)
    return adminJson({ error: "Failed to reveal field" }, 500)
  }
}
