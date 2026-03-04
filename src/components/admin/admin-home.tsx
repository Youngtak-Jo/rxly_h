"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Bot, Database, Loader2, Workflow } from "lucide-react"
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
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminLoadingState } from "@/components/admin/admin-loading-state"
import { parseAdminFilters, toAdminApiParams, filtersToSearchParams } from "@/lib/admin/filters"
import { useAdminQuery } from "@/hooks/use-admin-query"
import { useAdminRefreshToken } from "@/components/admin/admin-shell"
import {
  getAdminAlertCopy,
  getAdminFeatureLabel,
  getAdminFunnelStepLabel,
  getAdminPriorityLabel,
  getAdminRuleLabel,
  getAdminSeverityLabel,
  getAdminStatusLabel,
} from "@/lib/admin/localization"
import { formatNumber } from "@/i18n/format"
import { toIntlLocale, type UiLocale } from "@/i18n/config"
import type {
  AdminHomeResponse,
  AdminFunnelStepKey,
  AdminMetricDelta,
} from "@/types/admin"
import { toPercent, fmtDateTime, severityBadgeVariant } from "@/components/admin/admin-utils"

type MetricKind = "number" | "rate" | "currency"

function fmtNumber(value: number, locale: UiLocale): string {
  return formatNumber(value, locale)
}

function fmtCurrency(value: number, locale: UiLocale): string {
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : value >= 1 ? 2 : 4,
    minimumFractionDigits: value >= 100 ? 0 : value >= 1 ? 2 : 4,
  }
  return new Intl.NumberFormat(toIntlLocale(locale), options).format(value)
}

function formatMetricValue(
  value: number,
  kind: MetricKind,
  locale: UiLocale
): string {
  if (kind === "rate") return toPercent(value)
  if (kind === "currency") return fmtCurrency(value, locale)
  return fmtNumber(value, locale)
}

function formatMetricDelta(
  delta: AdminMetricDelta,
  kind: MetricKind,
  locale: UiLocale
): string {
  const sign = delta.delta > 0 ? "+" : delta.delta < 0 ? "-" : ""
  const absValue = Math.abs(delta.delta)

  if (kind === "rate") {
    return `${sign}${(absValue * 100).toFixed(1)}pp`
  }

  if (kind === "currency") {
    return `${sign}${fmtCurrency(absValue, locale)}`
  }

  return `${sign}${fmtNumber(absValue, locale)}`
}

function largestDropoff(
  steps: Array<{ step: AdminFunnelStepKey; count: number }>
): { from: AdminFunnelStepKey; to: AdminFunnelStepKey; dropCount: number; dropRate: number } | null {
  if (steps.length < 2) return null

  let selected: {
    from: AdminFunnelStepKey
    to: AdminFunnelStepKey
    dropCount: number
    dropRate: number
  } | null = null

  for (let index = 0; index < steps.length - 1; index += 1) {
    const current = steps[index]
    const next = steps[index + 1]
    const dropCount = Math.max(0, current.count - next.count)
    const dropRate = current.count > 0 ? dropCount / current.count : 0

    if (!selected || dropRate > selected.dropRate) {
      selected = {
        from: current.step,
        to: next.step,
        dropCount,
        dropRate,
      }
    }
  }

  return selected
}

