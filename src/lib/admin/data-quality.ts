import type {
  AdminDataQualityResponse,
  AdminFeature,
  AdminMode,
  AdminTelemetryCoverage,
} from "@/types/admin"
import { prisma } from "@/lib/prisma"
import { loadTranscriptStatsBySessionIds } from "@/lib/admin/transcript-stats"
import { buildSessionSignals, matchesFeatureFilter } from "@/lib/admin/metrics"

export async function loadAdminDataQualitySnapshot(input: {
  from: Date
  to: Date
  mode?: AdminMode | null
  feature?: AdminFeature
}): Promise<{
  response: AdminDataQualityResponse
  telemetry: AdminTelemetryCoverage
}> {
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
  const [transcriptStats, aiEvents, clientEvents] = await Promise.all([
    loadTranscriptStatsBySessionIds(sessionIds),
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
            sessionId: true,
          },
        })
      : Promise.resolve([]),
    sessionIds.length
      ? prisma.clientEvent.findMany({
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
          },
        })
      : Promise.resolve([]),
  ])

  const filteredSignals = buildSessionSignals(
    sessions,
    new Map<string, number>(),
    new Map<string, number>(),
    transcriptStats
  ).filter((signal) =>
    input.feature && input.feature !== "all"
      ? matchesFeatureFilter(input.feature, signal)
      : true
  )

  const filteredSessionIds = filteredSignals.map((signal) => signal.sessionId)
  const filteredSessionIdSet = new Set(filteredSessionIds)

  let transcriptSessionCount = 0
  let confidenceTotal = 0
  let unknownRatioTotal = 0
  let lowQualitySessions = 0

  let sessionsWithTranscriptNoAiCall = 0
  let sessionsWithAiCallNoClientEvents = 0
  let sessionsWithAnyClientEvents = 0

  const aiCountBySession = new Map<string, number>()
  const clientCountBySession = new Map<string, number>()

  for (const event of aiEvents) {
    if (!event.sessionId || !filteredSessionIdSet.has(event.sessionId)) continue
    aiCountBySession.set(
      event.sessionId,
      (aiCountBySession.get(event.sessionId) ?? 0) + 1
    )
  }

  for (const event of clientEvents) {
    if (!event.sessionId || !filteredSessionIdSet.has(event.sessionId)) continue
    clientCountBySession.set(
      event.sessionId,
      (clientCountBySession.get(event.sessionId) ?? 0) + 1
    )
  }

  for (const sessionId of filteredSessionIds) {
    const stats = transcriptStats.get(sessionId)
    const transcriptCount = stats?.transcriptCount ?? 0
    const aiCount = aiCountBySession.get(sessionId) ?? 0
    const clientCount = clientCountBySession.get(sessionId) ?? 0

    if (clientCount > 0) {
      sessionsWithAnyClientEvents += 1
    }

    if (transcriptCount > 0) {
      transcriptSessionCount += 1
      const avgConfidence = stats?.transcriptAvgConfidence ?? 0
      const unknownRatio =
        stats && stats.transcriptCount > 0
          ? stats.transcriptUnknownCount / stats.transcriptCount
          : 0
      confidenceTotal += avgConfidence
      unknownRatioTotal += unknownRatio

      if (avgConfidence < 0.75 || unknownRatio > 0.4) {
        lowQualitySessions += 1
      }

      if (aiCount === 0) {
        sessionsWithTranscriptNoAiCall += 1
      }
    }

    if (aiCount > 0 && clientCount === 0) {
      sessionsWithAiCallNoClientEvents += 1
    }
  }

  return {
    response: {
      from: input.from.toISOString(),
      to: input.to.toISOString(),
      transcriptQuality: {
        sessionCount: transcriptSessionCount,
        avgConfidence:
          transcriptSessionCount > 0 ? confidenceTotal / transcriptSessionCount : 0,
        avgUnknownRatio:
          transcriptSessionCount > 0
            ? unknownRatioTotal / transcriptSessionCount
            : 0,
        lowQualitySessions,
      },
      telemetryIntegrity: {
        sessionsWithTranscriptNoAiCall,
        sessionsWithAiCallNoClientEvents,
      },
    },
    telemetry: {
      sessionsWithAnyClientEvents,
      sessionCoverageRate:
        filteredSessionIds.length > 0
          ? sessionsWithAnyClientEvents / filteredSessionIds.length
          : 0,
      sessionsWithTranscriptNoAiCall,
      sessionsWithAiCallNoClientEvents,
    },
  }
}
