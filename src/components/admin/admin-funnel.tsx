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
import { getAdminFunnelStepLabel } from "@/lib/admin/localization"
import type { AdminFunnelResponse } from "@/types/admin"
import { toPercent } from "@/components/admin/admin-utils"

export function AdminFunnel() {
  const t = useTranslations("AdminFunnel")
  const tCommon = useTranslations("AdminCommon")
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseAdminFilters(searchParams), [searchParams])
  const refreshToken = useAdminRefreshToken()

  const apiQuery = useMemo(
    () => toAdminApiParams({ ...filters, q: "" }).toString(),
    [filters]
  )

  const { data, error, isLoading, isRefreshing } = useAdminQuery<AdminFunnelResponse>({
    cacheKey: `admin:funnel:${apiQuery}`,
    url: `/api/admin/funnel?${apiQuery}`,
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
            <CardTitle className="text-base">{t("stageTitle")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!data?.steps.length ? (
              <AdminEmptyState
                title={t("stageEmptyTitle")}
                description={t("stageEmptyDescription")}
              />
            ) : (
              data.steps.map((step) => (
                <div key={step.step} className="flex items-center justify-between rounded-md border px-2 py-1 text-xs">
                  <span>{getAdminFunnelStepLabel(tCommon, step.step)}</span>
                  <span className="font-medium">
                    {step.count} ({toPercent(step.rate)})
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dropoffsTitle")}</CardTitle>
            <CardDescription>{t("dropoffsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!data?.dropoffs.length ? (
              <AdminEmptyState
                title={t("dropoffsEmptyTitle")}
                description={t("dropoffsEmptyDescription")}
              />
            ) : (
              data.dropoffs.map((drop) => (
                <div key={`${drop.fromStep}:${drop.toStep}`} className="rounded-md border p-2 text-xs">
                  <div className="font-medium">
                    {getAdminFunnelStepLabel(tCommon, drop.fromStep)} → {getAdminFunnelStepLabel(tCommon, drop.toStep)}
                  </div>
                  <div className="text-muted-foreground">
                    {t("dropLabel", { dropCount: drop.dropCount, dropRate: toPercent(drop.dropRate) })}
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
