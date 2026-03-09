import type {
  AdminAttentionRule,
  AdminFeatureAdoptionFeature,
  AdminFeatureAdoptionRow,
  AdminFunnelDropoff,
  AdminFeature,
  AdminFunnelStepKey,
  AdminFunnelStep,
  AdminInterval,
  AdminKpis,
  AdminMetricDelta,
  AdminTimelineCategory,
  AdminTrendPoint,
  AdminUserBehaviorKpis,
  AdminUserTimelineEvent,
  AdminInsightAlert,
  AdminSeverity,
  SessionSignals,
} from "@/types/admin"
import { severityRank } from "@/lib/admin/risk"

interface SessionForSignals {
  id: string
  userId: string
  startedAt: Date
  updatedAt: Date
  transcriptEntries?: Array<{ confidence: number; speaker: "DOCTOR" | "PATIENT" | "UNKNOWN" }>
  insights: { redFlags: unknown } | null
  diagnoses: Array<{ id: string }>
  record: {
    chiefComplaint: string | null
    hpiText: string | null
    assessment: string | null
    plan: string | null
  } | null
  researchMessages: Array<{ id: string }>
  patientHandout: { entries: unknown } | null
}

export interface TranscriptStats {
  transcriptCount: number
  transcriptAvgConfidence: number
  transcriptUnknownCount: number
}

export interface ParsedRange {
  from: Date
  to: Date
  interval: AdminInterval
}

export type AdminModeFilter = "ALL" | "DOCTOR" | "AI_DOCTOR"

function parseDate(value: string | null): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export function parseAdminRange(searchParams: URLSearchParams): ParsedRange {
  const now = new Date()
  const interval = searchParams.get("interval") === "hour" ? "hour" : "day"

  const to = parseDate(searchParams.get("to")) || now
  const from =
    parseDate(searchParams.get("from")) ||
    new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000)

  return { from, to, interval }
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function isRecordDone(record: SessionForSignals["record"]): boolean {
  if (!record) return false
  const hasCore = !!record.chiefComplaint || !!record.hpiText
  return hasCore || !!record.assessment || !!record.plan
}

export function isHandoutDone(handout: SessionForSignals["patientHandout"]): boolean {
  if (!handout) return false
  return safeArray(handout.entries).length > 0
}

function getStepFlags(
  session: SessionForSignals,
  exportCount: number,
  transcriptCount: number
) {
  const transcriptCaptured = transcriptCount > 0
  const insightsDone = !!session.insights
  const ddxDone = session.diagnoses.length > 0
  const recordDone = isRecordDone(session.record)
  const researchUsed = session.researchMessages.length >= 2
  const handoutDone = isHandoutDone(session.patientHandout)
  const exportDone = exportCount > 0

  return {
    transcriptCaptured,
    insightsDone,
    ddxDone,
    recordDone,
    researchUsed,
    handoutDone,
    exportDone,
  }
}

export function buildSessionSignals(
  sessions: SessionForSignals[],
  aiCallsBySessionId: Map<string, number>,
  exportsBySessionId: Map<string, number>,
  transcriptStatsBySessionId?: Map<string, TranscriptStats>
): SessionSignals[] {
  return sessions.map((session) => {
    const precomputedStats =
      transcriptStatsBySessionId?.get(session.id)
    const transcriptEntries = session.transcriptEntries || []

    const transcriptCount =
      precomputedStats?.transcriptCount ?? transcriptEntries.length
    const avgConfidence =
      precomputedStats?.transcriptAvgConfidence ??
      (transcriptCount > 0
        ? transcriptEntries.reduce((sum, entry) => sum + entry.confidence, 0) /
          transcriptCount
        : 0)
    const unknownCount =
      precomputedStats?.transcriptUnknownCount ??
      transcriptEntries.filter((entry) => entry.speaker === "UNKNOWN").length
    const unknownRatio = transcriptCount > 0 ? unknownCount / transcriptCount : 0

    const exportCount = exportsBySessionId.get(session.id) ?? 0
    const flags = getStepFlags(session, exportCount, transcriptCount)
    const completedSteps = [
      flags.transcriptCaptured,
      flags.insightsDone,
      flags.ddxDone,
      flags.recordDone,
      flags.researchUsed,
      flags.handoutDone,
      flags.exportDone,
    ].filter(Boolean).length

    return {
      sessionId: session.id,
      userId: session.userId,
      startedAt: session.startedAt,
      updatedAt: session.updatedAt,
      transcriptCount,
      transcriptAvgConfidence: avgConfidence,
      transcriptUnknownRatio: unknownRatio,
      aiCallCount: aiCallsBySessionId.get(session.id) ?? 0,
      hasInsights: flags.insightsDone,
      hasDdx: flags.ddxDone,
      hasRecord: !!session.record,
      hasResearch: session.researchMessages.length > 0,
      hasHandout: !!session.patientHandout,
      hasExport: exportCount > 0,
      researchMessageCount: session.researchMessages.length,
      redFlagCount: safeArray(session.insights?.redFlags).length,
      recordHasPlan: !!session.record?.plan,
      recordHasAssessment: !!session.record?.assessment,
      completionRate: completedSteps / 7,
    }
  })
}

