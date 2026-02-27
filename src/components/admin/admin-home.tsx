"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Loader2 } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminLoadingState } from "@/components/admin/admin-loading-state"
import { parseAdminFilters, toAdminApiParams, filtersToSearchParams } from "@/lib/admin/filters"
import { useAdminQuery } from "@/hooks/use-admin-query"
import { useAdminRefreshToken } from "@/components/admin/admin-shell"
import type { AdminHomeResponse } from "@/types/admin"
import { toPercent, fmtDateTime, severityBadgeVariant } from "@/components/admin/admin-utils"

function fmtNumber(value: number): string {
  return value.toLocaleString("en-US")
}

export function AdminHome() {
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseAdminFilters(searchParams), [searchParams])
  const refreshToken = useAdminRefreshToken()

  const apiParams = useMemo(
    () =>
      toAdminApiParams({
        ...filters,
        q: "",
      }),
    [filters]
  )
  const apiQuery = apiParams.toString()
  const filterQuery = useMemo(
    () => filtersToSearchParams(filters).toString(),
    [filters]
  )

  const { data, error, isLoading, isRefreshing } = useAdminQuery<AdminHomeResponse>({
    cacheKey: `admin:home:${apiQuery}`,
    url: `/api/admin/home?${apiQuery}`,
    refreshToken,
  })

  const kpis = data?.kpis
  const isInitialLoading = isLoading && !data

  if (isInitialLoading) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Home</h2>
          <p className="text-xs text-muted-foreground">
            Risk and quality operations snapshot.
          </p>
        </div>

        <AdminLoadingState label="Loading home data..." />
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Home</h2>
        {isRefreshing ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">
          Operational risk dashboard with immediate incident queue.
        </p>
      </div>

      {error ? (
        <AdminEmptyState title="Failed to load home" description={error} />
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Distinct Active Users</CardDescription>
            <CardTitle className="text-2xl">{fmtNumber(kpis?.dau ?? 0)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Sessions</CardDescription>
            <CardTitle className="text-2xl">{fmtNumber(kpis?.activeSessions ?? 0)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Session Completion</CardDescription>
            <CardTitle className="text-2xl">{toPercent(kpis?.sessionCompletionRate ?? 0)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Incidents</CardDescription>
            <CardTitle className="text-2xl">{fmtNumber(kpis?.unresolvedIncidents ?? 0)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI Failure Rate</CardDescription>
            <CardTitle className="text-2xl">{toPercent(kpis?.aiFailureRate ?? 0)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI Cost (USD)</CardDescription>
            <CardTitle className="text-2xl">${(kpis?.aiCostUsd ?? 0).toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI Latency P50 / P95</CardDescription>
            <CardTitle className="text-base">
              {Math.round(kpis?.aiP50LatencyMs ?? 0)}ms / {Math.round(kpis?.aiP95LatencyMs ?? 0)}ms
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Exports</CardDescription>
            <CardTitle className="text-2xl">{fmtNumber(kpis?.exportCount ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Trend</CardTitle>
            <CardDescription>
              Sessions, AI calls, and completion by time bucket.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {!data?.trends.length ? (
              <AdminEmptyState title="No trend data" description="No sessions in selected range." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `${Math.round(value * 100)}%`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="sessions"
                    stroke="#1d4ed8"
                    fill="#93c5fd"
                    fillOpacity={0.3}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="aiCalls"
                    stroke="#0f766e"
                    fill="#5eead4"
                    fillOpacity={0.25}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="completionRate"
                    stroke="#7c3aed"
                    fill="#c4b5fd"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Urgent Queue</CardTitle>
            <CardDescription>Incident-first triage list.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!data?.urgentIncidents.length ? (
              <AdminEmptyState title="No urgent incidents" description="Queue is clear for this range." />
            ) : (
              data.urgentIncidents.map((incident) => (
                <div key={incident.id} className="rounded-md border p-2 text-xs">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant={severityBadgeVariant(incident.severity)}>
                      {incident.severity}
                    </Badge>
                    <Badge variant="outline">{incident.priority}</Badge>
                    <Badge variant="outline">{incident.status}</Badge>
                  </div>
                  <div className="font-medium">{incident.title}</div>
                  <div className="text-muted-foreground">{incident.rule}</div>
                  <div className="text-muted-foreground">Seen {fmtDateTime(incident.lastSeenAt)}</div>
                  <div className="mt-2 flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/triage?${filterQuery}`}>Open triage</Link>
                    </Button>
                    {incident.sessionId ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/sessions/${incident.sessionId}?${filterQuery}`}>Session</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
