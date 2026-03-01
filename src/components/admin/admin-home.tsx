"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Bot, Database, Loader2, Workflow } from "lucide-react"
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
import type {
  AdminFeatureAdoptionFeature,
  AdminHomeResponse,
  AdminMetricDelta,
} from "@/types/admin"
import { toPercent, fmtDateTime, severityBadgeVariant } from "@/components/admin/admin-utils"

type MetricKind = "number" | "rate" | "currency"

const FEATURE_LABELS: Record<AdminFeatureAdoptionFeature, string> = {
  transcript: "Transcript",
  insights: "Insights",
  ddx: "DDx",
  record: "Record",
  research: "Research",
  handout: "Handout",
  export: "Export",
}

function fmtNumber(value: number): string {
  return value.toLocaleString("en-US")
}

function fmtCurrency(value: number): string {
  if (value >= 100) return `$${value.toFixed(0)}`
  if (value >= 1) return `$${value.toFixed(2)}`
  return `$${value.toFixed(4)}`
}

function formatMetricValue(value: number, kind: MetricKind): string {
  if (kind === "rate") return toPercent(value)
  if (kind === "currency") return fmtCurrency(value)
  return fmtNumber(value)
}

function formatMetricDelta(delta: AdminMetricDelta, kind: MetricKind): string {
  const sign = delta.delta > 0 ? "+" : delta.delta < 0 ? "-" : ""
  const absValue = Math.abs(delta.delta)

  if (kind === "rate") {
    return `${sign}${(absValue * 100).toFixed(1)}pp`
  }

  if (kind === "currency") {
    return `${sign}${fmtCurrency(absValue)}`
  }

  return `${sign}${fmtNumber(absValue)}`
}

