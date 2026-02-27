"use client"

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminLoadingState } from "@/components/admin/admin-loading-state"
import { parseAdminFilters, toAdminApiParams } from "@/lib/admin/filters"
import { useAdminQuery } from "@/hooks/use-admin-query"
import { useAdminRefreshToken } from "@/components/admin/admin-shell"
import { useSearchParams } from "next/navigation"
import type { AdminOverviewResponse } from "@/types/admin"
import { toPercent } from "@/components/admin/admin-utils"

export function AdminOverview() {
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

  const { data, error, isLoading, isRefreshing } = useAdminQuery<AdminOverviewResponse>({
    cacheKey: `admin:overview:${apiQuery}`,
    url: `/api/admin/overview?${apiQuery}`,
    refreshToken,
  })

  const kpis = data?.kpis
  const isInitialLoading = isLoading && !data

  if (isInitialLoading) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Overview</h2>
          <p className="text-xs text-muted-foreground">
            Platform-level KPIs, conversion funnel, and trend monitoring.
          </p>
        </div>

        <AdminLoadingState label="Loading overview data..." />
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Overview</h2>
        {isRefreshing ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">
          Platform-level KPIs, conversion funnel, and trend monitoring.
        </p>
      </div>

      {error ? (
        <AdminEmptyState title="Failed to load overview" description={error} />
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Distinct Active Users</CardDescription>
            <CardTitle className="text-2xl">
              {String(kpis?.dau ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Users active in selected range.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Sessions</CardDescription>
            <CardTitle className="text-2xl">
              {String(kpis?.activeSessions ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Sessions started during selected range.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Session Completion</CardDescription>
            <CardTitle className="text-2xl">
              {toPercent(kpis?.sessionCompletionRate ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Sessions with completed plan or assessment.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI Calls</CardDescription>
            <CardTitle className="text-2xl">
              {String(kpis?.aiCalls ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            AI-generation calls from audit telemetry.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Document Generation</CardDescription>
            <CardTitle className="text-2xl">
              {toPercent(kpis?.documentGenerationRate ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Record or patient handout generated.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Exports</CardDescription>
            <CardTitle className="text-2xl">
              {String(kpis?.exportCount ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Export links created in selected range.
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Trend</CardTitle>
            <CardDescription>
              Sessions, AI calls, and completion rate by time bucket.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {isInitialLoading ? (
              <AdminEmptyState
                title="Loading trend"
                description="Fetching overview metrics..."
              />
            ) : (data?.trends || []).length === 0 ? (
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
            <CardTitle className="text-base">Funnel</CardTitle>
            <CardDescription>Completion by product stage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.funnel || []).map((step) => (
              <div
                key={step.step}
                className="flex items-center justify-between rounded-md border px-2 py-1 text-xs"
              >
                <span>{step.step}</span>
                <span className="font-medium">
                  {step.count} ({toPercent(step.rate)})
                </span>
              </div>
            ))}
            {!isInitialLoading && !data?.funnel.length ? (
              <AdminEmptyState title="No funnel data" description="No sessions in selected range." />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
