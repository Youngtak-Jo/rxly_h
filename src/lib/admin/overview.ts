import { prisma } from "@/lib/prisma"
import { withAdminCache } from "@/lib/admin/admin-cache"
import { ADMIN_CACHE_TTL_MS } from "@/lib/admin/filters"
import { buildDormantPowerUserAlerts, buildSessionAlerts } from "@/lib/admin/insight-rules"
import {
  buildFunnel,
  buildKpis,
  matchesFeatureFilter,
  buildSessionSignals,
  buildTrends,
  buildUserActivity,
  getExportSpikeUsers,
  parseAdminRange,
  percentile,
  timeBucket,
} from "@/lib/admin/metrics"
import { matchesAiUsageFeature, normalizeAdminFeature } from "@/lib/admin/feature"
import { loadTranscriptStatsBySessionIds } from "@/lib/admin/transcript-stats"
import type {
  AdminFeature,
  AdminInsightAlert,
  AdminInterval,
  AdminMode,
  AdminOverviewResponse,
  SessionSignals,
} from "@/types/admin"

export type OverviewBuildInput = {
  from: Date
  to: Date
  interval: AdminInterval
  mode?: AdminMode
  feature?: AdminFeature
}

function buildOverviewCacheKey(input: OverviewBuildInput): string {
  return [
    "overview",
    input.from.toISOString(),
    input.to.toISOString(),
    input.interval,
    input.mode || "ALL",
    (input.feature || "all").trim(),
  ].join(":")
}

