import type { AdminIncidentPriority, AdminRiskBand } from "@/types/admin"

export type AlertSeverity = "high" | "medium" | "low" | "positive"

export function severityRank(severity: AlertSeverity): number {
  if (severity === "high") return 4
  if (severity === "medium") return 3
  if (severity === "low") return 2
  return 1
}

export function priorityFromSeverity(
  severity: AlertSeverity
): Exclude<AdminIncidentPriority, "all"> {
  if (severity === "high") return "P1"
  if (severity === "medium") return "P2"
  return "P3"
}

export function riskBandFromSeverities(
  severities: AlertSeverity[]
): Exclude<AdminRiskBand, "all"> {
  if (severities.some((severity) => severity === "high")) return "critical"
  if (severities.some((severity) => severity === "medium")) return "high"
  if (severities.some((severity) => severity === "low")) return "medium"
  return "low"
}

export function normalizeRiskBand(
  value: string | null | undefined
): AdminRiskBand {
  if (
    value === "critical" ||
    value === "high" ||
    value === "medium" ||
    value === "low"
  ) {
    return value
  }
  return "all"
}

export function calculateRiskScore(input: {
  severities: AlertSeverity[]
  completionRate: number
  redFlagCount?: number
  aiCallCount?: number
}): number {
  const severityScore = input.severities.reduce(
    (sum, severity) => sum + severityRank(severity),
    0
  )
  const completionPenalty = Math.max(0, 1 - input.completionRate) * 8
  const redFlagScore = Math.max(0, input.redFlagCount ?? 0) * 2
  const aiPressureScore = Math.min(5, Math.max(0, (input.aiCallCount ?? 0) / 4))

  return Number((severityScore + completionPenalty + redFlagScore + aiPressureScore).toFixed(3))
}
