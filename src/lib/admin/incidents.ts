import type {
  AdminIncidentPriority,
  AdminIncidentRow,
  AdminIncidentStatus,
  AdminInsightAlert,
  AdminSeverity,
} from "@/types/admin"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { priorityFromSeverity } from "@/lib/admin/risk"

function normalizeSeverity(
  severity: AdminInsightAlert["severity"]
): Exclude<AdminSeverity, "all"> {
  return severity
}

function normalizePriority(
  priority: AdminIncidentPriority | null | undefined,
  severity: AdminInsightAlert["severity"]
): Exclude<AdminIncidentPriority, "all"> {
  if (priority === "P1" || priority === "P2" || priority === "P3") {
    return priority
  }
  return priorityFromSeverity(severity)
}

function normalizeStatus(
  status: AdminIncidentStatus | null | undefined
): Exclude<AdminIncidentStatus, "all"> {
  if (
    status === "NEW" ||
    status === "ACK" ||
    status === "IN_PROGRESS" ||
    status === "RESOLVED" ||
    status === "DISMISSED"
  ) {
    return status
  }
  return "NEW"
}

function incidentFingerprint(alert: AdminInsightAlert): string {
  return `${alert.rule}:${alert.userId || "none"}:${alert.sessionId || "none"}`
}

function asJson(
  value: unknown
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined
  return value as Prisma.InputJsonValue
}

function mapIncidentRow(
  incident: {
    id: string
    fingerprint: string
    rule: string
    severity: string
    priority: "P1" | "P2" | "P3"
    userId: string | null
    sessionId: string | null
    title: string
    description: string
    metadata: unknown
    firstSeenAt: Date
    lastSeenAt: Date
    occurrenceCount: number
    status: "NEW" | "ACK" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED"
    ownerId: string | null
    dueAt: Date | null
    resolutionNote: string | null
    createdAt: Date
    updatedAt: Date
  }
): AdminIncidentRow {
  return {
    id: incident.id,
    fingerprint: incident.fingerprint,
    rule: incident.rule,
    severity: normalizeSeverity(
      incident.severity as AdminInsightAlert["severity"]
    ),
    priority: incident.priority,
    userId: incident.userId,
    sessionId: incident.sessionId,
    title: incident.title,
    description: incident.description,
    metadata:
      incident.metadata && typeof incident.metadata === "object"
        ? (incident.metadata as Record<string, unknown>)
        : null,
    firstSeenAt: incident.firstSeenAt.toISOString(),
    lastSeenAt: incident.lastSeenAt.toISOString(),
    occurrenceCount: incident.occurrenceCount,
    status: incident.status,
    ownerId: incident.ownerId,
    dueAt: incident.dueAt ? incident.dueAt.toISOString() : null,
    resolutionNote: incident.resolutionNote,
    createdAt: incident.createdAt.toISOString(),
    updatedAt: incident.updatedAt.toISOString(),
  }
}

export async function syncIncidentsFromAlerts(input: {
  alerts: AdminInsightAlert[]
  actorId: string
}) {
  const now = new Date()
  const fingerprints = Array.from(
    new Set(input.alerts.map((alert) => incidentFingerprint(alert)))
  )

  const existing = fingerprints.length
    ? await prisma.adminAlertIncident.findMany({
        where: {
          fingerprint: { in: fingerprints },
        },
        select: {
          id: true,
          fingerprint: true,
          status: true,
        },
      })
    : []
  const existingByFingerprint = new Map(
    existing.map((incident) => [incident.fingerprint, incident])
  )

  let created = 0
  let updated = 0

  await prisma.$transaction(async (tx) => {
    for (const alert of input.alerts) {
      const fingerprint = incidentFingerprint(alert)
      const prev = existingByFingerprint.get(fingerprint)

      if (!prev) {
        const createdIncident = await tx.adminAlertIncident.create({
          data: {
            fingerprint,
            rule: alert.rule,
            severity: normalizeSeverity(alert.severity),
            priority: normalizePriority(undefined, alert.severity),
            title: alert.title,
            description: alert.description,
            metadata: asJson(alert.metadata),
            userId: alert.userId ?? null,
            sessionId: alert.sessionId ?? null,
            firstSeenAt: now,
            lastSeenAt: now,
            occurrenceCount: 1,
            status: "NEW",
          },
          select: { id: true },
        })

        await tx.adminIncidentActivity.create({
          data: {
            incidentId: createdIncident.id,
            actorId: input.actorId,
            action: "INCIDENT_CREATED",
            metadata: asJson({
              rule: alert.rule,
              severity: alert.severity,
            }),
          },
        })

        created += 1
        continue
      }

      const shouldReopen = prev.status === "RESOLVED" || prev.status === "DISMISSED"
      await tx.adminAlertIncident.update({
        where: { id: prev.id },
        data: {
          rule: alert.rule,
          severity: normalizeSeverity(alert.severity),
          priority: normalizePriority(undefined, alert.severity),
          title: alert.title,
          description: alert.description,
          metadata: asJson(alert.metadata),
          userId: alert.userId ?? null,
          sessionId: alert.sessionId ?? null,
          lastSeenAt: now,
          occurrenceCount: { increment: 1 },
          ...(shouldReopen
            ? {
                status: "NEW",
                resolutionNote: null,
              }
            : {}),
        },
      })

      await tx.adminIncidentActivity.create({
        data: {
          incidentId: prev.id,
          actorId: input.actorId,
          action: shouldReopen ? "INCIDENT_REOPENED" : "INCIDENT_SEEN",
          metadata: asJson({
            rule: alert.rule,
            severity: alert.severity,
          }),
        },
      })

      updated += 1
    }
  })

  return {
    created,
    updated,
    total: input.alerts.length,
  }
}

