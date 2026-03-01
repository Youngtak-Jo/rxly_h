import type { AdminInsightAlert, SessionSignals } from "@/types/admin"

interface UserActivity {
  userId: string
  last7Days: number
  last30Days: number
}

function createAlert(input: Omit<AdminInsightAlert, "id">): AdminInsightAlert {
  const base = `${input.rule}:${input.sessionId || "none"}:${input.userId || "none"}:${input.title}`
  return {
    id: Buffer.from(base).toString("base64url"),
    ...input,
  }
}

export function buildSessionAlerts(
  sessions: SessionSignals[],
  exportSpikeUsers: Set<string>,
  now = new Date()
): AdminInsightAlert[] {
  const alerts: AdminInsightAlert[] = []

  for (const session of sessions) {
    const elapsedMs = now.getTime() - session.startedAt.getTime()

    if ((session.hasInsights || session.hasDdx) && elapsedMs > 20 * 60 * 1000 && !session.recordHasPlan) {
      alerts.push(
        createAlert({
          rule: "DropOffBeforeRecord",
          severity: "high",
          userId: session.userId,
          sessionId: session.sessionId,
          title: "Drop-off before record completion",
          description: "Insights/DDx generated but consultation record plan is still incomplete after 20 minutes.",
        })
      )
    }

    if (session.aiCallCount > 12) {
      alerts.push(
        createAlert({
          rule: "HighAiRegeneration",
          severity: "medium",
          userId: session.userId,
          sessionId: session.sessionId,
          title: "High AI regeneration count",
          description: `Session requested AI generation ${session.aiCallCount} times.`,
          metadata: {
            aiCallCount: session.aiCallCount,
          },
        })
      )
    }

    if (session.transcriptCount > 0 && (session.transcriptAvgConfidence < 0.75 || session.transcriptUnknownRatio > 0.4)) {
      alerts.push(
        createAlert({
          rule: "LowTranscriptQuality",
          severity: "medium",
          userId: session.userId,
          sessionId: session.sessionId,
          title: "Low transcript quality",
          description: "Transcript confidence or speaker attribution quality is below threshold.",
          metadata: {
            transcriptAvgConfidence: session.transcriptAvgConfidence,
            transcriptUnknownRatio: session.transcriptUnknownRatio,
          },
        })
      )
    }

    if (session.researchMessageCount >= 6 && !session.hasHandout && !session.recordHasPlan) {
      alerts.push(
        createAlert({
          rule: "ResearchHeavyNoClosure",
          severity: "medium",
          userId: session.userId,
          sessionId: session.sessionId,
          title: "Research-heavy session without closure",
          description: "Research activity is high, but no handout or finalized record is present.",
        })
      )
    }

    if (session.redFlagCount > 0 && elapsedMs > 20 * 60 * 1000 && !session.recordHasPlan) {
      alerts.push(
        createAlert({
          rule: "RedFlagUnresolved",
          severity: "high",
          userId: session.userId,
          sessionId: session.sessionId,
          title: "Red flags unresolved",
          description: "Red flags were detected but record plan has not been finalized within threshold time.",
          metadata: {
            redFlagCount: session.redFlagCount,
          },
        })
      )
    }

    if (exportSpikeUsers.has(session.userId)) {
      alerts.push(
        createAlert({
          rule: "ExportRiskSpike",
          severity: "medium",
          userId: session.userId,
          sessionId: session.sessionId,
          title: "Export activity spike",
          description: "User export volume exceeded risk threshold in the selected period.",
        })
      )
    }

    if (
      session.transcriptCount > 0 &&
      session.hasInsights &&
      session.recordHasPlan &&
      session.completionRate >= 0.75 &&
      elapsedMs <= 10 * 60 * 1000
    ) {
      alerts.push(
        createAlert({
          rule: "FastComplete",
          severity: "positive",
          userId: session.userId,
          sessionId: session.sessionId,
          title: "Fast complete session",
          description: "Transcript, insights, and record were completed quickly with high completion rate.",
        })
      )
    }
  }

  return alerts
}

export function buildDormantPowerUserAlerts(
  activities: UserActivity[]
): AdminInsightAlert[] {
  return activities
    .filter((activity) => activity.last30Days >= 8 && activity.last7Days <= 1)
    .map((activity) =>
      createAlert({
        rule: "DormantPowerUser",
        severity: "low",
        userId: activity.userId,
        title: "Dormant power user",
        description: "User was highly active in the last 30 days but activity dropped sharply in the last 7 days.",
        metadata: {
          last7Days: activity.last7Days,
          last30Days: activity.last30Days,
        },
      })
    )
}
