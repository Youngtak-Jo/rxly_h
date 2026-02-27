import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import {
  buildFunnel,
  buildSessionSignals,
  buildUserBehaviorKpis,
  buildUserTimelineEvents,
  matchesFeatureFilter,
  parseAdminRange,
} from "@/lib/admin/metrics"
import { buildSessionAlerts } from "@/lib/admin/insight-rules"
import {
  matchesAiUsageFeature,
  matchesClientFeature,
  normalizeAdminFeature,
} from "@/lib/admin/feature"
import { listSupabaseUsersMap } from "@/lib/admin/supabase-admin"
import { maskPhiValue } from "@/lib/admin/phi"
import { loadTranscriptStatsBySessionIds } from "@/lib/admin/transcript-stats"
import { riskBandFromSeverities } from "@/lib/admin/risk"
import { prisma } from "@/lib/prisma"
import type {
  AdminMode,
  AdminInsightAlert,
  AdminUserDetailResponse,
  AdminUserSessionMapRow,
} from "@/types/admin"
import { logger } from "@/lib/logger"

function parseLimit(
  value: string | null,
  fallback: number,
  max: number
): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.min(max, Math.floor(n))
}

function createAlert(input: Omit<AdminInsightAlert, "id">): AdminInsightAlert {
  const base = `${input.rule}:${input.userId || "none"}:${input.sessionId || "none"}:${input.title}`
  return {
    id: Buffer.from(base).toString("base64url"),
    ...input,
  }
}

