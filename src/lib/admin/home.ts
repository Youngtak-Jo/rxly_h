import type {
  AdminHomeComparisons,
  AdminHomeResponse,
  AdminHomeSummary,
} from "@/types/admin"
import { buildAdminAiOverview, loadAdminAiUsageEvents } from "@/lib/admin/ai-ops"
import { loadAdminDataQualitySnapshot } from "@/lib/admin/data-quality"
import { listIncidents } from "@/lib/admin/incidents"
import {
  loadOverviewData,
  type OverviewBuildInput,
} from "@/lib/admin/overview"
import {
  buildAttentionRules,
  buildFeatureAdoptionRows,
  buildMetricDelta,
} from "@/lib/admin/metrics"
import { severityRank } from "@/lib/admin/risk"

function buildPreviousWindow(input: OverviewBuildInput): OverviewBuildInput {
  const durationMs = Math.max(60_000, input.to.getTime() - input.from.getTime())
  const previousTo = input.from
  const previousFrom = new Date(input.from.getTime() - durationMs)

  return {
    ...input,
    from: previousFrom,
    to: previousTo,
  }
}

function rateFromSignals(
  total: number,
  matchedCount: number
): number {
  return total > 0 ? matchedCount / total : 0
}

function buildHomeSummary(input: {
  sessionCount: number
  activeUsers: number
  transcriptSessions: number
  ddxSessions: number
  handoutSessions: number
  recordFinalizationRate: number
  aiFailureRate: number
  aiCostPerSession: number
}): AdminHomeSummary {
  return {
    activeUsers: input.activeUsers,
    sessionStarts: input.sessionCount,
    transcriptCaptureRate: rateFromSignals(
      input.sessionCount,
      input.transcriptSessions
    ),
    recordFinalizationRate: input.recordFinalizationRate,
    ddxAdoptionRate: rateFromSignals(input.sessionCount, input.ddxSessions),
    handoutGenerationRate: rateFromSignals(
      input.sessionCount,
      input.handoutSessions
    ),
    aiCostPerSession: input.aiCostPerSession,
    aiFailureRate: input.aiFailureRate,
  }
}

function buildHomeComparisons(
  current: AdminHomeSummary,
  previous: AdminHomeSummary
): AdminHomeComparisons {
  return {
    activeUsers: buildMetricDelta(current.activeUsers, previous.activeUsers),
    sessionStarts: buildMetricDelta(current.sessionStarts, previous.sessionStarts),
    transcriptCaptureRate: buildMetricDelta(
      current.transcriptCaptureRate,
      previous.transcriptCaptureRate
    ),
    recordFinalizationRate: buildMetricDelta(
      current.recordFinalizationRate,
      previous.recordFinalizationRate
    ),
    ddxAdoptionRate: buildMetricDelta(
      current.ddxAdoptionRate,
      previous.ddxAdoptionRate
    ),
    handoutGenerationRate: buildMetricDelta(
      current.handoutGenerationRate,
      previous.handoutGenerationRate
    ),
    aiCostPerSession: buildMetricDelta(
      current.aiCostPerSession,
      previous.aiCostPerSession
    ),
    aiFailureRate: buildMetricDelta(current.aiFailureRate, previous.aiFailureRate),
  }
}

function sortAlertsBySeverity<T extends { severity: "high" | "medium" | "low" | "positive"; rule: string }>(
  alerts: T[]
): T[] {
  return [...alerts].sort((a, b) => {
    const severityDiff = severityRank(b.severity) - severityRank(a.severity)
    if (severityDiff !== 0) return severityDiff
    return a.rule.localeCompare(b.rule)
  })
}

export async function loadAdminHomeData(
  input: OverviewBuildInput
): Promise<AdminHomeResponse> {
  const previousInput = buildPreviousWindow(input)

  const [
    currentOverview,
    previousOverview,
    currentAiEvents,
    previousAiEvents,
    incidents,
    dataQuality,
  ] = await Promise.all([
    loadOverviewData(input),
    loadOverviewData(previousInput),
    loadAdminAiUsageEvents({
      from: input.from,
      to: input.to,
      mode: input.mode || null,
    }),
    loadAdminAiUsageEvents({
      from: previousInput.from,
      to: previousInput.to,
      mode: previousInput.mode || null,
    }),
    listIncidents({
      from: input.from,
      to: input.to,
      severity: "all",
      status: "all",
      priority: "all",
      owner: "",
      rule: "",
      q: "",
      order: "desc",
      cursor: "0",
      limit: "8",
    }),
    loadAdminDataQualitySnapshot({
      from: input.from,
      to: input.to,
      mode: input.mode || null,
      feature: input.feature || "all",
    }),
  ])

  const currentAiOverview = buildAdminAiOverview({
    events: currentAiEvents,
    sessionCount: currentOverview.signals.length,
    selectedFeature: input.feature || "all",
  })
  const previousAiOverview = buildAdminAiOverview({
    events: previousAiEvents,
    sessionCount: previousOverview.signals.length,
    selectedFeature: input.feature || "all",
  })

  const currentSummary = buildHomeSummary({
    sessionCount: currentOverview.signals.length,
    activeUsers: currentOverview.response.kpis.dau,
    transcriptSessions: currentOverview.signals.filter((signal) => signal.transcriptCount > 0).length,
    ddxSessions: currentOverview.signals.filter((signal) => signal.hasDdx).length,
    handoutSessions: currentOverview.signals.filter((signal) => signal.hasHandout).length,
    recordFinalizationRate: currentOverview.response.kpis.sessionCompletionRate,
    aiFailureRate: currentOverview.response.kpis.aiFailureRate,
    aiCostPerSession: currentAiOverview.costPerSession,
  })

  const previousSummary = buildHomeSummary({
    sessionCount: previousOverview.signals.length,
    activeUsers: previousOverview.response.kpis.dau,
    transcriptSessions: previousOverview.signals.filter((signal) => signal.transcriptCount > 0).length,
    ddxSessions: previousOverview.signals.filter((signal) => signal.hasDdx).length,
    handoutSessions: previousOverview.signals.filter((signal) => signal.hasHandout).length,
    recordFinalizationRate: previousOverview.response.kpis.sessionCompletionRate,
    aiFailureRate: previousOverview.response.kpis.aiFailureRate,
    aiCostPerSession: previousAiOverview.costPerSession,
  })

  const urgentIncidents = incidents.rows.filter(
    (row) => row.status !== "RESOLVED" && row.status !== "DISMISSED"
  )
  const liveAlerts = sortAlertsBySeverity(currentOverview.alerts)

  return {
    ...currentOverview.response,
    urgentIncidents,
    summary: currentSummary,
    comparisons: buildHomeComparisons(currentSummary, previousSummary),
    telemetry: dataQuality.telemetry,
    aiOverview: currentAiOverview,
    attention: {
      liveAlerts,
      incidents: urgentIncidents,
      topRules: buildAttentionRules(liveAlerts).slice(0, 5),
    },
    featureAdoption: buildFeatureAdoptionRows(
      currentOverview.signals,
      previousOverview.signals
    ),
  }
}
