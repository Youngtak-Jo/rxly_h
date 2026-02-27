import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { parseAdminRange } from "@/lib/admin/metrics"
import { prisma } from "@/lib/prisma"
import type { AdminCohortsResponse } from "@/types/admin"
import { logger } from "@/lib/logger"

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const { from, to } = parseAdminRange(searchParams)
    const mode = searchParams.get("mode")
    const modeFilter = mode === "DOCTOR" || mode === "AI_DOCTOR" ? mode : null

    const firstSeenByUser = await prisma.session.groupBy({
      by: ["userId"],
      where: {
        startedAt: {
          lte: to,
        },
        ...(modeFilter ? { mode: modeFilter } : {}),
      },
      _min: {
        startedAt: true,
      },
    })

    const cohortUsers = firstSeenByUser
      .map((item) => ({
        userId: item.userId,
        firstAt: item._min.startedAt,
      }))
      .filter((item): item is { userId: string; firstAt: Date } => !!item.firstAt)
      .filter((item) => item.firstAt >= from && item.firstAt <= to)

    if (cohortUsers.length === 0) {
      const empty: AdminCohortsResponse = {
        from: from.toISOString(),
        to: to.toISOString(),
        cohorts: [],
      }
      return adminJson(empty)
    }

    const firstByUser = new Map(cohortUsers.map((item) => [item.userId, item.firstAt]))
    const cohortUsersSet = new Set(cohortUsers.map((item) => item.userId))

    const sessions = await prisma.session.findMany({
      where: {
        userId: {
          in: Array.from(cohortUsersSet),
        },
        startedAt: {
          lte: to,
        },
        ...(modeFilter ? { mode: modeFilter } : {}),
      },
      select: {
        userId: true,
        startedAt: true,
      },
    })

    const rows = new Map<
      string,
      {
        cohortSize: number
        d1Users: Set<string>
        d7Users: Set<string>
        d30Users: Set<string>
      }
    >()

    for (const { firstAt } of cohortUsers) {
      const key = dayKey(firstAt)
      const current = rows.get(key) || {
        cohortSize: 0,
        d1Users: new Set<string>(),
        d7Users: new Set<string>(),
        d30Users: new Set<string>(),
      }
      current.cohortSize += 1
      rows.set(key, current)
    }

    for (const session of sessions) {
      const firstAt = firstByUser.get(session.userId)
      if (!firstAt) continue
      if (session.startedAt <= firstAt) continue

      const diffMs = session.startedAt.getTime() - firstAt.getTime()
      const diffDays = diffMs / (24 * 60 * 60 * 1000)
      const key = dayKey(firstAt)
      const current = rows.get(key)
      if (!current) continue

      if (diffDays <= 1) current.d1Users.add(session.userId)
      if (diffDays <= 7) current.d7Users.add(session.userId)
      if (diffDays <= 30) current.d30Users.add(session.userId)
    }

    const payload: AdminCohortsResponse = {
      from: from.toISOString(),
      to: to.toISOString(),
      cohorts: Array.from(rows.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([cohortDate, data]) => ({
          cohortDate,
          cohortSize: data.cohortSize,
          d1: data.cohortSize > 0 ? data.d1Users.size / data.cohortSize : 0,
          d7: data.cohortSize > 0 ? data.d7Users.size / data.cohortSize : 0,
          d30: data.cohortSize > 0 ? data.d30Users.size / data.cohortSize : 0,
        })),
    }

    return adminJson(payload)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to load admin cohorts", error)
    return adminJson({ error: "Failed to load cohorts" }, 500)
  }
}
