"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { fmtDateTime, severityBadgeVariant, toPercent } from "@/components/admin/admin-utils"
import { useAdminRefreshToken } from "@/components/admin/admin-shell"
import { useAdminQuery } from "@/hooks/use-admin-query"
import {
  filtersToSearchParams,
  parseAdminFilters,
  toAdminApiParams,
} from "@/lib/admin/filters"
import {
  getAdminAlertCopy,
  getAdminFunnelStepLabel,
  getAdminModeLabel,
  getAdminRuleLabel,
  getAdminSeverityLabel,
  getAdminTimelineCategoryLabel,
  getAdminTimelineSourceLabel,
  getAdminTimelineStatusLabel,
} from "@/lib/admin/localization"
import type { AdminUserDetailResponse } from "@/types/admin"

export function AdminUserDetail({ userId }: { userId: string }) {
  const t = useTranslations("AdminUserDetail")
  const tCommon = useTranslations("AdminCommon")
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseAdminFilters(searchParams), [searchParams])
  const refreshToken = useAdminRefreshToken()

  const apiParams = useMemo(
    () =>
      toAdminApiParams(filters, {
        eventsLimit: "120",
        sessionsLimit: "30",
      }),
    [filters]
  )
  const apiQuery = apiParams.toString()
  const filterQuery = useMemo(
    () => filtersToSearchParams(filters).toString(),
    [filters]
  )

  const { data, error, isLoading, isRefreshing } = useAdminQuery<AdminUserDetailResponse>({
    cacheKey: `admin:user:${userId}:${apiQuery}`,
    url: `/api/admin/users/${userId}?${apiQuery}`,
    refreshToken,
  })

  const isInitialLoading = isLoading && !data

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/users?${filterQuery}`}>{t("backToUsers")}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/triage?${filterQuery}&q=${userId}`}>{t("openTriage")}</Link>
        </Button>
        {isRefreshing ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      </div>

      {error ? (
        <AdminEmptyState title={t("failed")} description={error} />
      ) : null}

      {isInitialLoading ? (
        <AdminLoadingState label={t("loading")} />
      ) : null}

      {!isInitialLoading && !data ? (
        <AdminEmptyState title={t("noDataTitle")} description={t("noDataDescription")} />
      ) : null}

      {data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {data.displayName || data.email || data.userId}
              </CardTitle>
              <CardDescription>
                {t("range", { from: fmtDateTime(data.from), to: fmtDateTime(data.to) })}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t("metrics.sessions.title")}</CardDescription>
                  <CardTitle className="text-2xl">{data.behavior.sessionCount}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {t("metrics.sessions.description")}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t("metrics.recordFinalization.title")}</CardDescription>
                  <CardTitle className="text-2xl">
                    {toPercent(data.behavior.completionRate)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {t("metrics.recordFinalization.description")}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t("metrics.aiSuccessFailure.title")}</CardDescription>
                  <CardTitle className="text-2xl">
                    {data.behavior.aiSuccessCount}/{data.behavior.aiFailureCount}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {t("metrics.aiSuccessFailure.description", {
                    rate: toPercent(data.behavior.aiFailureRate),
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t("metrics.lastActive.title")}</CardDescription>
                  <CardTitle className="text-sm font-medium">
                    {fmtDateTime(data.behavior.lastActiveAt)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {t("metrics.lastActive.description")}
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("funnelTitle")}</CardTitle>
                <CardDescription>{t("funnelDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.funnel.map((step) => (
                  <div
                    key={step.step}
                    className="flex items-center justify-between rounded-md border px-2 py-1 text-xs"
                  >
                    <span>{getAdminFunnelStepLabel(tCommon, step.step)}</span>
                    <span className="font-medium">
                      {step.count} ({toPercent(step.rate)})
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">{t("insightsTitle")}</CardTitle>
                <CardDescription>
                  {t("insightsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.alerts.length === 0 ? (
                  <AdminEmptyState
                    title={t("noAlertsTitle")}
                    description={t("noAlertsDescription")}
                  />
                ) : (
                  data.alerts.map((alert) => {
                    const copy = getAdminAlertCopy(tCommon, alert)

                    return (
                      <div key={alert.id} className="rounded-md border p-2 text-xs">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge variant={severityBadgeVariant(alert.severity)}>
                            {getAdminSeverityLabel(tCommon, alert.severity)}
                          </Badge>
                          <span className="font-medium">{copy.label}</span>
                        </div>
                        <div className="font-medium">{copy.title}</div>
                        <div className="text-muted-foreground">{copy.description}</div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("timelineTitle")}</CardTitle>
                <CardDescription>
                  {t("timelineDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.timeline.length === 0 ? (
                  <AdminEmptyState
                    title={t("noTimelineTitle")}
                    description={t("noTimelineDescription")}
                  />
                ) : (
                  data.timeline.map((event) => (
                    <div key={event.id} className="rounded-md border p-2 text-xs">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="outline">
                          {getAdminTimelineSourceLabel(tCommon, event.source)}
                        </Badge>
                        <Badge variant="outline">
                          {getAdminTimelineCategoryLabel(tCommon, event.category)}
                        </Badge>
                        <Badge
                          variant={
                            event.status === "failed"
                              ? "destructive"
                              : event.status === "success"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {getAdminTimelineStatusLabel(tCommon, event.status)}
                        </Badge>
                        <span className="ml-auto text-muted-foreground">
                          {fmtDateTime(event.timestamp)}
                        </span>
                      </div>
                      <div className="font-medium">{event.label}</div>
                      {event.detail ? (
                        <div className="text-muted-foreground">{event.detail}</div>
                      ) : null}
                      {event.sessionId ? (
                        <Button asChild variant="link" className="h-auto p-0 text-xs">
                          <Link href={`/admin/sessions/${event.sessionId}?${filterQuery}`}>
                            {t("openSession", { id: event.sessionId.slice(0, 8) })}
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("sessionMapTitle")}</CardTitle>
                <CardDescription>
                  {t("sessionMapDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("columns.session")}</TableHead>
                        <TableHead>{t("columns.mode")}</TableHead>
                        <TableHead>{t("columns.recordFinalization")}</TableHead>
                        <TableHead>{t("columns.flags")}</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="text-xs font-medium">
                              {session.title || session.id.slice(0, 8)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {fmtDateTime(session.startedAt)}
                            </div>
                          </TableCell>
                          <TableCell>{getAdminModeLabel(tCommon, session.mode)}</TableCell>
                          <TableCell>{toPercent(session.recordFinalizationRate)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {session.riskFlags.length === 0 ? (
                                <span className="text-xs text-muted-foreground">-</span>
                              ) : (
                                session.riskFlags.map((flag) => (
                                  <Badge key={flag} variant="outline" className="text-[10px]">
                                    {getAdminRuleLabel(tCommon, flag)}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/sessions/${session.id}?${filterQuery}`}>
                                {t("open")}
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {data.sessions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <AdminEmptyState
                              title={t("noSessionsTitle")}
                              description={t("noSessionsDescription")}
                            />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </section>
  )
}
