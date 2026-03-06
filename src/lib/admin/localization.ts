import type {
  AdminFeature,
  AdminFeatureAdoptionFeature,
  AdminFunnelStepKey,
  AdminIncidentPriority,
  AdminIncidentRow,
  AdminIncidentStatus,
  AdminInsightAlert,
  AdminMode,
  AdminRiskBand,
  AdminSeverity,
  AdminTimelineCategory,
} from "@/types/admin"

type TranslationValues = Record<string, string | number>
type AdminTranslator = {
  (...args: never[]): string
  has?: (...args: never[]) => boolean
}

type AdminAlertLike = Pick<AdminInsightAlert, "rule" | "title" | "description" | "metadata"> |
  Pick<AdminIncidentRow, "rule" | "title" | "description" | "metadata">

const FEATURE_KEY_BY_VALUE: Record<string, string> = {
  all: "all",
  transcript: "transcript",
  insights: "insights",
  ddx: "ddx",
  record: "record",
  research: "research",
  patientHandout: "patientHandout",
  patient_handout: "patientHandout",
  handout: "handout",
  export: "export",
}

function translateOrFallback(
  t: AdminTranslator,
  key: string,
  fallback: string,
  values?: TranslationValues
): string {
  const translate = t as unknown as (
    key: string,
    values?: TranslationValues
  ) => string
  const hasTranslation = t.has as
    | ((key: string) => boolean)
    | undefined

  if (typeof hasTranslation === "function" && hasTranslation(key)) {
    return translate(key, values)
  }
  return fallback
}

function getNumber(metadata: Record<string, unknown> | null | undefined, key: string): number | null {
  const value = metadata?.[key]
  return typeof value === "number" ? value : null
}

function getString(metadata: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = metadata?.[key]
  return typeof value === "string" ? value : null
}

function toPercentValue(value: number): number {
  return Math.round(value * 100)
}

export function getAdminModeLabel(t: AdminTranslator, mode: AdminMode): string {
  return translateOrFallback(t, `mode.${mode}`, mode)
}

export function getAdminFeatureLabel(
  t: AdminTranslator,
  feature: AdminFeature | AdminFeatureAdoptionFeature | string
): string {
  const key = FEATURE_KEY_BY_VALUE[feature] ?? feature
  return translateOrFallback(t, `feature.${key}`, feature)
}

export function getAdminSeverityLabel(t: AdminTranslator, severity: AdminSeverity): string {
  return translateOrFallback(t, `severity.${severity}`, severity)
}

export function getAdminPriorityLabel(
  t: AdminTranslator,
  priority: AdminIncidentPriority
): string {
  return translateOrFallback(t, `priority.${priority}`, priority)
}

export function getAdminStatusLabel(t: AdminTranslator, status: AdminIncidentStatus): string {
  return translateOrFallback(t, `status.${status}`, status)
}

export function getAdminRiskBandLabel(t: AdminTranslator, riskBand: AdminRiskBand): string {
  return translateOrFallback(t, `riskBand.${riskBand}`, riskBand)
}

export function getAdminTimezoneLabel(
  t: AdminTranslator,
  timezone: "local" | "UTC"
): string {
  return translateOrFallback(t, `timezone.${timezone}`, timezone)
}

export function getAdminFunnelStepLabel(
  t: AdminTranslator,
  step: AdminFunnelStepKey
): string {
  return translateOrFallback(t, `funnelStep.${step}`, step)
}

export function getAdminTimelineCategoryLabel(
  t: AdminTranslator,
  category: AdminTimelineCategory
): string {
  return translateOrFallback(t, `timelineCategory.${category}`, category)
}

export function getAdminTimelineStatusLabel(
  t: AdminTranslator,
  status: "success" | "failed" | "info"
): string {
  return translateOrFallback(t, `eventStatus.${status}`, status)
}

export function getAdminTimelineSourceLabel(
  t: AdminTranslator,
  source: "client" | "audit"
): string {
  return translateOrFallback(t, `eventSource.${source}`, source)
}

export function getAdminRuleLabel(t: AdminTranslator, rule: string): string {
  return translateOrFallback(t, `rules.${rule}.label`, rule)
}

