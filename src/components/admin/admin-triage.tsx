"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminLoadingState } from "@/components/admin/admin-loading-state"
import { severityBadgeVariant, fmtDateTime } from "@/components/admin/admin-utils"
import { useAdminRefreshToken } from "@/components/admin/admin-shell"
import {
  adminFetchJson,
  invalidateAdminCache,
  useAdminQuery,
} from "@/hooks/use-admin-query"
import {
  filtersToSearchParams,
  parseAdminFilters,
  toAdminApiParams,
} from "@/lib/admin/filters"
import {
  getAdminAlertCopy,
  getAdminPriorityLabel,
  getAdminSeverityLabel,
  getAdminStatusLabel,
} from "@/lib/admin/localization"
import type {
  AdminIncidentRow,
  AdminIncidentsResponse,
  AdminInsightsResponse,
} from "@/types/admin"

function matchesLiveAlertFilters(
  alert: AdminInsightsResponse["alerts"][number],
  filters: ReturnType<typeof parseAdminFilters>
): boolean {
  if (filters.severity !== "all" && alert.severity !== filters.severity) {
    return false
  }

  if (filters.rule) {
    const needle = filters.rule.toLowerCase()
    if (!alert.rule.toLowerCase().includes(needle)) {
      return false
    }
  }

  if (filters.q) {
    const needle = filters.q.toLowerCase()
    const haystacks = [
      alert.rule,
      alert.title,
      alert.description,
      alert.userId || "",
      alert.sessionId || "",
    ]

    if (!haystacks.some((value) => value.toLowerCase().includes(needle))) {
      return false
    }
  }

  return true
}