function parseLimit(value: string | null): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 25
  return Math.min(100, Math.floor(n))
}

function parseCursor(value: string | null): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.floor(n)
}

export async function listIncidents(input: {
  from: Date
  to: Date
  severity: AdminSeverity
  status: AdminIncidentStatus
  priority: AdminIncidentPriority
  owner: string
  rule: string
  q: string
  order: "asc" | "desc"
  cursor: string | null
  limit: string | null
}) {
  const where = {
    lastSeenAt: {
      gte: input.from,
      lte: input.to,
    },
    ...(input.severity !== "all" ? { severity: input.severity } : {}),
    ...(input.status !== "all" ? { status: input.status } : {}),
    ...(input.priority !== "all" ? { priority: input.priority } : {}),
    ...(input.owner ? { ownerId: input.owner } : {}),
    ...(input.rule ? { rule: input.rule } : {}),
    ...(input.q
      ? {
          OR: [
            { rule: { contains: input.q, mode: "insensitive" as const } },
            { title: { contains: input.q, mode: "insensitive" as const } },
            { description: { contains: input.q, mode: "insensitive" as const } },
            { userId: { contains: input.q, mode: "insensitive" as const } },
            { sessionId: { contains: input.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const limit = parseLimit(input.limit)
  const offset = parseCursor(input.cursor)

  const [rows, totalCount, openCount] = await Promise.all([
    prisma.adminAlertIncident.findMany({
      where,
      orderBy: [
        { priority: "asc" },
        { lastSeenAt: input.order },
      ],
      skip: offset,
      take: limit,
    }),
    prisma.adminAlertIncident.count({ where }),
    prisma.adminAlertIncident.count({
      where: {
        ...where,
        status: {
          in: ["NEW", "ACK", "IN_PROGRESS"],
        },
      },
    }),
  ])

  return {
    rows: rows.map(mapIncidentRow),
    totalCount,
    openCount,
    nextCursor: offset + limit < totalCount ? String(offset + limit) : null,
  }
}

export async function getIncidentActivities(incidentId: string) {
  const rows = await prisma.adminIncidentActivity.findMany({
    where: { incidentId },
    orderBy: [{ createdAt: "desc" }],
    take: 50,
  })

  return rows.map((row) => ({
    id: row.id,
    incidentId: row.incidentId,
    actorId: row.actorId,
    action: row.action,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : null,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function updateIncident(input: {
  incidentId: string
  actorId: string
  status?: AdminIncidentStatus
  ownerId?: string | null
  priority?: AdminIncidentPriority
  dueAt?: string | null
  resolutionNote?: string | null
}) {
  const existing = await prisma.adminAlertIncident.findUnique({
    where: { id: input.incidentId },
  })
  if (!existing) return null

  const nextStatus =
    input.status === undefined ? undefined : normalizeStatus(input.status)
  const nextPriority =
    input.priority === undefined
      ? undefined
      : normalizePriority(input.priority, existing.severity as AdminInsightAlert["severity"])

  const nextDueAt =
    input.dueAt === undefined
      ? undefined
      : input.dueAt
        ? new Date(input.dueAt)
        : null

  const payload: Prisma.AdminAlertIncidentUpdateInput = {}
  const changes: Record<string, unknown> = {}
  if (nextStatus !== undefined) payload.status = nextStatus
  if (nextStatus !== undefined) changes.status = nextStatus
  if (input.ownerId !== undefined) {
    const ownerId = input.ownerId || null
    payload.ownerId = ownerId
    changes.ownerId = ownerId
  }
  if (nextPriority !== undefined) payload.priority = nextPriority
  if (nextPriority !== undefined) changes.priority = nextPriority
  if (nextDueAt !== undefined) payload.dueAt = nextDueAt
  if (nextDueAt !== undefined) changes.dueAt = nextDueAt ? nextDueAt.toISOString() : null
  if (input.resolutionNote !== undefined) {
    const resolutionNote = input.resolutionNote || null
    payload.resolutionNote = resolutionNote
    changes.resolutionNote = resolutionNote
  }

  if (Object.keys(payload).length === 0) {
    return mapIncidentRow(existing)
  }

  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.adminAlertIncident.update({
      where: { id: input.incidentId },
      data: payload,
    })

    await tx.adminIncidentActivity.create({
      data: {
        incidentId: input.incidentId,
        actorId: input.actorId,
        action: "INCIDENT_UPDATED",
        metadata: asJson({
          changes,
        }),
      },
    })

    return record
  })

  return mapIncidentRow(updated)
}