export function getAdminAlertCopy(
  t: AdminTranslator,
  alert: AdminAlertLike
): { label: string; title: string; description: string } {
  const metadata =
    alert.metadata && typeof alert.metadata === "object"
      ? (alert.metadata as Record<string, unknown>)
      : null
  const label = getAdminRuleLabel(t, alert.rule)

  switch (alert.rule) {
    case "HighAiRegeneration": {
      const aiCallCount = getNumber(metadata, "aiCallCount")
      if (aiCallCount !== null) {
        return {
          label,
          title: translateOrFallback(
            t,
            "rules.HighAiRegeneration.title",
            alert.title || label
          ),
          description: translateOrFallback(
            t,
            "rules.HighAiRegeneration.description",
            alert.description || "",
            { aiCallCount }
          ),
        }
      }
      break
    }
    case "LowTranscriptQuality": {
      const transcriptAvgConfidence = getNumber(metadata, "transcriptAvgConfidence")
      const transcriptUnknownRatio = getNumber(metadata, "transcriptUnknownRatio")
      if (transcriptAvgConfidence !== null && transcriptUnknownRatio !== null) {
        return {
          label,
          title: translateOrFallback(
            t,
            "rules.LowTranscriptQuality.title",
            alert.title || label
          ),
          description: translateOrFallback(
            t,
            "rules.LowTranscriptQuality.description",
            alert.description || "",
            {
              confidence: toPercentValue(transcriptAvgConfidence),
              unknownRatio: toPercentValue(transcriptUnknownRatio),
            }
          ),
        }
      }
      break
    }
    case "RedFlagUnresolved": {
      const redFlagCount = getNumber(metadata, "redFlagCount")
      if (redFlagCount !== null) {
        return {
          label,
          title: translateOrFallback(
            t,
            "rules.RedFlagUnresolved.title",
            alert.title || label
          ),
          description: translateOrFallback(
            t,
            "rules.RedFlagUnresolved.description",
            alert.description || "",
            { redFlagCount }
          ),
        }
      }
      break
    }
    case "DormantPowerUser": {
      const last7Days = getNumber(metadata, "last7Days")
      const last30Days = getNumber(metadata, "last30Days")
      if (last7Days !== null && last30Days !== null) {
        return {
          label,
          title: translateOrFallback(
            t,
            "rules.DormantPowerUser.title",
            alert.title || label
          ),
          description: translateOrFallback(
            t,
            "rules.DormantPowerUser.description",
            alert.description || "",
            {
              last7Days,
              last30Days,
            }
          ),
        }
      }
      break
    }
    case "RepeatedAnalysisFailure": {
      const feature = getString(metadata, "feature")
      const failedCount = getNumber(metadata, "failedCount")
      if (feature && failedCount !== null) {
        return {
          label,
          title: translateOrFallback(
            t,
            "rules.RepeatedAnalysisFailure.title",
            alert.title || label,
            {
              feature: getAdminFeatureLabel(t, feature),
            }
          ),
          description: translateOrFallback(
            t,
            "rules.RepeatedAnalysisFailure.description",
            alert.description || "",
            {
              feature: getAdminFeatureLabel(t, feature),
              failedCount,
            }
          ),
        }
      }
      break
    }
    case "AiFailureImbalance": {
      const aiSuccessCount = getNumber(metadata, "aiSuccessCount")
      const aiFailureCount = getNumber(metadata, "aiFailureCount")
      const aiFailureRate = getNumber(metadata, "aiFailureRate")
      if (
        aiSuccessCount !== null &&
        aiFailureCount !== null &&
        aiFailureRate !== null
      ) {
        return {
          label,
          title: translateOrFallback(
            t,
            "rules.AiFailureImbalance.title",
            alert.title || label
          ),
          description: translateOrFallback(
            t,
            "rules.AiFailureImbalance.description",
            alert.description || "",
            {
              aiSuccessCount,
              aiFailureCount,
              aiFailureRate: toPercentValue(aiFailureRate),
            }
          ),
        }
      }
      break
    }
    default:
      const hasTranslation = (t as unknown as {
        has?: (key: string) => boolean
      }).has
      if (
        typeof hasTranslation === "function" &&
        hasTranslation(`rules.${alert.rule}.title`)
      ) {
        return {
          label,
          title: translateOrFallback(
            t,
            `rules.${alert.rule}.title`,
            alert.title || label
          ),
          description: translateOrFallback(
            t,
            `rules.${alert.rule}.description`,
            alert.description || ""
          ),
        }
      }
      break
  }

  return {
    label,
    title: alert.title || label,
    description: alert.description || "",
  }
}
