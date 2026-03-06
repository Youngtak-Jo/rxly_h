export const DOCUMENT_CATEGORIES = [
  "claims-review",
  "billing-compliance",
  "insurer-communication",
  "utilization-review",
  "clinical-documentation",
  "referral-communication",
  "consent-and-legal",
  "discharge-and-followup",
  "care-plan",
  "patient-education",
  "patient-certificates",
  "administrative-form",
  "other",
] as const

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]

const CATEGORY_ALIASES: Record<string, DocumentCategory> = {
  // Core legacy values
  documentation: "clinical-documentation",
  general: "clinical-documentation",
  "문서": "clinical-documentation",

  claims: "claims-review",
  "청구": "claims-review",

  patient: "patient-education",
  "환자-안내": "patient-education",

  // Built-in/legacy variants
  "patient-education": "patient-education",
  "clinical-documentation": "clinical-documentation",
  "patient-certificates": "patient-certificates",

  // Common synonyms
  billing: "billing-compliance",
  compliance: "billing-compliance",
  insurer: "insurer-communication",
  "insurer-communication": "insurer-communication",
  utilization: "utilization-review",
  "utilization-review": "utilization-review",
  referral: "referral-communication",
  "referral-communication": "referral-communication",
  consent: "consent-and-legal",
  legal: "consent-and-legal",
  discharge: "discharge-and-followup",
  followup: "discharge-and-followup",
  "후속-관리": "discharge-and-followup",
  "care-plan": "care-plan",
  certificate: "patient-certificates",
  certificates: "patient-certificates",
  "patient-certificate": "patient-certificates",
  "medical-certificate": "patient-certificates",
  "환자-발급": "patient-certificates",
  "환자-증명서": "patient-certificates",
  "제증명": "patient-certificates",
  "제증명서": "patient-certificates",
  "administrative-form": "administrative-form",
  admin: "administrative-form",
  other: "other",
  기타: "other",
}

function normalizeAliasKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
}

export function isDocumentCategory(value: string): value is DocumentCategory {
  return (DOCUMENT_CATEGORIES as readonly string[]).includes(value)
}

export function normalizeDocumentCategory(
  value: string | null | undefined
): DocumentCategory {
  if (!value) return "other"
  if (isDocumentCategory(value)) return value

  const normalized = normalizeAliasKey(value)
  if (isDocumentCategory(normalized)) {
    return normalized
  }

  return CATEGORY_ALIASES[normalized] ?? "other"
}

export function getDocumentCategoryLabelKey(category: string): string {
  return `categories.${normalizeDocumentCategory(category)}`
}

export function getDocumentCategoryOptions(): Array<{
  value: DocumentCategory
  labelKey: string
}> {
  return DOCUMENT_CATEGORIES.map((value) => ({
    value,
    labelKey: getDocumentCategoryLabelKey(value),
  }))
}
