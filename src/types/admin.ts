import type { SessionDocumentRecord } from "@/types/document"

export type AdminInterval = "hour" | "day"
export type AdminMode = "ALL" | "DOCTOR" | "AI_DOCTOR"
export type AdminPreset = "24h" | "7d" | "30d" | "custom"
export type AdminTimezone = "local" | "UTC"

export type AdminFeature =
  | "all"
  | "insights"
  | "ddx"
  | "record"
  | "research"
  | "patientHandout"

export type AdminSortOrder = "asc" | "desc"
export type AdminRiskBand = "all" | "critical" | "high" | "medium" | "low"
export type AdminSeverity = "all" | "high" | "medium" | "low" | "positive"

export type AdminIncidentStatus =
  | "all"
  | "NEW"
  | "ACK"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "DISMISSED"

export type AdminIncidentPriority = "all" | "P1" | "P2" | "P3"

export type AdminUsersSort = "sessions" | "completion" | "ai" | "lastActive" | "risk"
export type AdminSessionsSort = "startedAt" | "completion" | "ai" | "risk"

export interface AdminFilters {
  preset: AdminPreset
  from: string
  to: string
  timezone: AdminTimezone
  mode: AdminMode
  feature: AdminFeature
  q: string
  severity: AdminSeverity
  rule: string
  status: AdminIncidentStatus
  owner: string
  priority: AdminIncidentPriority
  segment: string
  riskBand: AdminRiskBand
  hasRedFlag: "all" | "yes" | "no"
  usersSort: AdminUsersSort
  sessionsSort: AdminSessionsSort
  order: AdminSortOrder
}

export interface AdminKpis {
  dau: number
  activeSessions: number
  // Deprecated in phase 1 UI. This still represents record finalization rate.
  sessionCompletionRate: number
  aiCalls: number
  documentGenerationRate: number
  exportCount: number
  aiFailureRate: number
  aiCostUsd: number
  aiP50LatencyMs: number
  aiP95LatencyMs: number
  unresolvedIncidents: number
}

export type AdminFunnelStepKey =
  | "sessionStarted"
  | "transcriptCaptured"
  | "insightsDone"
  | "ddxDone"
  | "recordDone"
  | "researchUsed"
  | "handoutDone"
  | "exportDone"

export interface AdminFunnelStep {
  step: AdminFunnelStepKey
  count: number
  rate: number
}

export interface AdminFunnelDropoff {
  fromStep: AdminFunnelStepKey
  toStep: AdminFunnelStepKey
  dropCount: number
  dropRate: number
}

export interface AdminTrendPoint {
  bucket: string
  sessions: number
  aiCalls: number
  // Kept for backward compatibility. UI should label this as workflow progress.
  completionRate: number
}

export interface AdminMetricDelta {
  previous: number
  delta: number
  deltaRatio: number | null
}

export interface AdminHomeSummary {
  activeUsers: number
  sessionStarts: number
  transcriptCaptureRate: number
  recordFinalizationRate: number
  ddxAdoptionRate: number
  handoutGenerationRate: number
  aiCostPerSession: number
  aiFailureRate: number
}

export interface AdminHomeComparisons {
  activeUsers: AdminMetricDelta
  sessionStarts: AdminMetricDelta
  transcriptCaptureRate: AdminMetricDelta
  recordFinalizationRate: AdminMetricDelta
  ddxAdoptionRate: AdminMetricDelta
  handoutGenerationRate: AdminMetricDelta
  aiCostPerSession: AdminMetricDelta
  aiFailureRate: AdminMetricDelta
}

export interface AdminInsightAlert {
  id: string
  rule:
    | "DropOffBeforeRecord"
    | "HighAiRegeneration"
    | "RepeatedAnalysisFailure"
    | "AiFailureImbalance"
    | "LowTranscriptQuality"
    | "ResearchHeavyNoClosure"
    | "RedFlagUnresolved"
    | "ExportRiskSpike"
    | "DormantPowerUser"
    | "FastComplete"
  severity: "high" | "medium" | "low" | "positive"
  userId?: string
  sessionId?: string
  title: string
  description: string
  metadata?: Record<string, unknown>
}

