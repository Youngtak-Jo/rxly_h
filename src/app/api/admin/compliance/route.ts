import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { parseAdminRange } from "@/lib/admin/metrics"
import { prisma } from "@/lib/prisma"
import type { AdminComplianceResponse } from "@/types/admin"
import { logger } from "@/lib/logger"

function toMetadataRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const { from, to } = parseAdminRange(searchParams)
    const mode = searchParams.get("mode")
    const modeFilter = mode === "DOCTOR" || mode === "AI_DOCTOR" ? mode : null

    const scopedSessionIds = modeFilter
      ? new Set(
          (
            await prisma.session.findMany({
              where: {
                mode: modeFilter,
              },
              select: { id: true },
            })
          ).map((row) => row.id)
        )
      : null

    const [revealLogsRaw, exportLinksRaw] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          resource: "admin_phi_reveal",
          createdAt: {
            gte: from,
            lte: to,
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 200,
        select: {
          id: true,
          userId: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.exportLink.findMany({
        where: {
          createdAt: {
            gte: from,
            lte: to,
          },
        },
        select: {
          userId: true,
          sessionId: true,
          accessCount: true,
        },
      }),
    ])

    const revealLogs = revealLogsRaw.map((row) => {
      const metadata = toMetadataRecord(row.metadata)
      return {
        id: row.id,
        adminUserId: row.userId,
        entityType:
          typeof metadata.entityType === "string" ? metadata.entityType : undefined,
        entityId:
          typeof metadata.entityId === "string" ? metadata.entityId : undefined,
        fieldPath:
          typeof metadata.fieldPath === "string" ? metadata.fieldPath : undefined,
        reason: typeof metadata.reason === "string" ? metadata.reason : undefined,
        createdAt: row.createdAt.toISOString(),
      }
    })

    const groupedSignals = new Map<string, { exportCount: number; accessTotal: number }>()

    for (const row of exportLinksRaw) {
      if (scopedSessionIds && !scopedSessionIds.has(row.sessionId)) continue

      const current = groupedSignals.get(row.userId) || {
        exportCount: 0,
        accessTotal: 0,
      }
      current.exportCount += 1
      current.accessTotal += row.accessCount
      groupedSignals.set(row.userId, current)
    }

    const response: AdminComplianceResponse = {
      from: from.toISOString(),
      to: to.toISOString(),
      revealLogs,
      exportSignals: Array.from(groupedSignals.entries())
        .map(([userId, value]) => ({
          userId,
          exportCount: value.exportCount,
          avgAccessCount:
            value.exportCount > 0 ? value.accessTotal / value.exportCount : 0,
        }))
        .sort((a, b) => {
          if (b.exportCount !== a.exportCount) return b.exportCount - a.exportCount
          return b.avgAccessCount - a.avgAccessCount
        })
        .slice(0, 100),
    }

    return adminJson(response)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to load admin compliance", error)
    return adminJson({ error: "Failed to load compliance data" }, 500)
  }
}
