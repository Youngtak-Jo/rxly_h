import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import {
  parseAdminRange,
  buildSessionSignals,
  getExportSpikeUsers,
} from "@/lib/admin/metrics"
import { buildSessionAlerts } from "@/lib/admin/insight-rules"
import { normalizeAdminFeature } from "@/lib/admin/feature"
import { listSupabaseUsersMap } from "@/lib/admin/supabase-admin"
import { loadTranscriptStatsBySessionIds } from "@/lib/admin/transcript-stats"
import { maskPhiValue } from "@/lib/admin/phi"
import { calculateRiskScore, normalizeRiskBand, riskBandFromSeverities } from "@/lib/admin/risk"
import { prisma } from "@/lib/prisma"
import type { AdminSessionRow, AdminSessionsResponse, AdminSessionsSort } from "@/types/admin"
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

function parseSessionsSort(value: string | null): AdminSessionsSort {
  if (value === "startedAt" || value === "completion" || value === "ai" || value === "risk") {
    return value
  }
  return "startedAt"
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
    const userId = searchParams.get("userId") || undefined
    const mode = searchParams.get("mode")
    const modeFilter = mode === "DOCTOR" || mode === "AI_DOCTOR" ? mode : undefined
    const feature = normalizeAdminFeature(searchParams.get("feature"))
    const q = (searchParams.get("q") || "").trim()
    const limit = parseLimit(searchParams.get("limit"))
    const offset = parseCursor(searchParams.get("cursor"))
    const sessionsSort = parseSessionsSort(searchParams.get("sessionsSort"))
    const order = parseOrder(searchParams.get("order"))
    const riskBand = normalizeRiskBand(searchParams.get("riskBand"))
    const hasRedFlagFilter =
      searchParams.get("hasRedFlag") === "yes" || searchParams.get("hasRedFlag") === "no"
        ? (searchParams.get("hasRedFlag") as "yes" | "no")
        : "all"

    const sessions = await prisma.session.findMany({
      where: {
        startedAt: {
          gte: from,
          lte: to,
        },
        ...(userId ? { userId } : {}),
        ...(modeFilter ? { mode: modeFilter } : {}),
      },
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        userId: true,
        mode: true,
        title: true,
        patientName: true,
        startedAt: true,
        updatedAt: true,
        insights: {
          select: {
            redFlags: true,
          },
        },
        diagnoses: {
          select: { id: true },
        },
        record: {
          select: {
            chiefComplaint: true,
            hpiText: true,
            assessment: true,
            plan: true,
          },
        },
        researchMessages: {
          select: { id: true },
        },
        patientHandout: {
          select: { entries: true },
        },
      },
    })

    const sessionIds = sessions.map((session) => session.id)
    const [aiAudits, exportLinks, usersMap, transcriptStatsBySession] = await Promise.all([
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
            select: { sessionId: true },
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
      loadTranscriptStatsBySessionIds(sessionIds),
    ])

    const aiCallsBySession = new Map<string, number>()
    for (const audit of aiAudits) {
      if (!audit.sessionId) continue
      aiCallsBySession.set(
        audit.sessionId,
        (aiCallsBySession.get(audit.sessionId) ?? 0) + 1
      )
    }

    const exportsBySession = new Map<string, number>()
    const exportsByUser = new Map<string, number>()
    for (const link of exportLinks) {
      exportsBySession.set(
        link.sessionId,
        (exportsBySession.get(link.sessionId) ?? 0) + 1
      )
      exportsByUser.set(link.userId, (exportsByUser.get(link.userId) ?? 0) + 1)
    }

    const signals = buildSessionSignals(
      sessions,
      aiCallsBySession,
      exportsBySession,
      transcriptStatsBySession
    )
    const alerts = buildSessionAlerts(signals, getExportSpikeUsers(exportsByUser))
    const alertMetaBySessionId = new Map<
      string,
      {
        flags: string[]
        severities: Array<"high" | "medium" | "low" | "positive">
      }
    >()

    for (const alert of alerts) {
      if (!alert.sessionId) continue
      const current = alertMetaBySessionId.get(alert.sessionId) || {
        flags: [],
        severities: [],
      }
      current.flags.push(alert.rule)
      current.severities.push(alert.severity)
      alertMetaBySessionId.set(alert.sessionId, current)
    }

    let rows: AdminSessionRow[] = sessions.map((session, index) => {
      const userMeta = usersMap.get(session.userId)
      const maskedPatientRaw = maskPhiValue({ patientName: session.patientName }).patientName
      const maskedPatient =
        typeof maskedPatientRaw === "string" || maskedPatientRaw === null
          ? maskedPatientRaw
          : JSON.stringify(maskedPatientRaw)

      const sessionSignal = signals[index]
      const alertMeta = alertMetaBySessionId.get(session.id)
      const severities = alertMeta?.severities || []
      const riskBandValue = riskBandFromSeverities(severities)
      const hasRedFlag = (sessionSignal?.redFlagCount ?? 0) > 0
      const recordFinalizationRate =
        sessionSignal?.recordHasPlan || sessionSignal?.recordHasAssessment ? 1 : 0

      return {
        id: session.id,
        userId: session.userId,
        userEmail: userMeta?.email,
        mode: session.mode,
        title: session.title,
        patientNameMasked: maskedPatient,
        startedAt: session.startedAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        transcriptCount: sessionSignal?.transcriptCount ?? 0,
        aiCallCount: sessionSignal?.aiCallCount ?? 0,
        hasInsights: !!session.insights,
        hasDdx: session.diagnoses.length > 0,
        hasRecord: !!session.record,
        hasResearch: session.researchMessages.length > 0,
        hasHandout: !!session.patientHandout,
        hasRedFlag,
        exportCount: exportsBySession.get(session.id) ?? 0,
        completionRate: recordFinalizationRate,
        recordFinalizationRate,
        workflowProgress: sessionSignal?.completionRate ?? 0,
        riskFlags: alertMeta?.flags || [],
        riskBand: riskBandValue,
        riskScore: calculateRiskScore({
          severities,
          completionRate: recordFinalizationRate,
          redFlagCount: sessionSignal?.redFlagCount,
          aiCallCount: sessionSignal?.aiCallCount,
        }),
      }
    })

    if (q) {
      const lowered = q.toLowerCase()
      rows = rows.filter((row) => {
        return (
          row.id.toLowerCase().includes(lowered) ||
          (row.title || "").toLowerCase().includes(lowered) ||
          (row.userEmail || "").toLowerCase().includes(lowered)
        )
      })
    }

    if (feature !== "all") {
      rows = rows.filter((row) => {
        if (feature === "insights") return row.hasInsights
        if (feature === "ddx") return row.hasDdx
        if (feature === "record") return row.hasRecord
        if (feature === "research") return row.hasResearch
        if (feature === "patientHandout") return row.hasHandout
        return true
      })
    }

    if (riskBand !== "all") {
      rows = rows.filter((row) => row.riskBand === riskBand)
    }

    if (hasRedFlagFilter === "yes") {
      rows = rows.filter((row) => row.hasRedFlag)
    }
    if (hasRedFlagFilter === "no") {
      rows = rows.filter((row) => !row.hasRedFlag)
    }

    rows.sort((a, b) => {
      if (sessionsSort === "completion") {
        return compareNumbers(a.completionRate, b.completionRate, order)
      }
      if (sessionsSort === "ai") {
        return compareNumbers(a.aiCallCount, b.aiCallCount, order)
      }
      if (sessionsSort === "risk") {
        return compareNumbers(a.riskScore, b.riskScore, order)
      }

      const compared = a.startedAt.localeCompare(b.startedAt)
      return order === "asc" ? compared : -compared
    })

    const pagedRows = rows.slice(offset, offset + limit)

    const response: AdminSessionsResponse = {
      rows: pagedRows,
      nextCursor: offset + limit < rows.length ? String(offset + limit) : null,
      totalCount: rows.length,
    }

    return adminJson(response)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch admin sessions", error)
    return adminJson({ error: "Failed to fetch admin sessions" }, 500)
  }
}