function buildUserFailureAlerts(input: {
  userId: string
  clientEvents: Array<{ feature: string; eventType: string }>
  aiSuccessCount: number
  aiFailureCount: number
}): AdminInsightAlert[] {
  const alerts: AdminInsightAlert[] = []
  const failedByFeature = new Map<string, number>()

  for (const event of input.clientEvents) {
    if (event.eventType !== "analysis_failed") continue
    failedByFeature.set(
      event.feature,
      (failedByFeature.get(event.feature) ?? 0) + 1
    )
  }

  for (const [feature, count] of failedByFeature.entries()) {
    if (count < 3) continue
    alerts.push(
      createAlert({
        rule: "RepeatedAnalysisFailure",
        severity: "medium",
        userId: input.userId,
        title: `Repeated ${feature} failures`,
        description: `${feature} analysis failed ${count} times in the selected range.`,
        metadata: { feature, failedCount: count },
      })
    )
  }

  const aiTotal = input.aiSuccessCount + input.aiFailureCount
  const failureRate = aiTotal > 0 ? input.aiFailureCount / aiTotal : 0
  if (aiTotal >= 5 && input.aiFailureCount >= 3 && failureRate >= 0.35) {
    alerts.push(
      createAlert({
        rule: "AiFailureImbalance",
        severity: "high",
        userId: input.userId,
        title: "AI failure imbalance",
        description:
          "AI failures are disproportionately high for this user in the selected range.",
        metadata: {
          aiSuccessCount: input.aiSuccessCount,
          aiFailureCount: input.aiFailureCount,
          aiFailureRate: failureRate,
        },
      })
    )
  }

  return alerts
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params

  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const { from, to } = parseAdminRange(searchParams)
    const mode = searchParams.get("mode")
    const selectedMode: AdminMode =
      mode === "DOCTOR" || mode === "AI_DOCTOR" ? mode : "ALL"
    const feature = normalizeAdminFeature(searchParams.get("feature"))
    const eventsLimit = parseLimit(searchParams.get("eventsLimit"), 120, 500)
    const sessionsLimit = parseLimit(
      searchParams.get("sessionsLimit"),
      25,
      200
    )

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        startedAt: {
          gte: from,
          lte: to,
        },
        ...(selectedMode !== "ALL" ? { mode: selectedMode } : {}),
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
          select: { redFlags: true },
        },
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
    const [
      aiAudits,
      exportLinks,
      usersMap,
      transcriptStatsBySession,
      clientEvents,
      auditEvents,
      aiUsageEvents,
    ] = await Promise.all([
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
            select: { sessionId: true, userId: true },
          })
        : Promise.resolve([]),
      listSupabaseUsersMap(),
      loadTranscriptStatsBySessionIds(sessionIds),
      prisma.clientEvent.findMany({
        where: {
          userId,
          createdAt: {
            gte: from,
            lte: to,
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: eventsLimit,
        select: {
          id: true,
          createdAt: true,
          eventType: true,
          feature: true,
          sessionId: true,
          metadata: true,
        },
      }),
      prisma.auditLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: from,
            lte: to,
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: eventsLimit,
        select: {
          id: true,
          createdAt: true,
          action: true,
          resource: true,
          sessionId: true,
          success: true,
        },
      }),
      prisma.aiUsageEvent.findMany({
        where: {
          userId,
          createdAt: {
            gte: from,
            lte: to,
          },
        },
        select: {
          sessionId: true,
          status: true,
          feature: true,
        },
      }),
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
    for (const link of exportLinks) {
      exportsBySession.set(
        link.sessionId,
        (exportsBySession.get(link.sessionId) ?? 0) + 1
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

    const scopedExportCount = exportLinks.filter((link) =>
      filteredSessionIds.has(link.sessionId)
    ).length
    const exportSpikeUsers =
      scopedExportCount > 10 ? new Set<string>([userId]) : new Set<string>()
    const sessionAlerts = buildSessionAlerts(filteredSignals, exportSpikeUsers).filter(
      (alert) => alert.userId === userId
    )
    const alertsBySession = new Map<
      string,
      { flags: string[]; severities: Array<"high" | "medium" | "low" | "positive"> }
    >()
    for (const alert of sessionAlerts) {
      if (!alert.sessionId) continue
      const existing = alertsBySession.get(alert.sessionId) ?? {
        flags: [],
        severities: [],
      }
      existing.flags.push(alert.rule)
      existing.severities.push(alert.severity)
      alertsBySession.set(alert.sessionId, existing)
    }

    const filteredSessions = sessions.filter((session) =>
      filteredSessionIds.has(session.id)
    )
    const signalBySessionId = new Map(
      filteredSignals.map((signal) => [signal.sessionId, signal])
    )

    const sessionRows: AdminUserSessionMapRow[] = filteredSessions
      .slice(0, sessionsLimit)
      .map((session) => {
        const signal = signalBySessionId.get(session.id)
        const alertMeta = alertsBySession.get(session.id)
        const maskedPatientRaw = maskPhiValue({
          patientName: session.patientName,
        }).patientName
        const maskedPatient =
          typeof maskedPatientRaw === "string" || maskedPatientRaw === null
            ? maskedPatientRaw
            : JSON.stringify(maskedPatientRaw)

        return {
          id: session.id,
          mode: session.mode,
          title: session.title,
          startedAt: session.startedAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
          patientNameMasked: maskedPatient,
          completionRate: signal?.completionRate ?? 0,
          aiCallCount: signal?.aiCallCount ?? 0,
          exportCount: exportsBySession.get(session.id) ?? 0,
          hasInsights: !!session.insights,
          hasDdx: session.diagnoses.length > 0,
          hasRecord: !!session.record,
          hasResearch: session.researchMessages.length > 0,
          hasHandout: !!session.patientHandout,
          riskFlags: alertMeta?.flags ?? [],
          riskBand: riskBandFromSeverities(alertMeta?.severities ?? []),
        }
      })

    const scopedAiUsageEvents = aiUsageEvents.filter((event) =>
      matchesAiUsageFeature(feature, event.feature)
    )
    const isSessionInScope = (sessionId: string | null | undefined): boolean => {
      if (!sessionId) return selectedMode === "ALL"
      return filteredSessionIds.has(sessionId)
    }
    const scopedClientEvents = clientEvents.filter((event) => {
      if (!isSessionInScope(event.sessionId)) return false
      return matchesClientFeature(feature, event.feature)
    })
    const scopedAuditEvents = auditEvents.filter((event) =>
      isSessionInScope(event.sessionId)
    )
    const scopedAiEvents = scopedAiUsageEvents.filter((event) =>
      isSessionInScope(event.sessionId)
    )

    const aiSuccessCount = scopedAiEvents.filter(
      (event) => event.status === "success"
    ).length
    const aiFailureCount = scopedAiEvents.filter(
      (event) => event.status !== "success"
    ).length
    const exportCount = exportLinks.filter((link) =>
      filteredSessionIds.has(link.sessionId)
    ).length

    const userAlerts = [
      ...sessionAlerts,
      ...buildUserFailureAlerts({
        userId,
        clientEvents: scopedClientEvents,
        aiSuccessCount,
        aiFailureCount,
      }),
    ]

    const timeline = buildUserTimelineEvents(
      scopedClientEvents,
      scopedAuditEvents
    ).slice(0, eventsLimit)

    const response: AdminUserDetailResponse = {
      userId,
      email: usersMap.get(userId)?.email,
      displayName: usersMap.get(userId)?.displayName,
      from: from.toISOString(),
      to: to.toISOString(),
      mode: selectedMode,
      feature,
      behavior: buildUserBehaviorKpis({
        signals: filteredSignals,
        aiSuccessCount,
        aiFailureCount,
        exportCount,
      }),
      funnel: buildFunnel(filteredSignals),
      alerts: userAlerts,
      sessions: sessionRows,
      timeline,
    }

    return adminJson(response)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch admin user detail", error)
    return adminJson({ error: "Failed to fetch admin user detail" }, 500)
  }
}
