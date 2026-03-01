"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, ChevronUp, Filter, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  buildRangeFromPreset,
  createDefaultAdminFilters,
  filtersToSearchParams,
  isoToLocalDateTimeInput,
  localDateTimeInputToIso,
  parseAdminFilters,
} from "@/lib/admin/filters"
import { fmtDateTime } from "@/components/admin/admin-utils"
import { cn } from "@/lib/utils"
import type { AdminFilters, AdminSavedView } from "@/types/admin"

const PRESET_LABELS: Record<AdminFilters["preset"], string> = {
  "24h": "Last 24h",
  "7d": "Last 7d",
  "30d": "Last 30d",
  custom: "Custom range",
}

const MODE_LABELS: Record<AdminFilters["mode"], string> = {
  ALL: "All",
  DOCTOR: "Doctor",
  AI_DOCTOR: "AI Doctor",
}

const FEATURE_LABELS: Record<string, string> = {
  all: "All features",
  insights: "Live Insights",
  ddx: "Differential Dx",
  record: "Consultation Record",
  research: "Research",
  patientHandout: "Patient Handout",
}

function buildCustomRange(fromInput: string, toInput: string): { from: string; to: string } {
  const fallback = buildRangeFromPreset("7d")
  const toIso = localDateTimeInputToIso(toInput) || fallback.to
  const fromIso = localDateTimeInputToIso(fromInput)

  if (fromIso) {
    return {
      from: fromIso,
      to: toIso,
    }
  }

  const parsedTo = new Date(toIso)
  const fallbackFrom = new Date(parsedTo)
  fallbackFrom.setDate(fallbackFrom.getDate() - 7)

  return {
    from: fallbackFrom.toISOString(),
    to: parsedTo.toISOString(),
  }
}

function getPageKey(pathname: string): string {
  if (pathname.startsWith("/admin/users")) return "/admin/users"
  if (pathname.startsWith("/admin/sessions")) return "/admin/sessions"
  if (pathname.startsWith("/admin/triage") || pathname.startsWith("/admin/alerts")) {
    return "/admin/triage"
  }
  if (pathname.startsWith("/admin/funnel")) return "/admin/funnel"
  if (pathname.startsWith("/admin/cohorts")) return "/admin/cohorts"
  if (pathname.startsWith("/admin/ai-ops")) return "/admin/ai-ops"
  if (pathname.startsWith("/admin/compliance")) return "/admin/compliance"
  if (pathname.startsWith("/admin/data-quality")) return "/admin/data-quality"
  return "/admin/home"
}

