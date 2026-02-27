import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { parseAdminRange } from "@/lib/admin/metrics"
import { loadTranscriptStatsBySessionIds } from "@/lib/admin/transcript-stats"
import { prisma } from "@/lib/prisma"
import type { AdminDataQualityResponse } from "@/types/admin"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const { from, to } = parseAdminRange(searchParams)
    const mode = searchParams.get("mode")
    const modeFilter = mode === "DOCTOR" || mode === "AI_DOCTOR" ? mode : null

    const sessions = await prisma.session.findMany({
      where: {
        startedAt: {
          gte: from,
          lte: to,
        },
        ...(modeFilter ? { mode: modeFilter } : {}),
      },
      select: {
        id: true,
      },
    })

    const sessionIds = sessions.map((session) => session.id)
    const [transcriptStats, aiEvents, clientEvents] = await Promise.all([
      loadTranscriptStatsBySessionIds(sessionIds),
      sessionIds.length
        ? prisma.aiUsageEvent.findMany({
            where: {
              createdAt: {
                gte: from,
                lte: to,
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
                gte: from,
                lte: to,
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

    let transcriptSessionCount = 0
    let confidenceTotal = 0
    let unknownRatioTotal = 0
    let lowQualitySessions = 0

    let sessionsWithTranscriptNoAiCall = 0
    let sessionsWithAiCallNoClientEvents = 0

    const aiCountBySession = new Map<string, number>()
    const clientCountBySession = new Map<string, number>()

    for (const event of aiEvents) {
      if (!event.sessionId) continue
      aiCountBySession.set(
        event.sessionId,
        (aiCountBySession.get(event.sessionId) ?? 0) + 1
      )
    }

    for (const event of clientEvents) {
      if (!event.sessionId) continue
      clientCountBySession.set(
        event.sessionId,
        (clientCountBySession.get(event.sessionId) ?? 0) + 1
      )
    }

    for (const sessionId of sessionIds) {
      const stats = transcriptStats.get(sessionId)
      const transcriptCount = stats?.transcriptCount ?? 0
      const aiCount = aiCountBySession.get(sessionId) ?? 0
      const clientCount = clientCountBySession.get(sessionId) ?? 0

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

    const response: AdminDataQualityResponse = {
      from: from.toISOString(),
      to: to.toISOString(),
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
    }

    return adminJson(response)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to load admin data quality", error)
    return adminJson({ error: "Failed to load data quality" }, 500)
  }
}
