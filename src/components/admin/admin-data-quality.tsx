"use client"

import { useMemo } from "react"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminLoadingState } from "@/components/admin/admin-loading-state"
import { parseAdminFilters, toAdminApiParams } from "@/lib/admin/filters"
import { useAdminQuery } from "@/hooks/use-admin-query"
import { useAdminRefreshToken } from "@/components/admin/admin-shell"
import type { AdminDataQualityResponse } from "@/types/admin"
import { toPercent } from "@/components/admin/admin-utils"

export function AdminDataQuality() {
  const t = useTranslations("AdminDataQuality")
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
    return <AdminLoadingState label={t("loading")} />
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        {isRefreshing ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      </div>

      {error ? <AdminEmptyState title={t("failed")} description={error} /> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("transcriptTitle")}</CardTitle>
            <CardDescription>{t("transcriptDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>{t("metrics.sessions")}: <span className="font-medium">{data?.transcriptQuality.sessionCount ?? 0}</span></div>
            <div>{t("metrics.avgConfidence")}: <span className="font-medium">{toPercent(data?.transcriptQuality.avgConfidence ?? 0)}</span></div>
            <div>{t("metrics.avgUnknownRatio")}: <span className="font-medium">{toPercent(data?.transcriptQuality.avgUnknownRatio ?? 0)}</span></div>
            <div>{t("metrics.lowQualitySessions")}: <span className="font-medium">{data?.transcriptQuality.lowQualitySessions ?? 0}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("telemetryTitle")}</CardTitle>
            <CardDescription>{t("telemetryDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              {t("telemetry.transcriptNoAiCalls")}: <span className="font-medium">{data?.telemetryIntegrity.sessionsWithTranscriptNoAiCall ?? 0}</span>
            </div>
            <div>
              {t("telemetry.aiCallsNoClientEvents")}: <span className="font-medium">{data?.telemetryIntegrity.sessionsWithAiCallNoClientEvents ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
