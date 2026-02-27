import { redirect } from "next/navigation"
import { createDefaultAdminFilters, filtersToSearchParams } from "@/lib/admin/filters"

export type RouteSearchParams = Record<
  string,
  string | string[] | undefined
>

const REQUIRED_FILTER_KEYS = [
  "preset",
  "from",
  "to",
  "timezone",
  "mode",
  "feature",
  "q",
  "severity",
  "rule",
  "status",
  "owner",
  "priority",
  "segment",
  "riskBand",
  "hasRedFlag",
  "usersSort",
  "sessionsSort",
  "order",
] as const

function toFirst(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value
  if (Array.isArray(value)) return value[0]
  return undefined
}

export function normalizeRouteSearchParams(
  raw: RouteSearchParams
): URLSearchParams {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(raw)) {
    const first = toFirst(value)
    if (first !== undefined) {
      params.set(key, first)
    }
  }

  return params
}

export function ensureAdminFilterParams(
  pathname: string,
  raw: RouteSearchParams
): URLSearchParams {
  const params = normalizeRouteSearchParams(raw)
  const hasAllRequired = REQUIRED_FILTER_KEYS.every((key) => params.has(key))

  if (!hasAllRequired) {
    const defaults = filtersToSearchParams(createDefaultAdminFilters())
    redirect(`${pathname}?${defaults.toString()}`)
  }

  return params
}