export function AdminTriage() {
  const t = useTranslations("AdminTriage")
  const tCommon = useTranslations("AdminCommon")
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseAdminFilters(searchParams), [searchParams])
  const refreshToken = useAdminRefreshToken()

  const [rows, setRows] = useState<AdminIncidentRow[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [ownerDraft, setOwnerDraft] = useState<Record<string, string>>({})

  const baseParams = useMemo(
    () => toAdminApiParams(filters, { limit: "50" }),
    [filters]
  )
  const baseQuery = baseParams.toString()
  const filterQuery = useMemo(
    () => filtersToSearchParams(filters).toString(),
    [filters]
  )

  const {
    data,
    error,
    isLoading,
    isRefreshing,
    reload,
  } = useAdminQuery<AdminIncidentsResponse>({
    cacheKey: `admin:triage:${baseQuery}`,
    url: `/api/admin/alerts/incidents?${baseQuery}`,
    refreshToken,
  })
  const {
    data: liveData,
    error: liveError,
    isLoading: isLiveLoading,
    isRefreshing: isLiveRefreshing,
    reload: reloadLive,
  } = useAdminQuery<AdminInsightsResponse>({
    cacheKey: `admin:triage:live:${baseQuery}`,
    url: `/api/admin/insights?${baseQuery}`,
    refreshToken,
  })

  useEffect(() => {
    if (!data) return
    setRows(data.rows)
    setNextCursor(data.nextCursor)
    const initialOwnerDraft: Record<string, string> = {}
    for (const row of data.rows) {
      initialOwnerDraft[row.id] = row.ownerId || ""
    }
    setOwnerDraft(initialOwnerDraft)
  }, [data])

  const filteredLiveAlerts = useMemo(
    () => (liveData?.alerts || []).filter((alert) => matchesLiveAlertFilters(alert, filters)),
    [filters, liveData?.alerts]
  )

  const isInitialLoading = isLoading && !data && rows.length === 0
  const isInitialLiveLoading = isLiveLoading && !liveData

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return

    setIsLoadingMore(true)
    try {
      const params = new URLSearchParams(baseQuery)
      params.set("cursor", nextCursor)
      const query = params.toString()
      const response = await adminFetchJson<AdminIncidentsResponse>({
        cacheKey: `admin:triage:${query}`,
        url: `/api/admin/alerts/incidents?${query}`,
        force: true,
      })

      setRows((prev) => [...prev, ...response.rows])
      setNextCursor(response.nextCursor)
      setOwnerDraft((prev) => {
        const next = { ...prev }
        for (const row of response.rows) {
          if (!(row.id in next)) {
            next[row.id] = row.ownerId || ""
          }
        }
        return next
      })
    } finally {
      setIsLoadingMore(false)
    }
  }, [baseQuery, isLoadingMore, nextCursor])

  const syncIncidents = useCallback(async () => {
    setIsSyncing(true)
    try {
      await fetch(`/api/admin/alerts/incidents/sync?${baseQuery}`, {
        method: "POST",
      })
      invalidateAdminCache("admin:home:")
      invalidateAdminCache("admin:triage:")
      await Promise.all([reload(), reloadLive()])
    } finally {
      setIsSyncing(false)
    }
  }, [baseQuery, reload, reloadLive])

  const patchIncident = useCallback(
    async (incidentId: string, payload: Record<string, unknown>) => {
      const res = await fetch(`/api/admin/alerts/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) return
      const updated = (await res.json()) as AdminIncidentRow
      invalidateAdminCache("admin:home:")
      setRows((prev) => prev.map((row) => (row.id === incidentId ? updated : row)))
    },
    []
  )

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{t("title")}</h2>
            {isRefreshing || isLiveRefreshing ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{t("description")}</p>
          <p className="text-xs text-muted-foreground">
            {t("summary", {
              liveCount: liveData?.alerts.length ?? 0,
              openCount: data?.openCount ?? 0,
            })}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => void syncIncidents()}
          disabled={isSyncing || filteredLiveAlerts.length === 0}
        >
          {isSyncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          {isSyncing ? t("promoting") : t("promote")}
        </Button>
      </div>

      <Tabs defaultValue="live" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live">{t("liveAlertsTitle")}</TabsTrigger>
          <TabsTrigger value="incidents">{t("incidentsTitle")}</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          {liveError ? <AdminEmptyState title={t("failedLiveAlerts")} description={liveError} /> : null}
          {isInitialLiveLoading ? <AdminLoadingState label={t("loadingLiveAlerts")} /> : null}

          {!isInitialLiveLoading ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("liveRuleHitsTitle")}</CardTitle>
                <CardDescription>
                  {t("liveRuleHitsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {!filteredLiveAlerts.length ? (
                  <AdminEmptyState
                    title={t("noLiveAlertsTitle")}
                    description={t("noLiveAlertsDescription")}
                  />
                ) : (
                  filteredLiveAlerts.map((alert) => {
                    const copy = getAdminAlertCopy(tCommon, alert)

                    return (
                      <div key={alert.id} className="rounded-md border p-3 text-xs">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge variant={severityBadgeVariant(alert.severity)}>
                            {getAdminSeverityLabel(tCommon, alert.severity)}
                          </Badge>
                          <span className="font-medium">{copy.label}</span>
                        </div>
                        <div className="font-medium">{copy.title}</div>
                        <div className="text-muted-foreground">{copy.description}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {alert.userId ? (
                            <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                              <Link href={`/admin/users/${alert.userId}?${filterQuery}`}>
                                {t("user")}
                              </Link>
                            </Button>
                          ) : null}
                          {alert.sessionId ? (
                            <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                              <Link href={`/admin/sessions/${alert.sessionId}?${filterQuery}`}>
                                {t("session")}
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          {error ? <AdminEmptyState title={t("failedIncidents")} description={error} /> : null}
          {isInitialLoading ? <AdminLoadingState label={t("loadingIncidents")} /> : null}

          {!isInitialLoading ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("incidentQueueTitle")}</CardTitle>
                <CardDescription>
                  {t("incidentQueueDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!rows.length ? (
                  <AdminEmptyState
                    title={t("noIncidentsTitle")}
                    description={t("noIncidentsDescription")}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("columns.rule")}</TableHead>
                          <TableHead>{t("columns.severity")}</TableHead>
                          <TableHead>{t("columns.priority")}</TableHead>
                          <TableHead>{t("columns.status")}</TableHead>
                          <TableHead>{t("columns.owner")}</TableHead>
                          <TableHead>{t("columns.lastSeen")}</TableHead>
                          <TableHead>{t("columns.count")}</TableHead>
                          <TableHead>{t("columns.actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((incident) => {
                          const copy = getAdminAlertCopy(tCommon, incident)

                          return (
                            <TableRow key={incident.id}>
                              <TableCell>
                                <div className="text-xs font-medium">{copy.label}</div>
                                <div className="text-xs text-muted-foreground">{copy.title}</div>
                                {incident.sessionId ? (
                                  <div className="text-xs text-muted-foreground">
                                    {t("sessionId", { id: incident.sessionId.slice(0, 8) })}
                                  </div>
                                ) : null}
                                {incident.userId ? (
                                  <div className="text-xs text-muted-foreground">
                                    {t("userId", { id: incident.userId })}
                                  </div>
                                ) : null}
                              </TableCell>
                              <TableCell>
                                <Badge variant={severityBadgeVariant(incident.severity)}>
                                  {getAdminSeverityLabel(tCommon, incident.severity)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={incident.priority}
                                  onValueChange={(value) => {
                                    void patchIncident(incident.id, { priority: value })
                                  }}
                                >
                                  <SelectTrigger className="h-8 w-20 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="P1">{getAdminPriorityLabel(tCommon, "P1")}</SelectItem>
                                    <SelectItem value="P2">{getAdminPriorityLabel(tCommon, "P2")}</SelectItem>
                                    <SelectItem value="P3">{getAdminPriorityLabel(tCommon, "P3")}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={incident.status}
                                  onValueChange={(value) => {
                                    void patchIncident(incident.id, {
                                      status: value,
                                    })
                                  }}
                                >
                                  <SelectTrigger className="h-8 w-32 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="NEW">{getAdminStatusLabel(tCommon, "NEW")}</SelectItem>
                                    <SelectItem value="ACK">{getAdminStatusLabel(tCommon, "ACK")}</SelectItem>
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
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Input
                                    value={ownerDraft[incident.id] ?? ""}
                                    onChange={(event) =>
                                      setOwnerDraft((prev) => ({
                                        ...prev,
                                        [incident.id]: event.target.value,
                                      }))
                                    }
                                    className="h-8 min-w-[10rem] text-xs"
                                    placeholder={t("ownerPlaceholder")}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-xs"
                                    onClick={() =>
                                      void patchIncident(incident.id, {
                                        ownerId: (ownerDraft[incident.id] || "").trim() || null,
                                      })
                                    }
                                  >
                                    {t("save")}
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {fmtDateTime(incident.lastSeenAt)}
                              </TableCell>
                              <TableCell>{incident.occurrenceCount}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {incident.userId ? (
                                    <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                                      <Link href={`/admin/users/${incident.userId}?${filterQuery}`}>
                                        {t("user")}
                                      </Link>
                                    </Button>
                                  ) : null}
                                  {incident.sessionId ? (
                                    <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                                      <Link href={`/admin/sessions/${incident.sessionId}?${filterQuery}`}>
                                        {t("session")}
                                      </Link>
                                    </Button>
                                  ) : null}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  {nextCursor ? (
                    <Button variant="outline" onClick={() => void loadMore()} disabled={isLoadingMore}>
                      {isLoadingMore ? <Loader2 className="size-4 animate-spin" /> : null}
                      {isLoadingMore ? t("loadingMore") : t("loadMore")}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>
    </section>
  )
}