async function loadOverviewDataUncached(
  input: OverviewBuildInput
): Promise<{ response: AdminOverviewResponse; signals: SessionSignals[]; alerts: AdminInsightAlert[] }> {
  const sessions = await prisma.session.findMany({
    where: {
      startedAt: {
        gte: input.from,
        lte: input.to,
      },
      ...(input.mode && input.mode !== "ALL" ? { mode: input.mode } : {}),
    },
    select: {
      id: true,
      userId: true,
      startedAt: true,
      updatedAt: true,
      insights: {
        select: {
          redFlags: true,
        },
      },
      diagnoses: {
        select: {
          id: true,
        },
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
        select: {
          id: true,
        },
      },
      patientHandout: {
        select: {
          entries: true,
        },
      },
    },
  })

  const sessionIds = sessions.map((session) => session.id)

  const [aiAudits, exportLinks, aiUsageEvents, recentSessions, transcriptStatsBySession] =
    await Promise.all([
      sessionIds.length
        ? prisma.auditLog.findMany({
            where: {
              createdAt: {
                gte: input.from,
                lte: input.to,
              },
              resource: {
                startsWith: "ai_",
              },
              sessionId: {
                in: sessionIds,
              },
            },
            select: {
              createdAt: true,
              sessionId: true,
            },
          })
        : Promise.resolve([]),
      sessionIds.length
        ? prisma.exportLink.findMany({
            where: {
              createdAt: {
                gte: input.from,
                lte: input.to,
              },
              sessionId: {
                in: sessionIds,
              },
            },
            select: {
              sessionId: true,
              userId: true,
            },
          })
        : Promise.resolve([]),
      sessionIds.length
        ? prisma.aiUsageEvent.findMany({
            where: {
              createdAt: {
                gte: input.from,
                lte: input.to,
              },
              sessionId: {
                in: sessionIds,
              },
            },
            select: {
              createdAt: true,
              sessionId: true,
              feature: true,
              status: true,
              latencyMs: true,
              costUsd: true,
            },
          })
        : Promise.resolve([]),
      prisma.session.findMany({
        where: {
          startedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          ...(input.mode && input.mode !== "ALL" ? { mode: input.mode } : {}),
        },
        select: {
          userId: true,
          startedAt: true,
        },
      }),
      loadTranscriptStatsBySessionIds(sessionIds),
    ])

  const exportsBySession = new Map<string, number>()
  const exportsByUser = new Map<string, number>()
  for (const item of exportLinks) {
    exportsBySession.set(item.sessionId, (exportsBySession.get(item.sessionId) ?? 0) + 1)
    exportsByUser.set(item.userId, (exportsByUser.get(item.userId) ?? 0) + 1)
  }

  const aiCallsBySession = new Map<string, number>()
  for (const audit of aiAudits) {
    if (!audit.sessionId) continue
    aiCallsBySession.set(audit.sessionId, (aiCallsBySession.get(audit.sessionId) ?? 0) + 1)
  }

  const signals = buildSessionSignals(
    sessions,
    aiCallsBySession,
    exportsBySession,
    transcriptStatsBySession
  )
  const feature = input.feature || "all"
  const filteredSignals =
    feature === "all"
      ? signals
      : signals.filter((signal) => matchesFeatureFilter(feature, signal))

  const filteredSessionIds = new Set(filteredSignals.map((signal) => signal.sessionId))

  const filteredAiAudits = aiAudits.filter(
    (audit) => !!audit.sessionId && filteredSessionIds.has(audit.sessionId)
  )
  const filteredAiUsage = aiUsageEvents.filter(
    (event) =>
      !!event.sessionId &&
      filteredSessionIds.has(event.sessionId) &&
      matchesAiUsageFeature(feature, event.feature)
  )
  const filteredExportLinks = exportLinks.filter((link) =>
    filteredSessionIds.has(link.sessionId)
  )

  const aiCallsByBucket = new Map<string, number>()
  for (const event of filteredAiUsage) {
    const key = timeBucket(event.createdAt, input.interval)
    aiCallsByBucket.set(key, (aiCallsByBucket.get(key) ?? 0) + 1)
  }

  const uniqueUsers = new Set(filteredSignals.map((signal) => signal.userId)).size
  const aiCallsTotal = filteredAiUsage.length || filteredAiAudits.length
  const exportCount = filteredExportLinks.length

  const funnel = buildFunnel(filteredSignals)
  const aiFailureCount = filteredAiUsage.filter((event) => event.status !== "success").length
  const aiFailureRate =
    aiCallsTotal > 0 ? aiFailureCount / aiCallsTotal : 0
  const aiCostUsd = filteredAiUsage.reduce((sum, event) => sum + (event.costUsd ?? 0), 0)
  const aiLatencies = filteredAiUsage
    .map((event) => event.latencyMs ?? 0)
    .filter((latency) => latency > 0)
  const unresolvedIncidents = await prisma.adminAlertIncident.count({
    where: {
      status: {
        in: ["NEW", "ACK", "IN_PROGRESS"],
      },
    },
  })

  const kpis = buildKpis(filteredSignals, uniqueUsers, aiCallsTotal, exportCount, {
    aiFailureRate,
    aiCostUsd,
    aiP50LatencyMs: percentile(aiLatencies, 50),
    aiP95LatencyMs: percentile(aiLatencies, 95),
    unresolvedIncidents,
  })
  const trends = buildTrends(filteredSignals, aiCallsByBucket, input.interval)

  const exportSpikeUsers = getExportSpikeUsers(exportsByUser)
  const sessionAlerts = buildSessionAlerts(filteredSignals, exportSpikeUsers)

  const dormantAlerts = buildDormantPowerUserAlerts(buildUserActivity(recentSessions))
  const alerts = [...sessionAlerts, ...dormantAlerts]

  const response: AdminOverviewResponse = {
    from: input.from.toISOString(),
    to: input.to.toISOString(),
    interval: input.interval,
    kpis,
    funnel,
    trends,
    alerts,
  }

  return {
    response,
    signals: filteredSignals,
    alerts,
  }
}

export async function loadOverviewData(
  input: OverviewBuildInput,
  options: { skipCache?: boolean } = {}
): Promise<{ response: AdminOverviewResponse; signals: SessionSignals[]; alerts: AdminInsightAlert[] }> {
  return withAdminCache({
    key: buildOverviewCacheKey(input),
    ttlMs: ADMIN_CACHE_TTL_MS,
    skipCache: options.skipCache,
    loader: () => loadOverviewDataUncached(input),
  })
}

export function parseOverviewRangeFromRequest(url: string): OverviewBuildInput {
  const { searchParams } = new URL(url)
  const range = parseAdminRange(searchParams)
  const modeParam = searchParams.get("mode")
  const mode: AdminMode =
    modeParam === "DOCTOR" || modeParam === "AI_DOCTOR" ? modeParam : "ALL"
  return {
    ...range,
    mode,
    feature: normalizeAdminFeature(searchParams.get("feature")),
  }
}
