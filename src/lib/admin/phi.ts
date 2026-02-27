import { createHash } from "crypto"
import type { PhiRevealRequest } from "@/types/admin"

const PHI_FIELD_NAMES = new Set([
  "patientname",
  "text",
  "summary",
  "keyfindings",
  "redflags",
  "chiefcomplaint",
  "hpitext",
  "medications",
  "rostext",
  "pmh",
  "socialhistory",
  "familyhistory",
  "vitals",
  "physicalexam",
  "labsstudies",
  "assessment",
  "plan",
  "conditions",
  "entries",
  "content",
  "imageurls",
  "storagepaths",
  "diseasename",
  "evidence",
  "citations",
  "doctornote",
])

const REVEAL_WHITELIST: Record<PhiRevealRequest["entityType"], Set<string>> = {
  session: new Set(["patientName"]),
  transcriptEntry: new Set(["text"]),
  insights: new Set(["summary", "keyFindings", "redFlags"]),
  consultationRecord: new Set([
    "patientName",
    "chiefComplaint",
    "hpiText",
    "medications",
    "rosText",
    "pmh",
    "socialHistory",
    "familyHistory",
    "vitals",
    "physicalExam",
    "labsStudies",
    "assessment",
    "plan",
  ]),
  patientHandout: new Set(["conditions", "entries"]),
  note: new Set(["content", "imageUrls", "storagePaths"]),
  researchMessage: new Set(["content", "citations"]),
  diagnosis: new Set(["diseaseName", "evidence", "citations"]),
  checklistItem: new Set(["doctorNote"]),
  exportLink: new Set(["content"]),
}

function shortHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12)
}

function maskString(value: string): string | Record<string, unknown> {
  if (!value) return ""

  const prefixLength = Math.min(3, Math.max(1, Math.floor(value.length / 4)))
  const suffixLength = Math.min(2, Math.max(1, Math.floor(value.length / 6)))
  const prefix = value.slice(0, prefixLength)
  const suffix = value.slice(-suffixLength)
  const masked = `${prefix}***${suffix}`

  if (value.length > 120) {
    const words = value.trim() ? value.trim().split(/\s+/).length : 0
    return {
      masked,
      length: value.length,
      words,
      sha256: shortHash(value),
    }
  }

  return masked
}

function maskSensitive(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return maskString(value)
  if (Array.isArray(value)) return value.map(maskSensitive)
  if (typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = maskSensitive(v)
    }
    return out
  }
  return value
}

export function maskPhiValue<T>(value: T): T {
  if (value === null || value === undefined) return value
  if (value instanceof Date) return value.toISOString() as T
  if (Array.isArray(value)) {
    return value.map((item) => maskPhiValue(item)) as T
  }
  if (typeof value !== "object") return value

  const src = value as Record<string, unknown>
  const out: Record<string, unknown> = {}

  for (const [key, raw] of Object.entries(src)) {
    if (PHI_FIELD_NAMES.has(key.toLowerCase())) {
      out[key] = maskSensitive(raw)
      continue
    }

    if (raw && typeof raw === "object") {
      out[key] = maskPhiValue(raw)
      continue
    }

    out[key] = raw
  }

  return out as T
}

export function maskSessionDetailPayload<T>(payload: T): T {
  return maskPhiValue(payload)
}

export function isRevealAllowedField(
  entityType: PhiRevealRequest["entityType"],
  fieldPath: string
): boolean {
  return REVEAL_WHITELIST[entityType].has(fieldPath)
}

export function getNestedValue(source: unknown, fieldPath: string): unknown {
  if (!source || typeof source !== "object") return undefined
  const parts = fieldPath.split(".").filter(Boolean)
  let current: unknown = source
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}
