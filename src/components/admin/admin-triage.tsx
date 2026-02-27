"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { useSearchParams } from "next/navigation"
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
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminLoadingState } from "@/components/admin/admin-loading-state"
import { severityBadgeVariant, fmtDateTime } from "@/components/admin/admin-utils"
import { useAdminRefreshToken } from "@/components/admin/admin-shell"
import { adminFetchJson, useAdminQuery } from "@/hooks/use-admin-query"
import {
  filtersToSearchParams,
  parseAdminFilters,
  toAdminApiParams,
} from "@/lib/admin/filters"
import type { AdminIncidentRow, AdminIncidentsResponse } from "@/types/admin"

export function AdminTriage() {
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

  const { data, error, isLoading, isRefreshing, reload } = useAdminQuery<AdminIncidentsResponse>({
    cacheKey: `admin:triage:${baseQuery}`,
    url: `/api/admin/alerts/incidents?${baseQuery}`,
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

  const isInitialLoading = isLoading && !data && rows.length === 0

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
      await reload()
    } finally {
      setIsSyncing(false)
    }
  }, [baseQuery, reload])

  const patchIncident = useCallback(
    async (incidentId: string, payload: Record<string, unknown>) => {
      const res = await fetch(`/api/admin/alerts/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) return
      const updated = (await res.json()) as AdminIncidentRow
      setRows((prev) => prev.map((row) => (row.id === incidentId ? updated : row)))
    },
    []
  )

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Triage</h2>
            {isRefreshing ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Persistent incident queue for investigation, ownership, and resolution tracking.
          </p>
          <p className="text-xs text-muted-foreground">
            Open incidents: {data?.openCount ?? 0} / Total: {data?.totalCount ?? rows.length}
          </p>
        </div>

        <Button variant="outline" onClick={() => void syncIncidents()} disabled={isSyncing}>
          {isSyncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          {isSyncing ? "Syncing..." : "Sync incidents"}
        </Button>
      </div>

      {error ? <AdminEmptyState title="Failed to load triage" description={error} /> : null}

      {isInitialLoading ? <AdminLoadingState label="Loading incidents..." /> : null}

      {!isInitialLoading ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incident Queue</CardTitle>
            <CardDescription>Track status, ownership, and resolution for each alert fingerprint.</CardDescription>
          </CardHeader>
          <CardContent>
            {!rows.length ? (
              <AdminEmptyState title="No incidents" description="No incidents matched current filters." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell>
                          <div className="text-xs font-medium">{incident.rule}</div>
                          <div className="text-xs text-muted-foreground">{incident.title}</div>
                          {incident.sessionId ? (
                            <div className="text-xs text-muted-foreground">Session: {incident.sessionId.slice(0, 8)}</div>
                          ) : null}
                          {incident.userId ? (
                            <div className="text-xs text-muted-foreground">User: {incident.userId}</div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant={severityBadgeVariant(incident.severity)}>{incident.severity}</Badge>
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
                              <SelectItem value="P1">P1</SelectItem>
                              <SelectItem value="P2">P2</SelectItem>
                              <SelectItem value="P3">P3</SelectItem>
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
                              <SelectItem value="NEW">NEW</SelectItem>
                              <SelectItem value="ACK">ACK</SelectItem>
                              <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                              <SelectItem value="RESOLVED">RESOLVED</SelectItem>
                              <SelectItem value="DISMISSED">DISMISSED</SelectItem>
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
                              placeholder="owner id"
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
                              Save
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
                                <Link href={`/admin/users/${incident.userId}?${filterQuery}`}>User</Link>
                              </Button>
                            ) : null}
                            {incident.sessionId ? (
                              <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                                <Link href={`/admin/sessions/${incident.sessionId}?${filterQuery}`}>Session</Link>
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              {nextCursor ? (
                <Button variant="outline" onClick={() => void loadMore()} disabled={isLoadingMore}>
                  {isLoadingMore ? <Loader2 className="size-4 animate-spin" /> : null}
                  {isLoadingMore ? "Loading..." : "Load More Incidents"}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}