export function matchesFeatureFilter(
  feature: AdminFeature,
  signal: SessionSignals
): boolean {
  if (feature === "insights") return signal.hasInsights
  if (feature === "ddx") return signal.hasDdx
  if (feature === "record") return signal.hasRecord
  if (feature === "research") return signal.hasResearch
  if (feature === "patientHandout") return signal.hasHandout
  return true
}

export function filterSignalsByFeature(
  signals: SessionSignals[],
  feature: AdminFeature
): SessionSignals[] {
  if (feature === "all") return signals
  return signals.filter((signal) => matchesFeatureFilter(feature, signal))
}

export function buildFunnel(signals: SessionSignals[]): AdminFunnelStep[] {
  const total = signals.length
  const count = {
    sessionStarted: total,
    transcriptCaptured: signals.filter((s) => s.transcriptCount > 0).length,
    insightsDone: signals.filter((s) => s.hasInsights).length,
    ddxDone: signals.filter((s) => s.hasDdx).length,
    recordDone: signals.filter((s) => s.recordHasPlan || s.recordHasAssessment).length,
    researchUsed: signals.filter((s) => s.researchMessageCount >= 2).length,
    handoutDone: signals.filter((s) => s.hasHandout).length,
    exportDone: signals.filter((s) => s.hasExport).length,
  }

  const steps: Array<[AdminFunnelStepKey, number]> = [
    ["sessionStarted", count.sessionStarted],
    ["transcriptCaptured", count.transcriptCaptured],
    ["insightsDone", count.insightsDone],
    ["ddxDone", count.ddxDone],
    ["recordDone", count.recordDone],
    ["researchUsed", count.researchUsed],
    ["handoutDone", count.handoutDone],
    ["exportDone", count.exportDone],
  ]

  return steps.map(([step, stepCount]) => ({
    step,
    count: stepCount,
    rate: total > 0 ? stepCount / total : 0,
  }))
}

export function buildKpis(
  signals: SessionSignals[],
  uniqueUsers: number,
  aiCallsTotal: number,
  exportCount: number,
  extra: {
    aiFailureRate?: number
    aiCostUsd?: number
    aiP50LatencyMs?: number
    aiP95LatencyMs?: number
    unresolvedIncidents?: number
  } = {}
): AdminKpis {
  const completed = signals.filter((s) => s.recordHasPlan || s.recordHasAssessment)
  const docDone = signals.filter((s) => s.recordHasPlan || s.hasHandout)

  return {
    dau: uniqueUsers,
    activeSessions: signals.length,
    sessionCompletionRate: signals.length ? completed.length / signals.length : 0,
    aiCalls: aiCallsTotal,
    documentGenerationRate: signals.length ? docDone.length / signals.length : 0,
    exportCount,
    aiFailureRate: extra.aiFailureRate ?? 0,
    aiCostUsd: extra.aiCostUsd ?? 0,
    aiP50LatencyMs: extra.aiP50LatencyMs ?? 0,
    aiP95LatencyMs: extra.aiP95LatencyMs ?? 0,
    unresolvedIncidents: extra.unresolvedIncidents ?? 0,
  }
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[index] ?? 0
}

export function buildFunnelDropoffs(steps: AdminFunnelStep[]): AdminFunnelDropoff[] {
  const dropoffs: AdminFunnelDropoff[] = []
  for (let i = 0; i < steps.length - 1; i += 1) {
    const current = steps[i]
    const next = steps[i + 1]
    const dropCount = Math.max(0, current.count - next.count)
    dropoffs.push({
      fromStep: current.step,
      toStep: next.step,
      dropCount,
      dropRate: current.count > 0 ? dropCount / current.count : 0,
    })
  }
  return dropoffs
}

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

function bucketKey(date: Date, interval: AdminInterval): string {
  const year = date.getUTCFullYear()
  const month = pad2(date.getUTCMonth() + 1)
  const day = pad2(date.getUTCDate())
  if (interval === "hour") {
    const hour = pad2(date.getUTCHours())
    return `${year}-${month}-${day}T${hour}:00:00Z`
  }
  return `${year}-${month}-${day}`
}

