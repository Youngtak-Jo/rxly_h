"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
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
import {
  getAdminFeatureLabel,
  getAdminModeLabel,
  getAdminPriorityLabel,
  getAdminRiskBandLabel,
  getAdminSeverityLabel,
  getAdminStatusLabel,
  getAdminTimezoneLabel,
} from "@/lib/admin/localization"
import { fmtDateTime } from "@/components/admin/admin-utils"
import { cn } from "@/lib/utils"
import type { AdminFilters, AdminSavedView } from "@/types/admin"

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
  const t = useTranslations("AdminFilterBar")
  const tCommon = useTranslations("AdminCommon")
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
    const name = window.prompt(t("prompts.savedViewName"))?.trim()
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
  }, [draft, loadSavedViews, pageKey, t])

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

  const presetLabel = useCallback(
    (preset: AdminFilters["preset"]) => t(`preset.${preset}`),
    [t]
  )
  const featureLabel =
    appliedFilters.feature
      ? getAdminFeatureLabel(tCommon, appliedFilters.feature)
      : t("unknown")

  return (
    <div className="px-4 py-3 lg:px-6">
      <section className="rounded-lg border bg-card/60 p-3 shadow-xs">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
              <Filter className="size-3.5" />
              <span>{t("globalFilters")}</span>
              <Badge variant={isDirty ? "secondary" : "outline"}>
                {isDirty ? t("pendingChanges") : t("synced")}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">{presetLabel(appliedFilters.preset)}</Badge>
              <Badge variant="outline">{getAdminModeLabel(tCommon, appliedFilters.mode)}</Badge>
              <Badge variant="outline">{featureLabel}</Badge>
              <Badge variant="outline">
                {t("timezoneBadge", {
                  timezone: getAdminTimezoneLabel(tCommon, appliedFilters.timezone),
                })}
              </Badge>
              {supportsQuery && appliedFilters.q ? (
                <Badge variant="ghost" className="max-w-[22rem] truncate">
                  {t("query", { query: appliedFilters.q })}
                </Badge>
              ) : null}
            </div>

            <p className="text-xs text-muted-foreground">
              {t("activeRange", {
                from: fmtDateTime(appliedFilters.from),
                to: fmtDateTime(appliedFilters.to),
              })}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 xl:w-auto xl:min-w-[40rem]">
            {supportsQuery ? (
              <Input
                placeholder={t("placeholders.search")}
                value={draft.q}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, q: event.target.value }))
                }
              />
            ) : null}

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <Select onValueChange={applySavedView} value="__none__">
                <SelectTrigger className="w-44">
                  <SelectValue placeholder={t("savedView")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t("savedViews")}</SelectItem>
                  {savedViews.map((view) => (
                    <SelectItem key={view.id} value={view.id}>
                      {view.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button size="sm" variant="outline" onClick={saveView}>
                <Save className="size-3.5" />
                {t("saveView")}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAdvancedOpen((prev) => !prev)}
                aria-expanded={isAdvancedOpen}
              >
                {t("advanced")}
                {isAdvancedOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </Button>

              <Button size="sm" onClick={apply} disabled={!isDirty}>
                {t("applyFilters")}
              </Button>
              <Button size="sm" variant="outline" onClick={reset}>
                {t("reset")}
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
                  <Label className="text-xs">{t("labels.preset")}</Label>
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
                      <SelectItem value="24h">{t("preset.24h")}</SelectItem>
                      <SelectItem value="7d">{t("preset.7d")}</SelectItem>
                      <SelectItem value="30d">{t("preset.30d")}</SelectItem>
                      <SelectItem value="custom">{t("preset.custom")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">{t("labels.timezone")}</Label>
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
                      <SelectItem value="local">
                        {getAdminTimezoneLabel(tCommon, "local")}
                      </SelectItem>
                      <SelectItem value="UTC">
                        {getAdminTimezoneLabel(tCommon, "UTC")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">{t("labels.mode")}</Label>
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
                      <SelectItem value="ALL">
                        {getAdminModeLabel(tCommon, "ALL")}
                      </SelectItem>
                      <SelectItem value="DOCTOR">
                        {getAdminModeLabel(tCommon, "DOCTOR")}
                      </SelectItem>
                      <SelectItem value="AI_DOCTOR">
                        {getAdminModeLabel(tCommon, "AI_DOCTOR")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">{t("labels.feature")}</Label>
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
                      <SelectItem value="all">
                        {getAdminFeatureLabel(tCommon, "all")}
                      </SelectItem>
                      <SelectItem value="insights">
                        {getAdminFeatureLabel(tCommon, "insights")}
                      </SelectItem>
                      <SelectItem value="ddx">
                        {getAdminFeatureLabel(tCommon, "ddx")}
                      </SelectItem>
                      <SelectItem value="record">
                        {getAdminFeatureLabel(tCommon, "record")}
                      </SelectItem>
                      <SelectItem value="research">
                        {getAdminFeatureLabel(tCommon, "research")}
                      </SelectItem>
                      <SelectItem value="patientHandout">
                        {getAdminFeatureLabel(tCommon, "patientHandout")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {draft.preset === "custom" ? (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-xs">{t("labels.from")}</Label>
                    <Input
                      type="datetime-local"
                      value={fromInput}
                      onChange={(event) => setFromInput(event.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">{t("labels.to")}</Label>
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
                    <Label className="text-xs">{t("labels.severity")}</Label>
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
                        <SelectItem value="all">
                          {getAdminSeverityLabel(tCommon, "all")}
                        </SelectItem>
                        <SelectItem value="high">
                          {getAdminSeverityLabel(tCommon, "high")}
                        </SelectItem>
                        <SelectItem value="medium">
                          {getAdminSeverityLabel(tCommon, "medium")}
                        </SelectItem>
                        <SelectItem value="low">
                          {getAdminSeverityLabel(tCommon, "low")}
                        </SelectItem>
                        <SelectItem value="positive">
                          {getAdminSeverityLabel(tCommon, "positive")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">{t("labels.status")}</Label>
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
                        <SelectItem value="all">
                          {getAdminStatusLabel(tCommon, "all")}
                        </SelectItem>
                        <SelectItem value="NEW">
                          {getAdminStatusLabel(tCommon, "NEW")}
                        </SelectItem>
                        <SelectItem value="ACK">
                          {getAdminStatusLabel(tCommon, "ACK")}
                        </SelectItem>
                        <SelectItem value="IN_PROGRESS">
                          {getAdminStatusLabel(tCommon, "IN_PROGRESS")}
                        </SelectItem>
                        <SelectItem value="RESOLVED">
                          {getAdminStatusLabel(tCommon, "RESOLVED")}
                        </SelectItem>
                        <SelectItem value="DISMISSED">
                          {getAdminStatusLabel(tCommon, "DISMISSED")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">{t("labels.priority")}</Label>
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
                        <SelectItem value="all">
                          {getAdminPriorityLabel(tCommon, "all")}
                        </SelectItem>
                        <SelectItem value="P1">
                          {getAdminPriorityLabel(tCommon, "P1")}
                        </SelectItem>
                        <SelectItem value="P2">
                          {getAdminPriorityLabel(tCommon, "P2")}
                        </SelectItem>
                        <SelectItem value="P3">
                          {getAdminPriorityLabel(tCommon, "P3")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">{t("labels.rule")}</Label>
                    <Input
                      value={draft.rule}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, rule: event.target.value }))
                      }
                      placeholder={t("placeholders.rule")}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">{t("labels.owner")}</Label>
                    <Input
                      value={draft.owner}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, owner: event.target.value }))
                      }
                      placeholder={t("placeholders.ownerId")}
                    />
                  </div>
                </div>
              ) : null}

              {isUsersPage ? (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <Label className="text-xs">{t("labels.usersSort")}</Label>
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
                        <SelectItem value="sessions">{t("usersSort.sessions")}</SelectItem>
                        <SelectItem value="completion">{t("usersSort.completion")}</SelectItem>
                        <SelectItem value="ai">{t("usersSort.ai")}</SelectItem>
                        <SelectItem value="lastActive">{t("usersSort.lastActive")}</SelectItem>
                        <SelectItem value="risk">{t("usersSort.risk")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                    <Label className="text-xs">{t("labels.order")}</Label>
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
                        <SelectItem value="desc">{t("order.desc")}</SelectItem>
                        <SelectItem value="asc">{t("order.asc")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                    <Label className="text-xs">{t("labels.riskBand")}</Label>
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
                        <SelectItem value="all">
                          {getAdminRiskBandLabel(tCommon, "all")}
                        </SelectItem>
                        <SelectItem value="critical">
                          {getAdminRiskBandLabel(tCommon, "critical")}
                        </SelectItem>
                        <SelectItem value="high">
                          {getAdminRiskBandLabel(tCommon, "high")}
                        </SelectItem>
                        <SelectItem value="medium">
                          {getAdminRiskBandLabel(tCommon, "medium")}
                        </SelectItem>
                        <SelectItem value="low">
                          {getAdminRiskBandLabel(tCommon, "low")}
                        </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              ) : null}

              {isSessionsPage ? (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div>
                    <Label className="text-xs">{t("labels.sessionsSort")}</Label>
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
                        <SelectItem value="startedAt">{t("sessionsSort.startedAt")}</SelectItem>
                        <SelectItem value="completion">{t("sessionsSort.completion")}</SelectItem>
                        <SelectItem value="ai">{t("sessionsSort.ai")}</SelectItem>
                        <SelectItem value="risk">{t("sessionsSort.risk")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                    <Label className="text-xs">{t("labels.order")}</Label>
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
                        <SelectItem value="desc">{t("order.desc")}</SelectItem>
                        <SelectItem value="asc">{t("order.asc")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                    <Label className="text-xs">{t("labels.riskBand")}</Label>
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
                        <SelectItem value="all">
                          {getAdminRiskBandLabel(tCommon, "all")}
                        </SelectItem>
                        <SelectItem value="critical">
                          {getAdminRiskBandLabel(tCommon, "critical")}
                        </SelectItem>
                        <SelectItem value="high">
                          {getAdminRiskBandLabel(tCommon, "high")}
                        </SelectItem>
                        <SelectItem value="medium">
                          {getAdminRiskBandLabel(tCommon, "medium")}
                        </SelectItem>
                        <SelectItem value="low">
                          {getAdminRiskBandLabel(tCommon, "low")}
                        </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                    <Label className="text-xs">{t("labels.hasRedFlag")}</Label>
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
                        <SelectItem value="all">{t("hasRedFlag.all")}</SelectItem>
                        <SelectItem value="yes">{t("hasRedFlag.yes")}</SelectItem>
                        <SelectItem value="no">{t("hasRedFlag.no")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              ) : null}

              <p className="mt-3 text-xs text-muted-foreground">
                {t("helpText")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
