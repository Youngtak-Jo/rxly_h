import { prisma } from "@/lib/prisma"

export interface TranscriptSessionStats {
  transcriptCount: number
  transcriptAvgConfidence: number
  transcriptUnknownCount: number
}

export async function loadTranscriptStatsBySessionIds(
  sessionIds: string[]
): Promise<Map<string, TranscriptSessionStats>> {
  if (sessionIds.length === 0) {
    return new Map<string, TranscriptSessionStats>()
  }

  const [totals, unknowns] = await Promise.all([
    prisma.transcriptEntry.groupBy({
      by: ["sessionId"],
      where: {
        sessionId: { in: sessionIds },
        isFinal: true,
      },
      _count: {
        _all: true,
      },
      _avg: {
        confidence: true,
      },
    }),
    prisma.transcriptEntry.groupBy({
      by: ["sessionId"],
      where: {
        sessionId: { in: sessionIds },
        isFinal: true,
        speaker: "UNKNOWN",
      },
      _count: {
        _all: true,
      },
    }),
  ])

  const map = new Map<string, TranscriptSessionStats>()

  for (const row of totals) {
    map.set(row.sessionId, {
      transcriptCount: row._count._all,
      transcriptAvgConfidence: row._avg.confidence ?? 0,
      transcriptUnknownCount: 0,
    })
  }

  for (const row of unknowns) {
    const existing = map.get(row.sessionId)
    if (existing) {
      existing.transcriptUnknownCount = row._count._all
    } else {
      map.set(row.sessionId, {
        transcriptCount: row._count._all,
        transcriptAvgConfidence: 0,
        transcriptUnknownCount: row._count._all,
      })
    }
  }

  return map
}
