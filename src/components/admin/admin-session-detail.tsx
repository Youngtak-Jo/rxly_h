"use client"

import Link from "next/link"
import { useCallback, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminLoadingState } from "@/components/admin/admin-loading-state"
import { useAdminRefreshToken } from "@/components/admin/admin-shell"
import { useAdminQuery } from "@/hooks/use-admin-query"
import { filtersToSearchParams, parseAdminFilters } from "@/lib/admin/filters"
import { fmtDateTime, toPercent } from "@/components/admin/admin-utils"
import type { AdminSessionDetail, PhiRevealRequest } from "@/types/admin"

export function AdminSessionDetailView({ sessionId }: { sessionId: string }) {
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseAdminFilters(searchParams), [searchParams])
  const filterQuery = useMemo(
    () => filtersToSearchParams(filters).toString(),
    [filters]
  )
  const refreshToken = useAdminRefreshToken()

  const [revealedValues, setRevealedValues] = useState<Record<string, unknown>>({})

  const { data, error, isLoading, isRefreshing } = useAdminQuery<AdminSessionDetail>({
    cacheKey: `admin:session-detail:${sessionId}`,
    url: `/api/admin/sessions/${sessionId}`,
    refreshToken,
  })
  const isInitialLoading = isLoading && !data

  const revealField = useCallback(async (payload: PhiRevealRequest) => {
    const reason = window.prompt("Reason for PHI reveal")?.trim()
    if (!reason) return

    const res = await fetch("/api/admin/phi/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        reason,
      }),
    })

    if (!res.ok) return

    const response = (await res.json()) as { value: unknown }
    const key = `${payload.entityType}:${payload.entityId}:${payload.fieldPath}`
    setRevealedValues((prev) => ({ ...prev, [key]: response.value }))
  }, [])

  const revealedOrMasked = useCallback(
    (
      entityType: PhiRevealRequest["entityType"],
      entityId: string,
      fieldPath: string,
      maskedValue: unknown
    ) => {
      const key = `${entityType}:${entityId}:${fieldPath}`
      if (key in revealedValues) {
        return revealedValues[key]
      }
      return maskedValue
    },
    [revealedValues]
  )

  const sessionMeta = (data?.session as
    | {
        title?: string | null
        mode?: string
        startedAt?: string
        updatedAt?: string
      }
    | undefined) ?? { title: null }
  const transcriptCount = Array.isArray(data?.transcriptEntries)
    ? data.transcriptEntries.length
    : 0
  const hasInsights = !!data?.insights
  const hasDdx = Array.isArray(data?.diagnoses) && data.diagnoses.length > 0
  const hasRecord = !!data?.record
  const hasResearch =
    Array.isArray(data?.researchMessages) && data.researchMessages.length > 0
  const hasHandout = !!data?.patientHandout
  const redFlagCount = Array.isArray(
    (data?.insights as { redFlags?: unknown } | null)?.redFlags
  )
    ? ((data?.insights as { redFlags?: unknown[] }).redFlags || []).length
    : 0
  const completionRate =
    [
      transcriptCount > 0,
      hasInsights,
      hasDdx,
      hasRecord,
      hasResearch,
      hasHandout,
    ].filter(Boolean).length / 6

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/sessions?${filterQuery}`}>Back to sessions</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/triage?${filterQuery}&q=${sessionId}`}>Open triage</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Session Drilldown</CardTitle>
            {isRefreshing ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>
          <CardDescription>Selected session: {sessionId}</CardDescription>
        </CardHeader>

        <CardContent>
          {error ? (
            <AdminEmptyState title="Failed to load session detail" description={error} />
          ) : null}

          {isInitialLoading ? (
            <AdminLoadingState label="Loading session detail..." compact />
          ) : null}

          {!data && !isInitialLoading && !error ? (
            <AdminEmptyState
              title="Session detail unavailable"
              description="This session could not be loaded. Try reopening it from the Sessions list."
            />
          ) : null}

          {data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Session</CardDescription>
                    <CardTitle className="text-sm font-medium">
                      {sessionMeta.title || sessionId.slice(0, 8)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs text-muted-foreground">
                    <div>Mode: {sessionMeta.mode || "-"}</div>
                    <div>Started: {fmtDateTime(sessionMeta.startedAt)}</div>
                    <div>Updated: {fmtDateTime(sessionMeta.updatedAt)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Completion</CardDescription>
                    <CardTitle className="text-2xl">
                      {toPercent(completionRate)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    Transcript + insights + ddx + record + research + handout stages.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Signals</CardDescription>
                    <CardTitle className="text-2xl">{transcriptCount}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-1">
                    <Badge variant={hasInsights ? "default" : "outline"}>
                      Insights
                    </Badge>
                    <Badge variant={hasDdx ? "default" : "outline"}>DDx</Badge>
                    <Badge variant={hasRecord ? "default" : "outline"}>Record</Badge>
                    <Badge variant={hasResearch ? "default" : "outline"}>
                      Research
                    </Badge>
                    <Badge variant={hasHandout ? "default" : "outline"}>
                      Handout
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Red Flags</CardDescription>
                    <CardTitle className="text-2xl">{String(redFlagCount)}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    Derived from insights payload in this session.
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="transcript" className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="ddx">DDx</TabsTrigger>
                <TabsTrigger value="record">Record</TabsTrigger>
                <TabsTrigger value="research">Research</TabsTrigger>
                <TabsTrigger value="handout">Handout</TabsTrigger>
                <TabsTrigger value="audit">Audit</TabsTrigger>
              </TabsList>

              <TabsContent value="transcript" className="mt-3 space-y-2">
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {(data.transcriptEntries || []).map((entry, idx) => (
                    <div key={String(entry.id || idx)} className="rounded-md border p-2">
                      <div className="mb-1 text-xs text-muted-foreground">
                        {String(entry.speaker || "UNKNOWN")}
                      </div>
                      <div className="whitespace-pre-wrap text-sm">
                        {String(
                          revealedOrMasked(
                            "transcriptEntry",
                            String(entry.id),
                            "text",
                            entry.text
                          ) || ""
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() =>
                          void revealField({
                            entityType: "transcriptEntry",
                            entityId: String(entry.id),
                            fieldPath: "text",
                            reason: "",
                          })
                        }
                      >
                        Reveal Text
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="insights" className="mt-3 space-y-3">
                <div className="rounded-md border p-2">
                  <div className="text-xs text-muted-foreground">Summary</div>
                  <div className="whitespace-pre-wrap text-sm">
                    {String(
                      revealedOrMasked(
                        "insights",
                        String((data.insights as { id?: string } | null)?.id || ""),
                        "summary",
                        (data.insights as { summary?: unknown } | null)?.summary
                      ) || ""
                    )}
                  </div>
                  {(data.insights as { id?: string } | null)?.id ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() =>
                        void revealField({
                          entityType: "insights",
                          entityId: String((data.insights as { id?: string }).id),
                          fieldPath: "summary",
                          reason: "",
                        })
                      }
                    >
                      Reveal Summary
                    </Button>
                  ) : null}
                </div>
                <pre className="max-h-96 overflow-auto rounded-md border p-2 text-xs">
                  {JSON.stringify(data.insights, null, 2)}
                </pre>
              </TabsContent>

              <TabsContent value="ddx" className="mt-3">
                <pre className="max-h-96 overflow-auto rounded-md border p-2 text-xs">
                  {JSON.stringify(data.diagnoses, null, 2)}
                </pre>
              </TabsContent>

              <TabsContent value="record" className="mt-3">
                <pre className="max-h-96 overflow-auto rounded-md border p-2 text-xs">
                  {JSON.stringify(data.record, null, 2)}
                </pre>
                {(data.record as { id?: string } | null)?.id ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() =>
                      void revealField({
                        entityType: "consultationRecord",
                        entityId: String((data.record as { id?: string }).id),
                        fieldPath: "plan",
                        reason: "",
                      })
                    }
                  >
                    Reveal Plan
                  </Button>
                ) : null}
              </TabsContent>

              <TabsContent value="research" className="mt-3">
                <pre className="max-h-96 overflow-auto rounded-md border p-2 text-xs">
                  {JSON.stringify(data.researchMessages, null, 2)}
                </pre>
              </TabsContent>

              <TabsContent value="handout" className="mt-3">
                <pre className="max-h-96 overflow-auto rounded-md border p-2 text-xs">
                  {JSON.stringify(data.patientHandout, null, 2)}
                </pre>
              </TabsContent>

              <TabsContent value="audit" className="mt-3">
                <pre className="max-h-96 overflow-auto rounded-md border p-2 text-xs">
                  {JSON.stringify(data.auditTimeline, null, 2)}
                </pre>
              </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}