export function AdminHome() {
  const t = useTranslations("AdminHome")
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
  const filterQuery = useMemo(
    () => filtersToSearchParams(filters).toString(),
    [filters]
  )

  const { data, error, isLoading, isRefreshing } = useAdminQuery<AdminHomeResponse>({
    cacheKey: `admin:home:${apiQuery}`,
    url: `/api/admin/home?${apiQuery}`,
    refreshToken,
  })

  const isInitialLoading = isLoading && !data
  const funnelDrop = useMemo(
    () => largestDropoff((data?.funnel || []).map((step) => ({ step: step.step, count: step.count }))),
    [data?.funnel]
  )

  const summaryCards = useMemo(() => {
    if (!data) return []

    return [
      {
        label: t("summary.activeUsers"),
        value: data.summary.activeUsers,
        delta: data.comparisons.activeUsers,
        kind: "number" as const,
      },
      {
        label: t("summary.sessionStarts"),
        value: data.summary.sessionStarts,
        delta: data.comparisons.sessionStarts,
        kind: "number" as const,
      },
      {
        label: t("summary.transcriptCaptureRate"),
        value: data.summary.transcriptCaptureRate,
        delta: data.comparisons.transcriptCaptureRate,
        kind: "rate" as const,
      },
      {
        label: t("summary.recordFinalizationRate"),
        value: data.summary.recordFinalizationRate,
        delta: data.comparisons.recordFinalizationRate,
        kind: "rate" as const,
      },
      {
        label: t("summary.ddxAdoptionRate"),
        value: data.summary.ddxAdoptionRate,
        delta: data.comparisons.ddxAdoptionRate,
        kind: "rate" as const,
      },
      {
        label: t("summary.handoutGenerationRate"),
        value: data.summary.handoutGenerationRate,
        delta: data.comparisons.handoutGenerationRate,
        kind: "rate" as const,
      },
      {
        label: t("summary.aiCostPerSession"),
        value: data.summary.aiCostPerSession,
        delta: data.comparisons.aiCostPerSession,
        kind: "currency" as const,
      },
      {
        label: t("summary.aiFailureRate"),
        value: data.summary.aiFailureRate,
        delta: data.comparisons.aiFailureRate,
        kind: "rate" as const,
      },
    ]
  }, [data, t])

  if (isInitialLoading) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-xs text-muted-foreground">{t("descriptionShort")}</p>
        </div>

        <AdminLoadingState label={t("homeLoading")} />
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl">
                {formatMetricValue(card.value, card.kind, locale)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              <div>{t("delta", { value: formatMetricDelta(card.delta, card.kind, locale) })}</div>
              <div>{t("previous", { value: formatMetricValue(card.delta.previous, card.kind, locale) })}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">{t("funnelTitle")}</CardTitle>
                <CardDescription>
                  {t("funnelDescription")}
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/funnel?${filterQuery}`}>
                  <Workflow className="size-4" />
                  {t("openFunnel")}
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!data?.funnel.length ? (
              <AdminEmptyState
                title={t("funnelEmptyTitle")}
                description={t("funnelEmptyDescription")}
              />
            ) : (
              <>
                {funnelDrop ? (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
                    <div className="font-medium">{t("biggestBottleneck")}</div>
                    <div className="text-muted-foreground">
                      {getAdminFunnelStepLabel(tCommon, funnelDrop.from)} →{" "}
                      {getAdminFunnelStepLabel(tCommon, funnelDrop.to)}
                    </div>
                    <div className="text-muted-foreground">
                      {t("largestDrop", {
                        dropCount: fmtNumber(funnelDrop.dropCount, locale),
                        dropRate: toPercent(funnelDrop.dropRate),
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-2 md:grid-cols-2">
                  {data.funnel.map((step) => (
                    <div key={step.step} className="rounded-md border px-3 py-2 text-xs">
                      <div className="font-medium">{getAdminFunnelStepLabel(tCommon, step.step)}</div>
                      <div className="text-muted-foreground">
                        {t("sessionsCount", { count: fmtNumber(step.count, locale) })}
                      </div>
                      <div className="text-muted-foreground">{toPercent(step.rate)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">{t("aiStateTitle")}</CardTitle>
                <CardDescription>
                  {t("aiStateDescription")}
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/ai-ops?${filterQuery}`}>
                  <Bot className="size-4" />
                  {t("openAiOps")}
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">{t("aiMetrics.totalCost")}</div>
                <div className="font-medium">{fmtCurrency(data?.aiOverview.totalCostUsd ?? 0, locale)}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">{t("aiMetrics.p95Latency")}</div>
                <div className="font-medium">{Math.round(data?.aiOverview.p95LatencyMs ?? 0)}ms</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">{t("aiMetrics.costPerSession")}</div>
                <div className="font-medium">{fmtCurrency(data?.aiOverview.costPerSession ?? 0, locale)}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">{t("aiMetrics.costConcentration")}</div>
                <div className="font-medium">{toPercent(data?.aiOverview.costConcentrationRate ?? 0)}</div>
              </div>
            </div>

            {data?.aiOverview.topCostRow ? (
              <div className="rounded-md border p-2 text-xs">
                <div className="font-medium">{t("highestSpendPath")}</div>
                <div className="text-muted-foreground">
                  {getAdminFeatureLabel(tCommon, data.aiOverview.topCostRow.feature)} /{" "}
                  {data.aiOverview.topCostRow.model}
                </div>
                <div className="text-muted-foreground">
                  {t("topCostDetail", {
                    cost: fmtCurrency(data.aiOverview.topCostRow.costUsd, locale),
                    calls: fmtNumber(data.aiOverview.topCostRow.calls, locale),
                  })}
                </div>
              </div>
            ) : null}

            {!data?.aiOverview.topFailingRows.length ? (
              <AdminEmptyState
                title={t("noFailingFeatureTitle")}
                description={t("noFailingFeatureDescription")}
              />
            ) : (
              <div className="space-y-2">
                {data.aiOverview.topFailingRows.map((row) => (
                  <div key={`${row.feature}:${row.model}`} className="rounded-md border p-2 text-xs">
                    <div className="font-medium">
                      {getAdminFeatureLabel(tCommon, row.feature)} / {row.model}
                    </div>
                    <div className="text-muted-foreground">
                      {t("failuresOfCalls", {
                        failures: fmtNumber(row.failureCount, locale),
                        calls: fmtNumber(row.calls, locale),
                      })}
                    </div>
                    <div className="text-muted-foreground">
                      {t("rateValue", { value: toPercent(row.failureRate) })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">{t("liveAlertsTitle")}</CardTitle>
                <CardDescription>
                  {t("liveAlertsDescription")}
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/triage?${filterQuery}`}>{t("openTriage")}</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.attention.topRules.length ? (
              <div className="flex flex-wrap gap-2">
                {data.attention.topRules.map((rule) => (
                  <Badge key={rule.rule} variant={severityBadgeVariant(rule.severity)}>
                    {getAdminRuleLabel(tCommon, rule.rule)} · {fmtNumber(rule.count, locale)}
                  </Badge>
                ))}
              </div>
            ) : null}

            {!data?.attention.liveAlerts.length ? (
              <AdminEmptyState
                title={t("noLiveAlertsTitle")}
                description={t("noLiveAlertsDescription")}
              />
            ) : (
              <div className="grid gap-2">
                {data.attention.liveAlerts.slice(0, 6).map((alert) => {
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
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/users/${alert.userId}?${filterQuery}`}>
                              {t("user")}
                            </Link>
                          </Button>
                        ) : null}
                        {alert.sessionId ? (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/sessions/${alert.sessionId}?${filterQuery}`}>
                              {t("session")}
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("incidentBacklogTitle")}</CardTitle>
            <CardDescription>
              {t("incidentBacklogDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!data?.attention.incidents.length ? (
              <AdminEmptyState
                title={t("noBacklogTitle")}
                description={t("noBacklogDescription")}
              />
            ) : (
              data.attention.incidents.map((incident) => {
                const copy = getAdminAlertCopy(tCommon, incident)

                return (
                  <div key={incident.id} className="rounded-md border p-2 text-xs">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant={severityBadgeVariant(incident.severity)}>
                        {getAdminSeverityLabel(tCommon, incident.severity)}
                      </Badge>
                      <Badge variant="outline">
                        {getAdminPriorityLabel(tCommon, incident.priority)}
                      </Badge>
                      <Badge variant="outline">
                        {getAdminStatusLabel(tCommon, incident.status)}
                      </Badge>
                    </div>
                    <div className="font-medium">{copy.title}</div>
                    <div className="text-muted-foreground">{copy.label}</div>
                    <div className="text-muted-foreground">
                      {t("seenAt", { value: fmtDateTime(incident.lastSeenAt) })}
                    </div>
                  </div>
                )
              })
            )}
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
            {!data?.trends.length ? (
              <AdminEmptyState
                title={t("noTrendTitle")}
                description={t("noTrendDescription")}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trends}>
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
                    name={t("trend.series.sessions")}
                    stroke="#1d4ed8"
                    fill="#93c5fd"
                    fillOpacity={0.3}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="aiCalls"
                    name={t("trend.series.aiCalls")}
                    stroke="#0f766e"
                    fill="#5eead4"
                    fillOpacity={0.25}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="completionRate"
                    name={t("trend.series.workflowProgress")}
                    stroke="#c2410c"
                    fill="#fdba74"
                    fillOpacity={0.22}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">{t("telemetryTrustTitle")}</CardTitle>
                <CardDescription>
                  {t("telemetryTrustDescription")}
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/data-quality?${filterQuery}`}>
                  <Database className="size-4" />
                  {t("openDataQuality")}
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="rounded-md border p-2">
              <div className="text-muted-foreground">{t("telemetryMetrics.sessionsWithClientEvents")}</div>
              <div className="font-medium">
                {fmtNumber(data?.telemetry.sessionsWithAnyClientEvents ?? 0, locale)} /{" "}
                {fmtNumber(data?.summary.sessionStarts ?? 0, locale)}
              </div>
              <div className="text-muted-foreground">
                {t("coverageValue", { value: toPercent(data?.telemetry.sessionCoverageRate ?? 0) })}
              </div>
            </div>
            <div className="rounded-md border p-2">
              <div className="text-muted-foreground">{t("telemetryMetrics.transcriptNoAi")}</div>
              <div className="font-medium">
                {fmtNumber(data?.telemetry.sessionsWithTranscriptNoAiCall ?? 0, locale)}
              </div>
            </div>
            <div className="rounded-md border p-2">
              <div className="text-muted-foreground">{t("telemetryMetrics.aiCallsNoClientEvents")}</div>
              <div className="font-medium">
                {fmtNumber(data?.telemetry.sessionsWithAiCallNoClientEvents ?? 0, locale)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("featureAdoptionTitle")}</CardTitle>
          <CardDescription>
            {t("featureAdoptionDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          {!data?.featureAdoption.length ? (
            <AdminEmptyState
              title={t("noAdoptionTitle")}
              description={t("noAdoptionDescription")}
            />
          ) : (
            data.featureAdoption.map((row) => (
              <div key={row.feature} className="rounded-md border p-3 text-xs">
                <div className="font-medium">{getAdminFeatureLabel(tCommon, row.feature)}</div>
                <div className="text-muted-foreground">
                  {t("sessionsCount", { count: fmtNumber(row.sessions, locale) })}
                </div>
                <div className="text-muted-foreground">{toPercent(row.rate)}</div>
                <div className="mt-1 text-muted-foreground">
                  {t("delta", { value: formatMetricDelta(row.delta, "rate", locale) })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  )
}