export function buildTrends(
  signals: SessionSignals[],
  aiCallsByBucket: Map<string, number>,
  interval: AdminInterval
): AdminTrendPoint[] {
  const sessionBuckets = new Map<string, SessionSignals[]>()

  for (const signal of signals) {
    const key = bucketKey(signal.startedAt, interval)
    const existing = sessionBuckets.get(key)
    if (existing) {
      existing.push(signal)
    } else {
      sessionBuckets.set(key, [signal])
    }
  }

  const buckets = new Set<string>([
    ...sessionBuckets.keys(),
    ...aiCallsByBucket.keys(),
  ])

  return Array.from(buckets)
    .sort((a, b) => a.localeCompare(b))
    .map((bucket) => {
      const sessionsInBucket = sessionBuckets.get(bucket) || []
      const completionRate =
        sessionsInBucket.length > 0
          ? sessionsInBucket.reduce((sum, session) => sum + session.completionRate, 0) /
            sessionsInBucket.length
          : 0

      return {
        bucket,
        sessions: sessionsInBucket.length,
        aiCalls: aiCallsByBucket.get(bucket) ?? 0,
        completionRate,
      }
    })
}

export function buildMetricDelta(
  current: number,
  previous: number
): AdminMetricDelta {
  return {
    previous,
    delta: current - previous,
    deltaRatio: previous !== 0 ? (current - previous) / previous : null,
  }
}

function signalMatchesAdoptionFeature(
  signal: SessionSignals,
  feature: AdminFeatureAdoptionFeature
): boolean {
  if (feature === "transcript") return signal.transcriptCount > 0
  if (feature === "insights") return signal.hasInsights
  if (feature === "ddx") return signal.hasDdx
  if (feature === "record") return signal.recordHasPlan || signal.recordHasAssessment
  if (feature === "research") return signal.hasResearch
  if (feature === "handout") return signal.hasHandout
  return signal.hasExport
}

function countSignalsByFeature(
  signals: SessionSignals[],
  feature: AdminFeatureAdoptionFeature
): number {
  return signals.filter((signal) => signalMatchesAdoptionFeature(signal, feature)).length
}

const FEATURE_ADOPTION_ORDER: AdminFeatureAdoptionFeature[] = [
  "transcript",
  "insights",
  "ddx",
  "record",
  "research",
  "handout",
  "export",
]

export function buildFeatureAdoptionRows(
  currentSignals: SessionSignals[],
  previousSignals: SessionSignals[]
): AdminFeatureAdoptionRow[] {
  return FEATURE_ADOPTION_ORDER.map((feature) => {
    const currentSessions = countSignalsByFeature(currentSignals, feature)
    const previousSessions = countSignalsByFeature(previousSignals, feature)
    const currentRate =
      currentSignals.length > 0 ? currentSessions / currentSignals.length : 0
    const previousRate =
      previousSignals.length > 0 ? previousSessions / previousSignals.length : 0

    return {
      feature,
      sessions: currentSessions,
      rate: currentRate,
      delta: buildMetricDelta(currentRate, previousRate),
    }
  })
}

export function buildAttentionRules(
  alerts: AdminInsightAlert[]
): AdminAttentionRule[] {
  const grouped = new Map<
    string,
    {
      rule: string
      severity: Exclude<AdminSeverity, "all">
      count: number
      severityRank: number
    }
  >()

  for (const alert of alerts) {
    const current = grouped.get(alert.rule) || {
      rule: alert.rule,
      severity: alert.severity,
      count: 0,
      severityRank: severityRank(alert.severity),
    }

    current.count += 1
    if (severityRank(alert.severity) > current.severityRank) {
      current.severity = alert.severity
      current.severityRank = severityRank(alert.severity)
    }

    grouped.set(alert.rule, current)
  }

  return Array.from(grouped.values())
    .sort((a, b) => {
      if (b.severityRank !== a.severityRank) return b.severityRank - a.severityRank
      if (b.count !== a.count) return b.count - a.count
      return a.rule.localeCompare(b.rule)
    })
    .map((rule) => ({
      rule: rule.rule,
      severity: rule.severity,
      count: rule.count,
    }))
}

export function getExportSpikeUsers(
  exportCountsByUser: Map<string, number>,
  threshold = 10
): Set<string> {
  const users = new Set<string>()
  for (const [userId, count] of exportCountsByUser.entries()) {
    if (count > threshold) users.add(userId)
  }
  return users
}

