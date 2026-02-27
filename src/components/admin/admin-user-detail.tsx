"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
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
import type { AdminUserDetailResponse } from "@/types/admin"

export function AdminUserDetail({ userId }: { userId: string }) {
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
          <Link href={`/admin/users?${filterQuery}`}>Back to users</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/triage?${filterQuery}&q=${userId}`}>Open triage</Link>
        </Button>
        {isRefreshing ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      </div>

      {error ? (
        <AdminEmptyState title="Failed to load user detail" description={error} />
      ) : null}

      {isInitialLoading ? (
        <AdminLoadingState label="Loading user behavior..." />
      ) : null}

      {!isInitialLoading && !data ? (
        <AdminEmptyState title="No user data" description="User detail is not available." />
      ) : null}

      {data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {data.displayName || data.email || data.userId}
              </CardTitle>
              <CardDescription>
                Range: {fmtDateTime(data.from)} - {fmtDateTime(data.to)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Sessions</CardDescription>
                  <CardTitle className="text-2xl">{data.behavior.sessionCount}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Sessions in selected period.
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Completion Rate</CardDescription>
                  <CardTitle className="text-2xl">
                    {toPercent(data.behavior.completionRate)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Sessions closed with plan or assessment.
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>AI Success / Failure</CardDescription>
                  <CardTitle className="text-2xl">
                    {data.behavior.aiSuccessCount}/{data.behavior.aiFailureCount}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Failure rate {toPercent(data.behavior.aiFailureRate)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Last Active</CardDescription>
                  <CardTitle className="text-sm font-medium">
                    {fmtDateTime(data.behavior.lastActiveAt)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Most recent session activity timestamp.
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">User Funnel</CardTitle>
                <CardDescription>Completion progression for this user.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.funnel.map((step) => (
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
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">User Insights</CardTitle>
                <CardDescription>
                  Behavior-derived risk and quality alerts for selected user.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.alerts.length === 0 ? (
                  <AdminEmptyState
                    title="No user alerts"
                    description="No high-priority risk pattern for this user in current range."
                  />
                ) : (
                  data.alerts.map((alert) => (
                    <div key={alert.id} className="rounded-md border p-2 text-xs">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant={severityBadgeVariant(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className="font-medium">{alert.rule}</span>
                      </div>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-muted-foreground">{alert.description}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Behavior Timeline</CardTitle>
                <CardDescription>
                  Chronological client + audit events for investigation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.timeline.length === 0 ? (
                  <AdminEmptyState
                    title="No timeline events"
                    description="No tracked events for this user in the selected range."
                  />
                ) : (
                  data.timeline.map((event) => (
                    <div key={event.id} className="rounded-md border p-2 text-xs">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="outline">{event.source}</Badge>
                        <Badge variant="outline">{event.category}</Badge>
                        <Badge
                          variant={
                            event.status === "failed"
                              ? "destructive"
                              : event.status === "success"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {event.status}
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
                            Open Session {event.sessionId.slice(0, 8)}
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
                <CardTitle className="text-base">User Session Map</CardTitle>
                <CardDescription>
                  Sessions with completion and risk flags.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Completion</TableHead>
                        <TableHead>Flags</TableHead>
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
                          <TableCell>{session.mode}</TableCell>
                          <TableCell>{toPercent(session.completionRate)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {session.riskFlags.length === 0 ? (
                                <span className="text-xs text-muted-foreground">-</span>
                              ) : (
                                session.riskFlags.map((flag) => (
                                  <Badge key={flag} variant="outline" className="text-[10px]">
                                    {flag}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/sessions/${session.id}?${filterQuery}`}>
                                Open
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {data.sessions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <AdminEmptyState
                              title="No sessions"
                              description="No sessions matched current filters for this user."
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
