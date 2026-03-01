import type { AdminFeature } from "@/types/admin"

export const ADMIN_FEATURE_VALUES: AdminFeature[] = [
  "all",
  "insights",
  "ddx",
  "record",
  "research",
  "patientHandout",
]

export function normalizeAdminFeature(
  value: string | null | undefined
): AdminFeature {
  const normalized = (value || "").trim()
  if (!normalized) return "all"

  if (normalized === "patient_handout" || normalized === "patient-handout") {
    return "patientHandout"
  }

  if (ADMIN_FEATURE_VALUES.includes(normalized as AdminFeature)) {
    return normalized as AdminFeature
  }

  return "all"
}

export function matchesClientFeature(
  selectedFeature: AdminFeature,
  rawFeature: string
): boolean {
  if (selectedFeature === "all") return true
  if (selectedFeature === "patientHandout") {
    return (
      rawFeature === "patient_handout" ||
      rawFeature === "patientHandout" ||
      rawFeature === "handout"
    )
  }
  return rawFeature === selectedFeature
}

export function matchesAiUsageFeature(
  selectedFeature: AdminFeature,
  rawFeature: string
): boolean {
  if (selectedFeature === "all") return true
  if (selectedFeature === "insights") {
    return rawFeature === "ai_insights" || rawFeature === "insights"
  }
  if (selectedFeature === "ddx") {
    return rawFeature === "ai_ddx" || rawFeature === "ddx"
  }
  if (selectedFeature === "record") {
    return rawFeature === "ai_record" || rawFeature === "record"
  }
  if (selectedFeature === "research") {
    return rawFeature === "ai_research" || rawFeature === "research"
  }
  return (
    rawFeature === "ai_patient_handout" ||
    rawFeature === "patient_handout" ||
    rawFeature === "patientHandout"
  )
}