export function buildUserActivity(
  sessions: Array<{ userId: string; startedAt: Date }>,
  now = new Date()
): Array<{ userId: string; last7Days: number; last30Days: number }> {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const map = new Map<string, { last7Days: number; last30Days: number }>()

  for (const session of sessions) {
    if (session.startedAt < thirtyDaysAgo) continue

    const current = map.get(session.userId) || { last7Days: 0, last30Days: 0 }
    current.last30Days += 1
    if (session.startedAt >= sevenDaysAgo) {
      current.last7Days += 1
    }
    map.set(session.userId, current)
  }

  return Array.from(map.entries()).map(([userId, value]) => ({
    userId,
    last7Days: value.last7Days,
    last30Days: value.last30Days,
  }))
}

export function timeBucket(date: Date, interval: AdminInterval): string {
  return bucketKey(date, interval)
}

function toMetadataRecord(
  value: unknown
): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  return null
}

function clientEventCategory(eventType: string): AdminTimelineCategory {
  if (eventType === "workspace_opened" || eventType === "tab_switched") return "navigation"
  if (eventType === "recording_started" || eventType === "recording_stopped") return "recording"
  if (eventType === "note_submitted") return "note"
  if (eventType === "image_uploaded") return "image"
  if (eventType === "export_clicked") return "export"
  if (
    eventType === "document_feedback_submitted" ||
    eventType === "analysis_triggered" ||
    eventType === "analysis_completed" ||
    eventType === "analysis_failed"
  ) {
    return "analysis"
  }
  return "system"
}

function clientEventStatus(eventType: string): "success" | "failed" | "info" {
  if (eventType === "analysis_completed") return "success"
  if (eventType === "analysis_failed") return "failed"
  if (eventType === "document_feedback_submitted") return "success"
  return "info"
}

function clientEventLabel(
  eventType: string,
  feature: string,
  metadata: unknown
): string {
  const record = toMetadataRecord(metadata)
  if (eventType === "tab_switched") return "Switched workspace tab"
  if (eventType === "workspace_opened") return "Opened workspace"
  if (eventType === "recording_started") return "Started recording"
  if (eventType === "recording_stopped") return "Stopped recording"
  if (eventType === "note_submitted") return "Submitted note"
  if (eventType === "image_uploaded") return "Uploaded image"
  if (eventType === "export_clicked") {
    const channel = typeof record?.channel === "string" ? record.channel : feature
    return `Clicked export (${channel})`
  }
  if (eventType === "document_feedback_submitted") {
    const vote = typeof record?.vote === "string" ? record.vote : null
    const templateTitle =
      typeof record?.templateTitle === "string" ? record.templateTitle : null
    if (templateTitle && vote === "up") return `Gave thumbs up to ${templateTitle}`
    if (templateTitle && vote === "down") return `Gave thumbs down to ${templateTitle}`
    return "Submitted document feedback"
  }
  if (feature === "custom_document") {
    const templateTitle =
      typeof record?.templateTitle === "string" ? record.templateTitle : "custom document"
    if (eventType === "analysis_triggered") {
      return `Started ${templateTitle} generation`
    }
    if (eventType === "analysis_completed") {
      return `Completed ${templateTitle} generation`
    }
    if (eventType === "analysis_failed") {
      return `Failed ${templateTitle} generation`
    }
  }
  if (eventType === "analysis_triggered") return `Started ${feature} analysis`
  if (eventType === "analysis_completed") return `Completed ${feature} analysis`
  if (eventType === "analysis_failed") return `Failed ${feature} analysis`
  return `${eventType} (${feature})`
}

