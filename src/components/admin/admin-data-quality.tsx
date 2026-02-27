"use client"

import { useMemo } from "react"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminLoadingState } from "@/components/admin/admin-loading-state"
import { parseAdminFilters, toAdminApiParams } from "@/lib/admin/filters"
import { useAdminQuery } from "@/hooks/use-admin-query"
import { useAdminRefreshToken } from "@/components/admin/admin-shell"
import type { AdminDataQualityResponse } from "@/types/admin"
import { toPercent } from "@/components/admin/admin-utils"

export function AdminDataQuality() {
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseAdminFilters(searchParams), [searchParams])
  const refreshToken = useAdminRefreshToken()

  const apiQuery = useMemo(
    () => toAdminApiParams({ ...filters, q: "" }).toString(),
    [filters]
  )

  const { data, error, isLoading, isRefreshing } = useAdminQuery<AdminDataQualityResponse>({
    cacheKey: `admin:data-quality:${apiQuery}`,
    url: `/api/admin/data-quality?${apiQuery}`,
    refreshToken,
  })

  if (isLoading && !data) {
    return <AdminLoadingState label="Loading data quality..." />
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Data Quality</h2>
        {isRefreshing ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      </div>

      {error ? <AdminEmptyState title="Failed to load data quality" description={error} /> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transcript Quality</CardTitle>
            <CardDescription>Confidence and UNKNOWN speaker ratio baseline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Sessions: <span className="font-medium">{data?.transcriptQuality.sessionCount ?? 0}</span></div>
            <div>Avg confidence: <span className="font-medium">{toPercent(data?.transcriptQuality.avgConfidence ?? 0)}</span></div>
            <div>Avg UNKNOWN ratio: <span className="font-medium">{toPercent(data?.transcriptQuality.avgUnknownRatio ?? 0)}</span></div>
            <div>Low-quality sessions: <span className="font-medium">{data?.transcriptQuality.lowQualitySessions ?? 0}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Telemetry Integrity</CardTitle>
            <CardDescription>Missing or inconsistent event traces.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              Transcript with no AI calls: <span className="font-medium">{data?.telemetryIntegrity.sessionsWithTranscriptNoAiCall ?? 0}</span>
            </div>
            <div>
              AI calls with no client events: <span className="font-medium">{data?.telemetryIntegrity.sessionsWithAiCallNoClientEvents ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