function largestDropoff(
  steps: Array<{ step: string; count: number }>
): { from: string; to: string; dropCount: number; dropRate: number } | null {
  if (steps.length < 2) return null

  let selected: { from: string; to: string; dropCount: number; dropRate: number } | null = null

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
        label: "Active Users",
        value: data.summary.activeUsers,
        delta: data.comparisons.activeUsers,
        kind: "number" as const,
      },
      {
        label: "Session Starts",
        value: data.summary.sessionStarts,
        delta: data.comparisons.sessionStarts,
        kind: "number" as const,
      },
      {
        label: "Transcript Capture Rate",
        value: data.summary.transcriptCaptureRate,
        delta: data.comparisons.transcriptCaptureRate,
        kind: "rate" as const,
      },
      {
        label: "Record Finalization Rate",
        value: data.summary.recordFinalizationRate,
        delta: data.comparisons.recordFinalizationRate,
        kind: "rate" as const,
      },
      {
        label: "DDx Adoption Rate",
        value: data.summary.ddxAdoptionRate,
        delta: data.comparisons.ddxAdoptionRate,
        kind: "rate" as const,
      },
      {
        label: "Handout Generation Rate",
        value: data.summary.handoutGenerationRate,
        delta: data.comparisons.handoutGenerationRate,
        kind: "rate" as const,
      },
      {
        label: "AI Cost / Session",
        value: data.summary.aiCostPerSession,
        delta: data.comparisons.aiCostPerSession,
        kind: "currency" as const,
      },
      {
        label: "AI Failure Rate",
        value: data.summary.aiFailureRate,
        delta: data.comparisons.aiFailureRate,
        kind: "rate" as const,
      },
    ]
  }, [data])

  if (isInitialLoading) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Home</h2>
          <p className="text-xs text-muted-foreground">
            Adoption-first operations console with AI root-cause context.
          </p>
        </div>

        <AdminLoadingState label="Loading home data..." />
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Home</h2>
        {isRefreshing ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">
          Adoption-first operations console with workflow bottlenecks, live attention queue, and AI root-cause context.
        </p>
      </div>

      {error ? (
        <AdminEmptyState title="Failed to load home" description={error} />
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl">
                {formatMetricValue(card.value, card.kind)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              <div>Delta {formatMetricDelta(card.delta, card.kind)}</div>
              <div>Previous {formatMetricValue(card.delta.previous, card.kind)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Workflow Funnel</CardTitle>
                <CardDescription>
                  Stage conversion from session start to export.
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/funnel?${filterQuery}`}>
                  <Workflow className="size-4" />
                  Open funnel
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!data?.funnel.length ? (
              <AdminEmptyState title="No funnel data" description="No sessions in the selected range." />
            ) : (
              <>
                {funnelDrop ? (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
                    <div className="font-medium">Biggest bottleneck</div>
                    <div className="text-muted-foreground">
                      {funnelDrop.from} → {funnelDrop.to}
                    </div>
                    <div className="text-muted-foreground">
                      Drop {fmtNumber(funnelDrop.dropCount)} ({toPercent(funnelDrop.dropRate)})
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-2 md:grid-cols-2">
                  {data.funnel.map((step) => (
                    <div key={step.step} className="rounded-md border px-3 py-2 text-xs">
                      <div className="font-medium">{step.step}</div>
                      <div className="text-muted-foreground">
                        {fmtNumber(step.count)} sessions
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
                <CardTitle className="text-base">AI State</CardTitle>
                <CardDescription>
                  Root-cause view for latency, failures, and spend.
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/ai-ops?${filterQuery}`}>
                  <Bot className="size-4" />
                  Open AI Ops
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">Total Cost</div>
                <div className="font-medium">{fmtCurrency(data?.aiOverview.totalCostUsd ?? 0)}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">P95 Latency</div>
                <div className="font-medium">{Math.round(data?.aiOverview.p95LatencyMs ?? 0)}ms</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">Cost / Session</div>
                <div className="font-medium">{fmtCurrency(data?.aiOverview.costPerSession ?? 0)}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">Cost Concentration</div>
                <div className="font-medium">{toPercent(data?.aiOverview.costConcentrationRate ?? 0)}</div>
              </div>
            </div>

            {data?.aiOverview.topCostRow ? (
              <div className="rounded-md border p-2 text-xs">
                <div className="font-medium">Highest spend path</div>
                <div className="text-muted-foreground">
                  {data.aiOverview.topCostRow.feature} / {data.aiOverview.topCostRow.model}
                </div>
                <div className="text-muted-foreground">
                  {fmtCurrency(data.aiOverview.topCostRow.costUsd)} across {fmtNumber(data.aiOverview.topCostRow.calls)} calls
                </div>
              </div>
            ) : null}

            {!data?.aiOverview.topFailingRows.length ? (
              <AdminEmptyState
                title="No failing feature/model"
                description="No AI failures were recorded in the selected range."
              />
            ) : (
              <div className="space-y-2">
                {data.aiOverview.topFailingRows.map((row) => (
                  <div key={`${row.feature}:${row.model}`} className="rounded-md border p-2 text-xs">
                    <div className="font-medium">{row.feature} / {row.model}</div>
                    <div className="text-muted-foreground">
                      Failures {fmtNumber(row.failureCount)} of {fmtNumber(row.calls)} calls
                    </div>
                    <div className="text-muted-foreground">
                      Rate {toPercent(row.failureRate)}
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
                <CardTitle className="text-base">Live Alerts</CardTitle>
                <CardDescription>
                  Read-only live rule hits before incident promotion.
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/triage?${filterQuery}`}>Open triage</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.attention.topRules.length ? (
              <div className="flex flex-wrap gap-2">
                {data.attention.topRules.map((rule) => (
                  <Badge key={rule.rule} variant={severityBadgeVariant(rule.severity)}>
                    {rule.rule} · {rule.count}
                  </Badge>
                ))}
              </div>
            ) : null}

            {!data?.attention.liveAlerts.length ? (
              <AdminEmptyState title="No live alerts" description="No rule hits matched the current filters." />
            ) : (
              <div className="grid gap-2">
                {data.attention.liveAlerts.slice(0, 6).map((alert) => (
                  <div key={alert.id} className="rounded-md border p-3 text-xs">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant={severityBadgeVariant(alert.severity)}>{alert.severity}</Badge>
                      <span className="font-medium">{alert.rule}</span>
                    </div>
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-muted-foreground">{alert.description}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {alert.userId ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/users/${alert.userId}?${filterQuery}`}>User</Link>
                        </Button>
                      ) : null}
                      {alert.sessionId ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/sessions/${alert.sessionId}?${filterQuery}`}>Session</Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incident Backlog</CardTitle>
            <CardDescription>
              Persisted incident queue with owner/status workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!data?.attention.incidents.length ? (
              <AdminEmptyState title="No backlog" description="No promoted incidents matched the current filters." />
            ) : (
              data.attention.incidents.map((incident) => (
                <div key={incident.id} className="rounded-md border p-2 text-xs">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant={severityBadgeVariant(incident.severity)}>
                      {incident.severity}
                    </Badge>
                    <Badge variant="outline">{incident.priority}</Badge>
                    <Badge variant="outline">{incident.status}</Badge>
                  </div>
                  <div className="font-medium">{incident.title}</div>
                  <div className="text-muted-foreground">{incident.rule}</div>
                  <div className="text-muted-foreground">Seen {fmtDateTime(incident.lastSeenAt)}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Trend</CardTitle>
            <CardDescription>
              Sessions, AI calls, and workflow progress by time bucket.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {!data?.trends.length ? (
              <AdminEmptyState title="No trend data" description="No sessions in selected range." />
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
                    name="Sessions"
                    stroke="#1d4ed8"
                    fill="#93c5fd"
                    fillOpacity={0.3}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="aiCalls"
                    name="AI Calls"
                    stroke="#0f766e"
                    fill="#5eead4"
                    fillOpacity={0.25}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="completionRate"
                    name="Workflow Progress"
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
                <CardTitle className="text-base">Telemetry Trust</CardTitle>
                <CardDescription>
                  Interpret adoption metrics with instrumentation coverage in view.
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/data-quality?${filterQuery}`}>
                  <Database className="size-4" />
                  Open data quality
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="rounded-md border p-2">
              <div className="text-muted-foreground">Sessions with any client events</div>
              <div className="font-medium">
                {fmtNumber(data?.telemetry.sessionsWithAnyClientEvents ?? 0)} / {fmtNumber(data?.summary.sessionStarts ?? 0)}
              </div>
              <div className="text-muted-foreground">
                Coverage {toPercent(data?.telemetry.sessionCoverageRate ?? 0)}
              </div>
            </div>
            <div className="rounded-md border p-2">
              <div className="text-muted-foreground">Transcript with no AI</div>
              <div className="font-medium">
                {fmtNumber(data?.telemetry.sessionsWithTranscriptNoAiCall ?? 0)}
              </div>
            </div>
            <div className="rounded-md border p-2">
              <div className="text-muted-foreground">AI calls with no client events</div>
              <div className="font-medium">
                {fmtNumber(data?.telemetry.sessionsWithAiCallNoClientEvents ?? 0)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature Adoption Detail</CardTitle>
          <CardDescription>
            Feature reach in the selected range compared to the previous window.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          {!data?.featureAdoption.length ? (
            <AdminEmptyState title="No adoption data" description="No sessions matched the current filters." />
          ) : (
            data.featureAdoption.map((row) => (
              <div key={row.feature} className="rounded-md border p-3 text-xs">
                <div className="font-medium">{FEATURE_LABELS[row.feature]}</div>
                <div className="text-muted-foreground">
                  {fmtNumber(row.sessions)} sessions
                </div>
                <div className="text-muted-foreground">{toPercent(row.rate)}</div>
                <div className="mt-1 text-muted-foreground">
                  Delta {formatMetricDelta(row.delta, "rate")}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  )
}