export function AdminFilterBar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pageKey = useMemo(() => getPageKey(pathname), [pathname])

  const supportsQuery =
    pathname.startsWith("/admin/users") ||
    pathname.startsWith("/admin/sessions") ||
    pathname.startsWith("/admin/triage") ||
    pathname.startsWith("/admin/alerts")

  const isTriagePage = pathname.startsWith("/admin/triage") || pathname.startsWith("/admin/alerts")
  const isUsersPage = pathname.startsWith("/admin/users")
  const isSessionsPage = pathname.startsWith("/admin/sessions")

  const appliedFilters = useMemo(
    () => parseAdminFilters(searchParams),
    [searchParams]
  )

  const [draft, setDraft] = useState<AdminFilters>(() => appliedFilters)
  const [fromInput, setFromInput] = useState(() => isoToLocalDateTimeInput(appliedFilters.from))
  const [toInput, setToInput] = useState(() => isoToLocalDateTimeInput(appliedFilters.to))
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [savedViews, setSavedViews] = useState<AdminSavedView[]>([])

  useEffect(() => {
    setDraft(appliedFilters)
    setFromInput(isoToLocalDateTimeInput(appliedFilters.from))
    setToInput(isoToLocalDateTimeInput(appliedFilters.to))
  }, [appliedFilters])

  useEffect(() => {
    if (appliedFilters.preset === "custom") {
      setIsAdvancedOpen(true)
    }
  }, [appliedFilters.preset])

  const loadSavedViews = useCallback(async () => {
    const res = await fetch(`/api/admin/saved-views?pageKey=${encodeURIComponent(pageKey)}`, {
      cache: "no-store",
    })
    if (!res.ok) return
    const json = (await res.json()) as { rows?: AdminSavedView[] }
    setSavedViews(json.rows || [])
  }, [pageKey])

  useEffect(() => {
    void loadSavedViews()
  }, [loadSavedViews])

  const draftComparable = useMemo(() => {
    const next = { ...draft }
    if (next.preset === "custom") {
      const custom = buildCustomRange(fromInput, toInput)
      next.from = custom.from
      next.to = custom.to
    } else {
      const range = buildRangeFromPreset(next.preset)
      next.from = range.from
      next.to = range.to
    }
    if (!supportsQuery) {
      next.q = ""
    }
    return filtersToSearchParams(next).toString()
  }, [draft, fromInput, supportsQuery, toInput])

  const appliedComparable = useMemo(() => {
    const normalized = {
      ...appliedFilters,
      ...(supportsQuery ? {} : { q: "" }),
    }
    return filtersToSearchParams(normalized).toString()
  }, [appliedFilters, supportsQuery])

  const isDirty = draftComparable !== appliedComparable

  const apply = useCallback(() => {
    let next = { ...draft }

    if (next.preset === "custom") {
      const range = buildCustomRange(fromInput, toInput)
      next = {
        ...next,
        from: range.from,
        to: range.to,
      }
    } else {
      const range = buildRangeFromPreset(next.preset)
      next = {
        ...next,
        from: range.from,
        to: range.to,
      }
    }

    if (!supportsQuery) {
      next.q = ""
    }

    const params = filtersToSearchParams(next)
    router.push(`${pathname}?${params.toString()}`)
  }, [draft, fromInput, pathname, router, supportsQuery, toInput])

  const reset = useCallback(() => {
    const defaults = createDefaultAdminFilters()
    setIsAdvancedOpen(false)
    setDraft(defaults)
    setFromInput(isoToLocalDateTimeInput(defaults.from))
    setToInput(isoToLocalDateTimeInput(defaults.to))
    router.push(`${pathname}?${filtersToSearchParams(defaults).toString()}`)
  }, [pathname, router])

  const saveView = useCallback(async () => {
    const name = window.prompt("Saved view name")?.trim()
    if (!name) return

    const params = filtersToSearchParams(draft)
    const payload = {
      pageKey,
      name,
      params: Object.fromEntries(params.entries()),
      isDefault: false,
    }

    const res = await fetch("/api/admin/saved-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      await loadSavedViews()
    }
  }, [draft, loadSavedViews, pageKey])

  const applySavedView = useCallback(
    (savedViewId: string) => {
      const view = savedViews.find((item) => item.id === savedViewId)
      if (!view) return

      const params = new URLSearchParams(view.params)
      const nextFilters = parseAdminFilters(params)
      setDraft(nextFilters)
      setFromInput(isoToLocalDateTimeInput(nextFilters.from))
      setToInput(isoToLocalDateTimeInput(nextFilters.to))
      router.push(`${pathname}?${filtersToSearchParams(nextFilters).toString()}`)
    },
    [pathname, router, savedViews]
  )

  const featureLabel = FEATURE_LABELS[appliedFilters.feature] || appliedFilters.feature || "Unknown"

  return (
    <div className="px-4 py-3 lg:px-6">
      <section className="rounded-lg border bg-card/60 p-3 shadow-xs">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
              <Filter className="size-3.5" />
              <span>Global Filters</span>
              <Badge variant={isDirty ? "secondary" : "outline"}>
                {isDirty ? "Pending changes" : "Synced"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">{PRESET_LABELS[appliedFilters.preset]}</Badge>
              <Badge variant="outline">{MODE_LABELS[appliedFilters.mode]}</Badge>
              <Badge variant="outline">{featureLabel}</Badge>
              <Badge variant="outline">TZ: {appliedFilters.timezone}</Badge>
              {supportsQuery && appliedFilters.q ? (
                <Badge variant="ghost" className="max-w-[22rem] truncate">
                  Query: {appliedFilters.q}
                </Badge>
              ) : null}
            </div>

            <p className="text-xs text-muted-foreground">
              Active range: {fmtDateTime(appliedFilters.from)} - {fmtDateTime(appliedFilters.to)}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 xl:w-auto xl:min-w-[40rem]">
            {supportsQuery ? (
              <Input
                placeholder="search by id, email, title"
                value={draft.q}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, q: event.target.value }))
                }
              />
            ) : null}

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <Select onValueChange={applySavedView} value="__none__">
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Saved view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Saved views</SelectItem>
                  {savedViews.map((view) => (
                    <SelectItem key={view.id} value={view.id}>
                      {view.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button size="sm" variant="outline" onClick={saveView}>
                <Save className="size-3.5" />
                Save view
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAdvancedOpen((prev) => !prev)}
                aria-expanded={isAdvancedOpen}
              >
                Advanced
                {isAdvancedOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </Button>

              <Button size="sm" onClick={apply} disabled={!isDirty}>
                Apply filters
              </Button>
              <Button size="sm" variant="outline" onClick={reset}>
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "grid transition-all",
            isAdvancedOpen
              ? "grid-rows-[1fr] pt-3 opacity-100"
              : "grid-rows-[0fr] pt-0 opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="border-t pt-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <Label className="text-xs">Range</Label>
                  <Select
                    value={draft.preset}
                    onValueChange={(value) =>
                      setDraft((prev) => ({ ...prev, preset: value as AdminFilters["preset"] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24h</SelectItem>
                      <SelectItem value="7d">Last 7d</SelectItem>
                      <SelectItem value="30d">Last 30d</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Timezone</Label>
                  <Select
                    value={draft.timezone}
                    onValueChange={(value) =>
                      setDraft((prev) => ({ ...prev, timezone: value as AdminFilters["timezone"] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Mode</Label>
                  <Select
                    value={draft.mode}
                    onValueChange={(value) =>
                      setDraft((prev) => ({ ...prev, mode: value as AdminFilters["mode"] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="DOCTOR">Doctor</SelectItem>
                      <SelectItem value="AI_DOCTOR">AI Doctor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Feature</Label>
                  <Select
                    value={draft.feature}
                    onValueChange={(value) =>
                      setDraft((prev) => ({ ...prev, feature: value as AdminFilters["feature"] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="insights">Live Insights</SelectItem>
                      <SelectItem value="ddx">Differential Dx</SelectItem>
                      <SelectItem value="record">Consultation Record</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="patientHandout">Patient Handout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {draft.preset === "custom" ? (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-xs">From</Label>
                    <Input
                      type="datetime-local"
                      value={fromInput}
                      onChange={(event) => setFromInput(event.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">To</Label>
                    <Input
                      type="datetime-local"
                      value={toInput}
                      onChange={(event) => setToInput(event.target.value)}
                    />
                  </div>
                </div>
              ) : null}

              {isTriagePage ? (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <div>
                    <Label className="text-xs">Severity</Label>
                    <Select
                      value={draft.severity}
                      onValueChange={(value) =>
                        setDraft((prev) => ({ ...prev, severity: value as AdminFilters["severity"] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All severities</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="positive">Positive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={draft.status}
                      onValueChange={(value) =>
                        setDraft((prev) => ({ ...prev, status: value as AdminFilters["status"] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="NEW">NEW</SelectItem>
                        <SelectItem value="ACK">ACK</SelectItem>
                        <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                        <SelectItem value="RESOLVED">RESOLVED</SelectItem>
                        <SelectItem value="DISMISSED">DISMISSED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Priority</Label>
                    <Select
                      value={draft.priority}
                      onValueChange={(value) =>
                        setDraft((prev) => ({ ...prev, priority: value as AdminFilters["priority"] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All priorities</SelectItem>
                        <SelectItem value="P1">P1</SelectItem>
                        <SelectItem value="P2">P2</SelectItem>
                        <SelectItem value="P3">P3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Rule</Label>
                    <Input
                      value={draft.rule}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, rule: event.target.value }))
                      }
                      placeholder="rule"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Owner</Label>
                    <Input
                      value={draft.owner}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, owner: event.target.value }))
                      }
                      placeholder="owner id"
                    />
                  </div>
                </div>
              ) : null}

              {isUsersPage ? (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <Label className="text-xs">Sort</Label>
                    <Select
                      value={draft.usersSort}
                      onValueChange={(value) =>
                        setDraft((prev) => ({ ...prev, usersSort: value as AdminFilters["usersSort"] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sessions">Sessions</SelectItem>
                        <SelectItem value="completion">Record Finalization</SelectItem>
                        <SelectItem value="ai">AI Calls</SelectItem>
                        <SelectItem value="lastActive">Last Active</SelectItem>
                        <SelectItem value="risk">Risk Score</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Order</Label>
                    <Select
                      value={draft.order}
                      onValueChange={(value) =>
                        setDraft((prev) => ({ ...prev, order: value as AdminFilters["order"] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Desc</SelectItem>
                        <SelectItem value="asc">Asc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Risk Band</Label>
                    <Select
                      value={draft.riskBand}
                      onValueChange={(value) =>
                        setDraft((prev) => ({ ...prev, riskBand: value as AdminFilters["riskBand"] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : null}

              {isSessionsPage ? (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div>
                    <Label className="text-xs">Sort</Label>
                    <Select
                      value={draft.sessionsSort}
                      onValueChange={(value) =>
                        setDraft((prev) => ({ ...prev, sessionsSort: value as AdminFilters["sessionsSort"] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="startedAt">Started At</SelectItem>
                        <SelectItem value="completion">Record Finalization</SelectItem>
                        <SelectItem value="ai">AI Calls</SelectItem>
                        <SelectItem value="risk">Risk Score</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Order</Label>
                    <Select
                      value={draft.order}
                      onValueChange={(value) =>
                        setDraft((prev) => ({ ...prev, order: value as AdminFilters["order"] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Desc</SelectItem>
                        <SelectItem value="asc">Asc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Risk Band</Label>
                    <Select
                      value={draft.riskBand}
                      onValueChange={(value) =>
                        setDraft((prev) => ({ ...prev, riskBand: value as AdminFilters["riskBand"] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Has Red Flag</Label>
                    <Select
                      value={draft.hasRedFlag}
                      onValueChange={(value) =>
                        setDraft((prev) => ({ ...prev, hasRedFlag: value as AdminFilters["hasRedFlag"] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : null}

              <p className="mt-3 text-xs text-muted-foreground">
                All filter changes are staged locally and applied together when you click Apply filters.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
