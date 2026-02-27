import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import {
  buildSessionSignals,
  matchesFeatureFilter,
  buildUserActivity,
  getExportSpikeUsers,
  parseAdminRange,
} from "@/lib/admin/metrics"
import { buildDormantPowerUserAlerts, buildSessionAlerts } from "@/lib/admin/insight-rules"
import { normalizeAdminFeature } from "@/lib/admin/feature"
import { listSupabaseUsersMap } from "@/lib/admin/supabase-admin"
import { loadTranscriptStatsBySessionIds } from "@/lib/admin/transcript-stats"
import { calculateRiskScore, normalizeRiskBand, riskBandFromSeverities } from "@/lib/admin/risk"
import { prisma } from "@/lib/prisma"
import type { AdminMode, AdminUserRow, AdminUsersResponse, AdminUsersSort } from "@/types/admin"
import { logger } from "@/lib/logger"

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

function parseUsersSort(value: string | null): AdminUsersSort {
  if (
    value === "sessions" ||
    value === "completion" ||
    value === "ai" ||
    value === "lastActive" ||
    value === "risk"
  ) {
    return value
  }
  return "sessions"
}

function parseOrder(value: string | null): "asc" | "desc" {
  return value === "asc" ? "asc" : "desc"
}

function compareNumbers(a: number, b: number, order: "asc" | "desc"): number {
  return order === "asc" ? a - b : b - a
}

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const { from, to } = parseAdminRange(searchParams)
    const modeParam = searchParams.get("mode")
    const selectedMode: AdminMode =
      modeParam === "DOCTOR" || modeParam === "AI_DOCTOR" ? modeParam : "ALL"
    const feature = normalizeAdminFeature(searchParams.get("feature"))
    const q = (searchParams.get("q") || "").trim().toLowerCase()
    const limit = parseLimit(searchParams.get("limit"))
    const offset = parseCursor(searchParams.get("cursor"))
    const usersSort = parseUsersSort(searchParams.get("usersSort"))
    const order = parseOrder(searchParams.get("order"))
    const riskBand = normalizeRiskBand(searchParams.get("riskBand"))

    const sessions = await prisma.session.findMany({
      where: {
        startedAt: {
          gte: from,
          lte: to,
        },
        ...(selectedMode !== "ALL" ? { mode: selectedMode } : {}),
      },
      select: {
        id: true,
        userId: true,
        startedAt: true,
        updatedAt: true,
        insights: { select: { redFlags: true } },
        diagnoses: { select: { id: true } },
        record: {
          select: {
            chiefComplaint: true,
            hpiText: true,
            assessment: true,
            plan: true,
          },
        },
        researchMessages: { select: { id: true } },
        patientHandout: { select: { entries: true } },
      },
    })

    const sessionIds = sessions.map((session) => session.id)

    const [aiAudits, exportLinks, usersMap, recentSessions, transcriptStatsBySession] =
      await Promise.all([
        sessionIds.length
          ? prisma.auditLog.findMany({
              where: {
                createdAt: {
                  gte: from,
                  lte: to,
                },
                sessionId: { in: sessionIds },
                resource: { startsWith: "ai_" },
              },
              select: {
                sessionId: true,
              },
            })
          : Promise.resolve([]),
        sessionIds.length
          ? prisma.exportLink.findMany({
              where: {
                createdAt: {
                  gte: from,
                  lte: to,
                },
                sessionId: { in: sessionIds },
              },
              select: {
                sessionId: true,
                userId: true,
              },
            })
          : Promise.resolve([]),
        listSupabaseUsersMap(),
        prisma.session.findMany({
          where: {
            startedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
            ...(selectedMode !== "ALL" ? { mode: selectedMode } : {}),
          },
          select: {
            userId: true,
            startedAt: true,
          },
        }),
        loadTranscriptStatsBySessionIds(sessionIds),
      ])

    const aiCallsBySession = new Map<string, number>()
    for (const audit of aiAudits) {
      if (audit.sessionId) {
        aiCallsBySession.set(
          audit.sessionId,
          (aiCallsBySession.get(audit.sessionId) ?? 0) + 1
        )
      }
    }

    const exportsBySession = new Map<string, number>()
    for (const exportLink of exportLinks) {
      exportsBySession.set(
        exportLink.sessionId,
        (exportsBySession.get(exportLink.sessionId) ?? 0) + 1
      )
    }

    const signals = buildSessionSignals(
      sessions,
      aiCallsBySession,
      exportsBySession,
      transcriptStatsBySession
    )

    const filteredSignals =
      feature === "all"
        ? signals
        : signals.filter((signal) => matchesFeatureFilter(feature, signal))

    const filteredSessionIds = new Set(
      filteredSignals.map((signal) => signal.sessionId)
    )
    const filteredExportLinks = exportLinks.filter((link) =>
      filteredSessionIds.has(link.sessionId)
    )

    const exportsByUser = new Map<string, number>()
    for (const link of filteredExportLinks) {
      exportsByUser.set(link.userId, (exportsByUser.get(link.userId) ?? 0) + 1)
    }
    const exportSpikeUsers = getExportSpikeUsers(exportsByUser)
    const sessionAlerts = buildSessionAlerts(filteredSignals, exportSpikeUsers)
    const dormantAlerts =
      feature === "all"
        ? buildDormantPowerUserAlerts(buildUserActivity(recentSessions))
        : []

    const severityByUser = new Map<string, Array<"high" | "medium" | "low" | "positive">>()
    const riskByUser = new Map<string, Set<string>>()
    for (const alert of [...sessionAlerts, ...dormantAlerts]) {
      if (!alert.userId) continue
      const flags = riskByUser.get(alert.userId) ?? new Set<string>()
      flags.add(alert.rule)
      riskByUser.set(alert.userId, flags)

      const severities = severityByUser.get(alert.userId) ?? []
      severities.push(alert.severity)
      severityByUser.set(alert.userId, severities)
    }

    const grouped = new Map<
      string,
      {
        sessionCount: number
        completedCount: number
        lastActiveAt: Date | null
        redFlagCount: number
      }
    >()
    const aiCallsByUser = new Map<string, number>()

    for (const signal of filteredSignals) {
      const current = grouped.get(signal.userId) || {
        sessionCount: 0,
        completedCount: 0,
        lastActiveAt: null,
        redFlagCount: 0,
      }

      current.sessionCount += 1
      if (signal.recordHasPlan || signal.recordHasAssessment) {
        current.completedCount += 1
      }

      current.redFlagCount += signal.redFlagCount

      if (!current.lastActiveAt || signal.updatedAt > current.lastActiveAt) {
        current.lastActiveAt = signal.updatedAt
      }

      grouped.set(signal.userId, current)
      aiCallsByUser.set(
        signal.userId,
        (aiCallsByUser.get(signal.userId) ?? 0) + signal.aiCallCount
      )
    }

    let rows: AdminUserRow[] = Array.from(grouped.entries()).map(([userId, stats]) => {
      const meta = usersMap.get(userId)
      const completionRate =
        stats.sessionCount > 0 ? stats.completedCount / stats.sessionCount : 0
      const severities = severityByUser.get(userId) ?? []
      const riskBandValue = riskBandFromSeverities(severities)
      const riskScore = calculateRiskScore({
        severities,
        completionRate,
        redFlagCount: stats.redFlagCount,
        aiCallCount: aiCallsByUser.get(userId) ?? 0,
      })

      return {
        userId,
        email: meta?.email,
        displayName: meta?.displayName,
        sessionCount: stats.sessionCount,
        aiCallCount: aiCallsByUser.get(userId) ?? 0,
        completionRate,
        lastActiveAt: stats.lastActiveAt ? stats.lastActiveAt.toISOString() : null,
        riskFlags: Array.from(riskByUser.get(userId) ?? []),
        riskBand: riskBandValue,
        riskScore,
      }
    })

    if (q) {
      rows = rows.filter((row) => {
        return (
          row.userId.toLowerCase().includes(q) ||
          (row.email || "").toLowerCase().includes(q) ||
          (row.displayName || "").toLowerCase().includes(q)
        )
      })
    }

    if (riskBand !== "all") {
      rows = rows.filter((row) => row.riskBand === riskBand)
    }

    rows.sort((a, b) => {
      if (usersSort === "sessions") {
        return compareNumbers(a.sessionCount, b.sessionCount, order)
      }
      if (usersSort === "completion") {
        return compareNumbers(a.completionRate, b.completionRate, order)
      }
      if (usersSort === "ai") {
        return compareNumbers(a.aiCallCount, b.aiCallCount, order)
      }
      if (usersSort === "risk") {
        return compareNumbers(a.riskScore, b.riskScore, order)
      }

      const aTime = a.lastActiveAt || ""
      const bTime = b.lastActiveAt || ""
      const compared = aTime.localeCompare(bTime)
      return order === "asc" ? compared : -compared
    })

    const paged = rows.slice(offset, offset + limit)

    const response: AdminUsersResponse = {
      rows: paged,
      nextCursor: offset + limit < rows.length ? String(offset + limit) : null,
      totalCount: rows.length,
    }

    return adminJson(response)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch admin users", error)
    return adminJson({ error: "Failed to fetch admin users" }, 500)
  }
}
