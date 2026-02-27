import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { getIncidentActivities, updateIncident } from "@/lib/admin/incidents"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

const patchSchema = z.object({
  status: z
    .enum(["NEW", "ACK", "IN_PROGRESS", "RESOLVED", "DISMISSED"])
    .optional(),
  ownerId: z.string().trim().max(200).nullable().optional(),
  priority: z.enum(["P1", "P2", "P3"]).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  resolutionNote: z.string().max(4000).nullable().optional(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    await requireAdmin()

    const incident = await prisma.adminAlertIncident.findUnique({
      where: { id },
      select: {
        id: true,
        fingerprint: true,
        rule: true,
        severity: true,
        priority: true,
        userId: true,
        sessionId: true,
        title: true,
        description: true,
        metadata: true,
        firstSeenAt: true,
        lastSeenAt: true,
        occurrenceCount: true,
        status: true,
        ownerId: true,
        dueAt: true,
        resolutionNote: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!incident) {
      return adminJson({ error: "Incident not found" }, 404)
    }

    const activities = await getIncidentActivities(id)

    return adminJson({
      ...incident,
      firstSeenAt: incident.firstSeenAt.toISOString(),
      lastSeenAt: incident.lastSeenAt.toISOString(),
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString(),
      dueAt: incident.dueAt ? incident.dueAt.toISOString() : null,
      activities,
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch admin incident", error)
    return adminJson({ error: "Failed to fetch incident" }, 500)
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const adminUser = await requireAdmin()

    const payload = await req.json()
    const parsed = patchSchema.safeParse(payload)
    if (!parsed.success) {
      return adminJson({ error: "Invalid payload" }, 400)
    }

    const updated = await updateIncident({
      incidentId: id,
      actorId: adminUser.id,
      status: parsed.data.status,
      ownerId: parsed.data.ownerId,
      priority: parsed.data.priority,
      dueAt: parsed.data.dueAt,
      resolutionNote: parsed.data.resolutionNote,
    })

    if (!updated) {
      return adminJson({ error: "Incident not found" }, 404)
    }

    return adminJson(updated)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to update admin incident", error)
    return adminJson({ error: "Failed to update incident" }, 500)
  }
}
