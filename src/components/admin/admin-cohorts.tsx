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
import type { AdminCohortsResponse } from "@/types/admin"
import { toPercent } from "@/components/admin/admin-utils"

export function AdminCohorts() {
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseAdminFilters(searchParams), [searchParams])
  const refreshToken = useAdminRefreshToken()

  const apiQuery = useMemo(
    () => toAdminApiParams({ ...filters, q: "" }).toString(),
    [filters]
  )

  const { data, error, isLoading, isRefreshing } = useAdminQuery<AdminCohortsResponse>({
    cacheKey: `admin:cohorts:${apiQuery}`,
    url: `/api/admin/cohorts?${apiQuery}`,
    refreshToken,
  })

  if (isLoading && !data) {
    return <AdminLoadingState label="Loading cohorts..." />
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Cohorts</h2>
        {isRefreshing ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      </div>

      {error ? <AdminEmptyState title="Failed to load cohorts" description={error} /> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Retention Matrix</CardTitle>
          <CardDescription>First-session cohorts with D1 / D7 / D30 retention.</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.cohorts.length ? (
            <AdminEmptyState title="No cohorts" description="No first-session cohorts found in range." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cohort Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>D1</TableHead>
                  <TableHead>D7</TableHead>
                  <TableHead>D30</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cohorts.map((cohort) => (
                  <TableRow key={cohort.cohortDate}>
                    <TableCell>{cohort.cohortDate}</TableCell>
                    <TableCell>{cohort.cohortSize}</TableCell>
                    <TableCell>{toPercent(cohort.d1)}</TableCell>
                    <TableCell>{toPercent(cohort.d7)}</TableCell>
                    <TableCell>{toPercent(cohort.d30)}</TableCell>
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
