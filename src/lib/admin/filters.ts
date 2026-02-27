import type {
  AdminFeature,
  AdminFilters,
  AdminIncidentPriority,
  AdminIncidentStatus,
  AdminMode,
  AdminPreset,
  AdminRiskBand,
  AdminSeverity,
  AdminSessionsSort,
  AdminSortOrder,
  AdminTimezone,
  AdminUsersSort,
} from "@/types/admin"
import { normalizeAdminFeature } from "@/lib/admin/feature"

const PRESET_VALUES: AdminPreset[] = ["24h", "7d", "30d", "custom"]
const MODE_VALUES: AdminMode[] = ["ALL", "DOCTOR", "AI_DOCTOR"]
const TIMEZONE_VALUES: AdminTimezone[] = ["local", "UTC"]
const SEVERITY_VALUES: AdminSeverity[] = ["all", "high", "medium", "low", "positive"]
const STATUS_VALUES: AdminIncidentStatus[] = [
  "all",
  "NEW",
  "ACK",
  "IN_PROGRESS",
  "RESOLVED",
  "DISMISSED",
]
const PRIORITY_VALUES: AdminIncidentPriority[] = ["all", "P1", "P2", "P3"]
const RISK_BAND_VALUES: AdminRiskBand[] = ["all", "critical", "high", "medium", "low"]
const USERS_SORT_VALUES: AdminUsersSort[] = [
  "sessions",
  "completion",
  "ai",
  "lastActive",
  "risk",
]
const SESSIONS_SORT_VALUES: AdminSessionsSort[] = [
  "startedAt",
  "completion",
  "ai",
  "risk",
]
const SORT_ORDER_VALUES: AdminSortOrder[] = ["asc", "desc"]

export const ADMIN_DEFAULT_FEATURE: AdminFeature = "all"
export const ADMIN_CACHE_TTL_MS = 45_000

type SearchParamReader = { get: (name: string) => string | null }

function includesString<T extends string>(arr: readonly T[], value: string | null): value is T {
  return !!value && arr.includes(value as T)
}

function isValidPreset(value: string | null): value is AdminPreset {
  return includesString(PRESET_VALUES, value)
}

function isValidMode(value: string | null): value is AdminMode {
  return includesString(MODE_VALUES, value)
}

function isValidTimezone(value: string | null): value is AdminTimezone {
  return includesString(TIMEZONE_VALUES, value)
}

function isValidSeverity(value: string | null): value is AdminSeverity {
  return includesString(SEVERITY_VALUES, value)
}

function isValidStatus(value: string | null): value is AdminIncidentStatus {
  return includesString(STATUS_VALUES, value)
}

function isValidPriority(value: string | null): value is AdminIncidentPriority {
  return includesString(PRIORITY_VALUES, value)
}

function isValidRiskBand(value: string | null): value is AdminRiskBand {
  return includesString(RISK_BAND_VALUES, value)
}

function isValidUsersSort(value: string | null): value is AdminUsersSort {
  return includesString(USERS_SORT_VALUES, value)
}

function isValidSessionsSort(value: string | null): value is AdminSessionsSort {
  return includesString(SESSIONS_SORT_VALUES, value)
}

function isValidSortOrder(value: string | null): value is AdminSortOrder {
  return includesString(SORT_ORDER_VALUES, value)
}

function isValidDateString(value: string | null): value is string {
  if (!value) return false
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime())
}

export function buildRangeFromPreset(
  preset: Exclude<AdminPreset, "custom">,
  now = new Date()
): { from: string; to: string } {
  const to = new Date(now)
  const from = new Date(to)

  if (preset === "24h") {
    from.setHours(from.getHours() - 24)
  } else if (preset === "30d") {
    from.setDate(from.getDate() - 30)
  } else {
    from.setDate(from.getDate() - 7)
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  }
}

export function createDefaultAdminFilters(now = new Date()): AdminFilters {
  const range = buildRangeFromPreset("7d", now)
  return {
    preset: "7d",
    from: range.from,
    to: range.to,
    timezone: "local",
    mode: "ALL",
    feature: ADMIN_DEFAULT_FEATURE,
    q: "",
    severity: "all",
    rule: "",
    status: "all",
    owner: "",
    priority: "all",
    segment: "",
    riskBand: "all",
    hasRedFlag: "all",
    usersSort: "sessions",
    sessionsSort: "startedAt",
    order: "desc",
  }
}

