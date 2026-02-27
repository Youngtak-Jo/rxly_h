"use client"

import { useMemo } from "react"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { parseAdminFilters, toAdminApiParams } from "@/lib/admin/filters"
import { useAdminQuery } from "@/hooks/use-admin-query"
import { useAdminRefreshToken } from "@/components/admin/admin-shell"
import type { AdminAiOpsResponse } from "@/types/admin"
import { toPercent } from "@/components/admin/admin-utils"

export function AdminAiOps() {
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseAdminFilters(searchParams), [searchParams])
  const refreshToken = useAdminRefreshToken()

  const apiQuery = useMemo(
    () => toAdminApiParams({ ...filters, q: "" }).toString(),
    [filters]
  )

  const { data, error, isLoading, isRefreshing } = useAdminQuery<AdminAiOpsResponse>({
    cacheKey: `admin:ai-ops:${apiQuery}`,
    url: `/api/admin/ai-ops?${apiQuery}`,
    refreshToken,
  })

  if (isLoading && !data) {
    return <AdminLoadingState label="Loading AI Ops..." />
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">AI Ops</h2>
        {isRefreshing ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      </div>

      {error ? <AdminEmptyState title="Failed to load AI Ops" description={error} /> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature/Model Quality</CardTitle>
          <CardDescription>Failure, latency, and cost by feature and model.</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.rows.length ? (
            <AdminEmptyState title="No AI usage" description="No AI usage events in selected range." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Calls</TableHead>
                  <TableHead>Failure Rate</TableHead>
                  <TableHead>P50/P95</TableHead>
                  <TableHead>Cost (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => (
                  <TableRow key={`${row.feature}:${row.model}`}>
                    <TableCell>{row.feature}</TableCell>
                    <TableCell>{row.model}</TableCell>
                    <TableCell>{row.calls}</TableCell>
                    <TableCell>{toPercent(row.failureRate)}</TableCell>
                    <TableCell>{Math.round(row.p50LatencyMs)}ms / {Math.round(row.p95LatencyMs)}ms</TableCell>
                    <TableCell>${row.costUsd.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
