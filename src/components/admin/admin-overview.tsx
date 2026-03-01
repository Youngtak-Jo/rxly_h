"use client"

import { useMemo } from "react"
import { Loader2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
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
import { getAdminFunnelStepLabel } from "@/lib/admin/localization"
import { formatNumber } from "@/i18n/format"
import type { UiLocale } from "@/i18n/config"
import type { AdminOverviewResponse } from "@/types/admin"
import { toPercent } from "@/components/admin/admin-utils"

export function AdminOverview() {
  const t = useTranslations("AdminOverview")
  const tCommon = useTranslations("AdminCommon")
  const locale = useLocale() as UiLocale
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
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-xs text-muted-foreground">{t("description")}</p>
        </div>

        <AdminLoadingState label={t("loading")} />
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        {isRefreshing ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{t("description")}</p>
      </div>

      {error ? (
        <AdminEmptyState title={t("failed")} description={error} />
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("kpis.dau.title")}</CardDescription>
            <CardTitle className="text-2xl">
              {formatNumber(kpis?.dau ?? 0, locale)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {t("kpis.dau.description")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("kpis.activeSessions.title")}</CardDescription>
            <CardTitle className="text-2xl">
              {formatNumber(kpis?.activeSessions ?? 0, locale)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {t("kpis.activeSessions.description")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("kpis.sessionCompletion.title")}</CardDescription>
            <CardTitle className="text-2xl">
              {toPercent(kpis?.sessionCompletionRate ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {t("kpis.sessionCompletion.description")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("kpis.aiCalls.title")}</CardDescription>
            <CardTitle className="text-2xl">
              {formatNumber(kpis?.aiCalls ?? 0, locale)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {t("kpis.aiCalls.description")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("kpis.documentGeneration.title")}</CardDescription>
            <CardTitle className="text-2xl">
              {toPercent(kpis?.documentGenerationRate ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {t("kpis.documentGeneration.description")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("kpis.exports.title")}</CardDescription>
            <CardTitle className="text-2xl">
              {formatNumber(kpis?.exportCount ?? 0, locale)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {t("kpis.exports.description")}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("trendTitle")}</CardTitle>
            <CardDescription>
              {t("trendDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {isInitialLoading ? (
              <AdminEmptyState
                title={t("loadingTrendTitle")}
                description={t("loadingTrendDescription")}
              />
            ) : (data?.trends || []).length === 0 ? (
              <AdminEmptyState
                title={t("noTrendTitle")}
                description={t("noTrendDescription")}
              />
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
                    name={t("trendSeries.sessions")}
                    stroke="#1d4ed8"
                    fill="#93c5fd"
                    fillOpacity={0.3}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="aiCalls"
                    name={t("trendSeries.aiCalls")}
                    stroke="#0f766e"
                    fill="#5eead4"
                    fillOpacity={0.25}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="completionRate"
                    name={t("trendSeries.completionRate")}
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
            <CardTitle className="text-base">{t("funnelTitle")}</CardTitle>
            <CardDescription>{t("funnelDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.funnel || []).map((step) => (
              <div
                key={step.step}
                className="flex items-center justify-between rounded-md border px-2 py-1 text-xs"
              >
                <span>{getAdminFunnelStepLabel(tCommon, step.step)}</span>
                <span className="font-medium">
                  {formatNumber(step.count, locale)} ({toPercent(step.rate)})
                </span>
              </div>
            ))}
            {!isInitialLoading && !data?.funnel.length ? (
              <AdminEmptyState
                title={t("noFunnelTitle")}
                description={t("noFunnelDescription")}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