function clientEventDetail(eventType: string, metadata: unknown): string | undefined {
  const record = toMetadataRecord(metadata)
  if (!record) return undefined

  if (eventType === "workspace_opened") {
    const source = typeof record.source === "string" ? record.source : undefined
    if (source) return `source=${source}`
  }

  if (eventType === "tab_switched") {
    const from = typeof record.from === "string" ? record.from : undefined
    const to = typeof record.to === "string" ? record.to : undefined
    if (from && to) return `${from} -> ${to}`
  }

  if (eventType === "note_submitted") {
    const textLength = toNumber(record.textLength)
    const imageCount = toNumber(record.imageCount)
    const parts: string[] = []
    if (textLength !== null) parts.push(`${textLength} chars`)
    if (imageCount !== null) parts.push(`${imageCount} images`)
    return parts.length ? parts.join(", ") : undefined
  }

  if (eventType === "image_uploaded") {
    const count = toNumber(record.count)
    if (count !== null) return `${count} images`
  }

  if (eventType === "export_clicked") {
    const channel = typeof record.channel === "string" ? record.channel : undefined
    const tab = typeof record.tab === "string" ? record.tab : undefined
    const parts: string[] = []
    if (channel) parts.push(`channel=${channel}`)
    if (tab) parts.push(`tab=${tab}`)
    return parts.length ? parts.join(", ") : undefined
  }

  if (
    eventType === "document_feedback_submitted" ||
    eventType === "analysis_triggered" ||
    eventType === "analysis_completed" ||
    eventType === "analysis_failed"
  ) {
    const reason = typeof record.reason === "string" ? record.reason : undefined
    const mode = typeof record.mode === "string" ? record.mode : undefined
    const forceRun = typeof record.forceRun === "boolean" ? record.forceRun : undefined
    const trigger = typeof record.trigger === "string" ? record.trigger : undefined
    const vote = typeof record.vote === "string" ? record.vote : undefined
    const templateTitle =
      typeof record.templateTitle === "string" ? record.templateTitle : undefined
    const parts: string[] = []
    if (templateTitle) parts.push(`document=${templateTitle}`)
    if (trigger) parts.push(`trigger=${trigger}`)
    if (vote) parts.push(`vote=${vote}`)
    if (mode) parts.push(`mode=${mode}`)
    if (reason) parts.push(`reason=${reason}`)
    if (forceRun === true) parts.push("forced")
    return parts.length ? parts.join(", ") : undefined
  }

  return undefined
}

function auditEventCategory(resource: string): AdminTimelineCategory {
  if (resource.startsWith("ai_")) return "analysis"
  if (resource.includes("export")) return "export"
  if (resource.includes("note")) return "note"
  return "system"
}

function auditEventLabel(action: string, resource: string): string {
  if (resource.startsWith("ai_")) return `${action} ${resource.replace(/^ai_/, "AI ")}`
  return `${action} ${resource}`
}

export function buildUserBehaviorKpis(input: {
  signals: SessionSignals[]
  aiSuccessCount: number
  aiFailureCount: number
  exportCount: number
}): AdminUserBehaviorKpis {
  const sessionCount = input.signals.length
  const completedCount = input.signals.filter(
    (signal) => signal.recordHasPlan || signal.recordHasAssessment
  ).length
  const aiCallCount = input.signals.reduce(
    (sum, signal) => sum + signal.aiCallCount,
    0
  )
  const aiTotal = input.aiSuccessCount + input.aiFailureCount

  const lastActiveAt =
    input.signals
      .map((signal) => signal.updatedAt)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null

  return {
    sessionCount,
    completionRate: sessionCount > 0 ? completedCount / sessionCount : 0,
    aiCallCount,
    aiSuccessCount: input.aiSuccessCount,
    aiFailureCount: input.aiFailureCount,
    aiFailureRate: aiTotal > 0 ? input.aiFailureCount / aiTotal : 0,
    exportCount: input.exportCount,
    lastActiveAt: lastActiveAt ? lastActiveAt.toISOString() : null,
  }
}

type ClientEventTimelineInput = {
  id: string
  createdAt: Date
  eventType: string
  feature: string
  sessionId: string | null
  metadata?: unknown
}

type AuditTimelineInput = {
  id: string
  createdAt: Date
  action: string
  resource: string
  sessionId: string | null
  success: boolean
}

export function buildUserTimelineEvents(
  clientEvents: ClientEventTimelineInput[],
  auditEvents: AuditTimelineInput[]
): AdminUserTimelineEvent[] {
  const normalizedClientEvents: AdminUserTimelineEvent[] = clientEvents.map((event) => ({
    id: `client:${event.id}`,
    timestamp: event.createdAt.toISOString(),
    source: "client",
    category: clientEventCategory(event.eventType),
    label: clientEventLabel(event.eventType, event.feature, event.metadata),
    detail: clientEventDetail(event.eventType, event.metadata),
    feature: event.feature,
    sessionId: event.sessionId,
    status: clientEventStatus(event.eventType),
  }))

  const normalizedAuditEvents: AdminUserTimelineEvent[] = auditEvents.map((event) => ({
    id: `audit:${event.id}`,
    timestamp: event.createdAt.toISOString(),
    source: "audit",
    category: auditEventCategory(event.resource),
    label: auditEventLabel(event.action, event.resource),
    detail: event.success ? undefined : "Operation failed",
    sessionId: event.sessionId,
    status: event.success ? "success" : "failed",
  }))

  return [...normalizedClientEvents, ...normalizedAuditEvents].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  )
}