export function parseAdminFilters(searchParams: SearchParamReader): AdminFilters {
  const preset = isValidPreset(searchParams.get("preset"))
    ? (searchParams.get("preset") as AdminPreset)
    : "7d"

  const mode = isValidMode(searchParams.get("mode"))
    ? (searchParams.get("mode") as AdminMode)
    : "ALL"

  const feature = normalizeAdminFeature(searchParams.get("feature"))
  const q = (searchParams.get("q") || "").trim()
  const timezone = isValidTimezone(searchParams.get("timezone"))
    ? (searchParams.get("timezone") as AdminTimezone)
    : "local"

  const severity = isValidSeverity(searchParams.get("severity"))
    ? (searchParams.get("severity") as AdminSeverity)
    : "all"
  const status = isValidStatus(searchParams.get("status"))
    ? (searchParams.get("status") as AdminIncidentStatus)
    : "all"
  const priority = isValidPriority(searchParams.get("priority"))
    ? (searchParams.get("priority") as AdminIncidentPriority)
    : "all"
  const riskBand = isValidRiskBand(searchParams.get("riskBand"))
    ? (searchParams.get("riskBand") as AdminRiskBand)
    : "all"
  const usersSort = isValidUsersSort(searchParams.get("usersSort"))
    ? (searchParams.get("usersSort") as AdminUsersSort)
    : "sessions"
  const sessionsSort = isValidSessionsSort(searchParams.get("sessionsSort"))
    ? (searchParams.get("sessionsSort") as AdminSessionsSort)
    : "startedAt"
  const order = isValidSortOrder(searchParams.get("order"))
    ? (searchParams.get("order") as AdminSortOrder)
    : "desc"

  const hasRedFlag =
    searchParams.get("hasRedFlag") === "yes" || searchParams.get("hasRedFlag") === "no"
      ? (searchParams.get("hasRedFlag") as "yes" | "no")
      : "all"

  const now = new Date()
  const fallbackRange =
    preset === "custom"
      ? buildRangeFromPreset("7d", now)
      : buildRangeFromPreset(preset, now)

  let from = isValidDateString(searchParams.get("from"))
    ? (searchParams.get("from") as string)
    : fallbackRange.from

  let to = isValidDateString(searchParams.get("to"))
    ? (searchParams.get("to") as string)
    : fallbackRange.to

  const fromDate = new Date(from)
  const toDate = new Date(to)
  if (fromDate > toDate) {
    from = fallbackRange.from
    to = fallbackRange.to
  }

  return {
    preset,
    from,
    to,
    timezone,
    mode,
    feature,
    q,
    severity,
    rule: (searchParams.get("rule") || "").trim(),
    status,
    owner: (searchParams.get("owner") || "").trim(),
    priority,
    segment: (searchParams.get("segment") || "").trim(),
    riskBand,
    hasRedFlag,
    usersSort,
    sessionsSort,
    order,
  }
}

export function filtersToSearchParams(filters: AdminFilters): URLSearchParams {
  const params = new URLSearchParams()
  params.set("preset", filters.preset)
  params.set("from", filters.from)
  params.set("to", filters.to)
  params.set("timezone", filters.timezone)
  params.set("mode", filters.mode)
  params.set("feature", filters.feature)
  params.set("q", filters.q)

  params.set("severity", filters.severity)
  params.set("rule", filters.rule)
  params.set("status", filters.status)
  params.set("owner", filters.owner)
  params.set("priority", filters.priority)
  params.set("segment", filters.segment)
  params.set("riskBand", filters.riskBand)
  params.set("hasRedFlag", filters.hasRedFlag)
  params.set("usersSort", filters.usersSort)
  params.set("sessionsSort", filters.sessionsSort)
  params.set("order", filters.order)

  return params
}

export function toAdminApiParams(
  filters: AdminFilters,
  extra: Record<string, string | null | undefined> = {}
): URLSearchParams {
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
    interval: filters.preset === "24h" ? "hour" : "day",
    timezone: filters.timezone,
    feature: filters.feature,
    q: filters.q,
  })

  if (filters.mode !== "ALL") {
    params.set("mode", filters.mode)
  }

  if (filters.severity !== "all") params.set("severity", filters.severity)
  if (filters.rule) params.set("rule", filters.rule)
  if (filters.status !== "all") params.set("status", filters.status)
  if (filters.owner) params.set("owner", filters.owner)
  if (filters.priority !== "all") params.set("priority", filters.priority)
  if (filters.segment) params.set("segment", filters.segment)
  if (filters.riskBand !== "all") params.set("riskBand", filters.riskBand)
  if (filters.hasRedFlag !== "all") params.set("hasRedFlag", filters.hasRedFlag)
  if (filters.usersSort !== "sessions") params.set("usersSort", filters.usersSort)
  if (filters.sessionsSort !== "startedAt") {
    params.set("sessionsSort", filters.sessionsSort)
  }
  if (filters.order !== "desc") params.set("order", filters.order)

  for (const [key, value] of Object.entries(extra)) {
    if (value === null || value === undefined || value === "") {
      continue
    }
    params.set(key, value)
  }

  return params
}

export function isoToLocalDateTimeInput(iso: string): string {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return ""

  const offsetMs = parsed.getTimezoneOffset() * 60_000
  const localDate = new Date(parsed.getTime() - offsetMs)
  return localDate.toISOString().slice(0, 16)
}

export function localDateTimeInputToIso(value: string): string | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}