export interface AdminIncidentRow {
  id: string
  fingerprint: string
  rule: string
  severity: Exclude<AdminSeverity, "all">
  priority: Exclude<AdminIncidentPriority, "all">
  userId?: string | null
  sessionId?: string | null
  title: string
  description: string
  metadata?: Record<string, unknown> | null
  firstSeenAt: string
  lastSeenAt: string
  occurrenceCount: number
  status: Exclude<AdminIncidentStatus, "all">
  ownerId?: string | null
  dueAt?: string | null
  resolutionNote?: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminIncidentActivity {
  id: string
  incidentId: string
  actorId: string
  action: string
  metadata?: Record<string, unknown> | null
  createdAt: string
}

export interface AdminIncidentsResponse {
  rows: AdminIncidentRow[]
  nextCursor: string | null
  totalCount: number
  openCount: number
}

export interface AdminOverviewResponse {
  from: string
  to: string
  interval: AdminInterval
  kpis: AdminKpis
  funnel: AdminFunnelStep[]
  trends: AdminTrendPoint[]
  alerts: AdminInsightAlert[]
}

export interface AdminAttentionRule {
  rule: string
  severity: Exclude<AdminSeverity, "all">
  count: number
}

export interface AdminTelemetryCoverage {
  sessionsWithAnyClientEvents: number
  sessionCoverageRate: number
  sessionsWithTranscriptNoAiCall: number
  sessionsWithAiCallNoClientEvents: number
}

export interface AdminAiOverview {
  totalCostUsd: number
  costPerSession: number
  p95LatencyMs: number
  costConcentrationRate: number
  topCostRow: AdminAiOpsRow | null
  topFailingRows: AdminAiOpsRow[]
}

export interface AdminHomeAttention {
  liveAlerts: AdminInsightAlert[]
  incidents: AdminIncidentRow[]
  topRules: AdminAttentionRule[]
}

export type AdminFeatureAdoptionFeature =
  | "transcript"
  | "insights"
  | "ddx"
  | "record"
  | "research"
  | "handout"
  | "export"

export interface AdminFeatureAdoptionRow {
  feature: AdminFeatureAdoptionFeature
  sessions: number
  rate: number
  delta: AdminMetricDelta
}

export interface AdminHomeResponse extends AdminOverviewResponse {
  urgentIncidents: AdminIncidentRow[]
  summary: AdminHomeSummary
  comparisons: AdminHomeComparisons
  telemetry: AdminTelemetryCoverage
  aiOverview: AdminAiOverview
  attention: AdminHomeAttention
  featureAdoption: AdminFeatureAdoptionRow[]
}

export interface AdminFunnelResponse {
  from: string
  to: string
  steps: AdminFunnelStep[]
  dropoffs: AdminFunnelDropoff[]
}

export interface AdminCohortPoint {
  cohortDate: string
  cohortSize: number
  d1: number
  d7: number
  d30: number
}

export interface AdminCohortsResponse {
  from: string
  to: string
  cohorts: AdminCohortPoint[]
}

export interface AdminAiOpsRow {
  feature: string
  model: string
  calls: number
  successCount: number
  failureCount: number
  failureRate: number
  p50LatencyMs: number
  p95LatencyMs: number
  costUsd: number
}

export interface AdminAiOpsResponse {
  from: string
  to: string
  rows: AdminAiOpsRow[]
}

export interface AdminComplianceRevealLog {
  id: string
  adminUserId: string
  entityType?: string
  entityId?: string
  fieldPath?: string
  reason?: string
  createdAt: string
}

export interface AdminComplianceExportSignal {
  userId: string
  exportCount: number
  avgAccessCount: number
}

export interface AdminComplianceResponse {
  from: string
  to: string
  revealLogs: AdminComplianceRevealLog[]
  exportSignals: AdminComplianceExportSignal[]
}

export interface AdminDataQualityResponse {
  from: string
  to: string
  transcriptQuality: {
    sessionCount: number
    avgConfidence: number
    avgUnknownRatio: number
    lowQualitySessions: number
  }
  telemetryIntegrity: {
    sessionsWithTranscriptNoAiCall: number
    sessionsWithAiCallNoClientEvents: number
  }
}

export interface AdminSavedView {
  id: string
  adminUserId: string
  pageKey: string
  name: string
  params: Record<string, string>
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminSavedViewsResponse {
  rows: AdminSavedView[]
}

export type AdminTimelineCategory =
  | "navigation"
  | "recording"
  | "note"
  | "image"
  | "analysis"
  | "export"
  | "system"

export interface AdminUserBehaviorKpis {
  sessionCount: number
  completionRate: number
  aiCallCount: number
  aiSuccessCount: number
  aiFailureCount: number
  aiFailureRate: number
  exportCount: number
  lastActiveAt: string | null
}

export interface AdminUserTimelineEvent {
  id: string
  timestamp: string
  source: "client" | "audit"
  category: AdminTimelineCategory
  label: string
  detail?: string
  feature?: string
  sessionId?: string | null
  status: "success" | "failed" | "info"
}

export interface AdminUserSessionMapRow {
  id: string
  mode: "DOCTOR" | "AI_DOCTOR"
  title: string | null
  startedAt: string
  updatedAt: string
  patientNameMasked: string | null
  // Deprecated alias maintained for compatibility. Mirrors recordFinalizationRate.
  completionRate: number
  recordFinalizationRate: number
  workflowProgress: number
  aiCallCount: number
  exportCount: number
  hasInsights: boolean
  hasDdx: boolean
  hasRecord: boolean
  hasResearch: boolean
  hasHandout: boolean
  riskFlags: string[]
  riskBand: Exclude<AdminRiskBand, "all">
}

export interface AdminUserDetailResponse {
  userId: string
  email?: string
  displayName?: string
  from: string
  to: string
  mode: "ALL" | "DOCTOR" | "AI_DOCTOR"
  feature: AdminFeature
  behavior: AdminUserBehaviorKpis
  funnel: AdminFunnelStep[]
  alerts: AdminInsightAlert[]
  sessions: AdminUserSessionMapRow[]
  timeline: AdminUserTimelineEvent[]
}

export interface AdminUserRow {
  userId: string
  email?: string
  displayName?: string
  sessionCount: number
  aiCallCount: number
  completionRate: number
  lastActiveAt: string | null
  riskFlags: string[]
  riskBand: Exclude<AdminRiskBand, "all">
  riskScore: number
}

export interface AdminUsersResponse {
  rows: AdminUserRow[]
  nextCursor: string | null
  totalCount: number
}

export interface AdminSessionRow {
  id: string
  userId: string
  userEmail?: string
  mode: "DOCTOR" | "AI_DOCTOR"
  title: string | null
  patientNameMasked: string | null
  startedAt: string
  updatedAt: string
  transcriptCount: number
  aiCallCount: number
  hasInsights: boolean
  hasDdx: boolean
  hasRecord: boolean
  hasResearch: boolean
  hasHandout: boolean
  hasRedFlag: boolean
  exportCount: number
  // Deprecated alias maintained for compatibility. Mirrors recordFinalizationRate.
  completionRate: number
  recordFinalizationRate: number
  workflowProgress: number
  riskFlags: string[]
  riskBand: Exclude<AdminRiskBand, "all">
  riskScore: number
}

export interface AdminSessionsResponse {
  rows: AdminSessionRow[]
  nextCursor: string | null
  totalCount: number
}

export interface AdminSessionDetail {
  session: Record<string, unknown>
  transcriptEntries: Record<string, unknown>[]
  insights: Record<string, unknown> | null
  diagnoses: Record<string, unknown>[]
  record: Record<string, unknown> | null
  notes: Record<string, unknown>[]
  researchMessages: Record<string, unknown>[]
  patientHandout: Record<string, unknown> | null
  sessionDocuments: SessionDocumentRecord[]
  checklistItems: Record<string, unknown>[]
  clientEvents: Record<string, unknown>[]
  auditTimeline: Record<string, unknown>[]
}

export interface PhiRevealRequest {
  entityType:
    | "session"
    | "transcriptEntry"
    | "insights"
    | "consultationRecord"
    | "patientHandout"
    | "note"
    | "researchMessage"
    | "diagnosis"
    | "checklistItem"
    | "exportLink"
  entityId: string
  fieldPath: string
  reason: string
}

export interface PhiRevealResponse {
  entityType: PhiRevealRequest["entityType"]
  entityId: PhiRevealRequest["entityId"]
  fieldPath: PhiRevealRequest["fieldPath"]
  value: unknown
}

export interface AdminInsightsResponse {
  generatedAt: string
  alerts: AdminInsightAlert[]
}

export interface SessionSignals {
  sessionId: string
  userId: string
  startedAt: Date
  updatedAt: Date
  transcriptCount: number
  transcriptAvgConfidence: number
  transcriptUnknownRatio: number
  aiCallCount: number
  hasInsights: boolean
  hasDdx: boolean
  hasRecord: boolean
  hasResearch: boolean
  hasHandout: boolean
  hasExport: boolean
  researchMessageCount: number
  redFlagCount: number
  recordHasPlan: boolean
  recordHasAssessment: boolean
  completionRate: number
}
