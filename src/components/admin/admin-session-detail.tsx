"use client"

import Link from "next/link"
import { useCallback, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
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
import {
  getAdminFeatureLabel,
  getAdminModeLabel,
} from "@/lib/admin/localization"
import type { AdminSessionDetail, PhiRevealRequest } from "@/types/admin"

export function AdminSessionDetailView({ sessionId }: { sessionId: string }) {
  const t = useTranslations("AdminSessionDetail")
  const tCommon = useTranslations("AdminCommon")
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
    const reason = window.prompt(t("revealReasonPrompt"))?.trim()
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
  }, [t])

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
  const workflowProgress =
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
          <Link href={`/admin/sessions?${filterQuery}`}>{t("backToSessions")}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/triage?${filterQuery}&q=${sessionId}`}>{t("openTriage")}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{t("title")}</CardTitle>
            {isRefreshing ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>
          <CardDescription>{t("selectedSession", { id: sessionId })}</CardDescription>
        </CardHeader>

        <CardContent>
          {error ? (
            <AdminEmptyState title={t("failed")} description={error} />
          ) : null}

          {isInitialLoading ? (
            <AdminLoadingState label={t("loading")} compact />
          ) : null}

          {!data && !isInitialLoading && !error ? (
            <AdminEmptyState
              title={t("unavailableTitle")}
              description={t("unavailableDescription")}
            />
          ) : null}

          {data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>{t("cards.session.title")}</CardDescription>
                    <CardTitle className="text-sm font-medium">
                      {sessionMeta.title || sessionId.slice(0, 8)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs text-muted-foreground">
                    <div>
                      {t("cards.session.mode", {
                        value: sessionMeta.mode
                          ? getAdminModeLabel(
                              tCommon,
                              sessionMeta.mode as "DOCTOR" | "AI_DOCTOR"
                            )
                          : "-",
                      })}
                    </div>
                    <div>{t("cards.session.started", { value: fmtDateTime(sessionMeta.startedAt) })}</div>
                    <div>{t("cards.session.updated", { value: fmtDateTime(sessionMeta.updatedAt) })}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>{t("cards.workflowProgress.title")}</CardDescription>
                    <CardTitle className="text-2xl">
                      {toPercent(workflowProgress)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    {t("cards.workflowProgress.description")}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>{t("cards.signals.title")}</CardDescription>
                    <CardTitle className="text-2xl">{transcriptCount}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-1">
                    <Badge variant={hasInsights ? "default" : "outline"}>
                      {getAdminFeatureLabel(tCommon, "insights")}
                    </Badge>
                    <Badge variant={hasDdx ? "default" : "outline"}>
                      {getAdminFeatureLabel(tCommon, "ddx")}
                    </Badge>
                    <Badge variant={hasRecord ? "default" : "outline"}>
                      {getAdminFeatureLabel(tCommon, "record")}
                    </Badge>
                    <Badge variant={hasResearch ? "default" : "outline"}>
                      {getAdminFeatureLabel(tCommon, "research")}
                    </Badge>
                    <Badge variant={hasHandout ? "default" : "outline"}>
                      {getAdminFeatureLabel(tCommon, "handout")}
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>{t("cards.redFlags.title")}</CardDescription>
                    <CardTitle className="text-2xl">{String(redFlagCount)}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    {t("cards.redFlags.description")}
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="transcript" className="w-full">
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="transcript">{t("tabs.transcript")}</TabsTrigger>
                <TabsTrigger value="insights">{t("tabs.insights")}</TabsTrigger>
                <TabsTrigger value="ddx">{t("tabs.ddx")}</TabsTrigger>
                <TabsTrigger value="record">{t("tabs.record")}</TabsTrigger>
                <TabsTrigger value="research">{t("tabs.research")}</TabsTrigger>
                <TabsTrigger value="handout">{t("tabs.handout")}</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="audit">{t("tabs.audit")}</TabsTrigger>
              </TabsList>

              <TabsContent value="transcript" className="mt-3 space-y-2">
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {(data.transcriptEntries || []).map((entry, idx) => (
                    <div key={String(entry.id || idx)} className="rounded-md border p-2">
                      <div className="mb-1 text-xs text-muted-foreground">
                        {String(entry.speaker || t("unknownSpeaker"))}
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
                        {t("revealText")}
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="insights" className="mt-3 space-y-3">
                <div className="rounded-md border p-2">
                  <div className="text-xs text-muted-foreground">{t("summary")}</div>
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
                      {t("revealSummary")}
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
                    {t("revealPlan")}
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

              <TabsContent value="documents" className="mt-3">
                <pre className="max-h-96 overflow-auto rounded-md border p-2 text-xs">
                  {JSON.stringify(data.sessionDocuments, null, 2)}
                </pre>
              </TabsContent>

              <TabsContent value="audit" className="mt-3">
                <div className="space-y-3">
                  <div>
                    <div className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t("clientEventsTitle")}
                    </div>
                    <pre className="max-h-72 overflow-auto rounded-md border p-2 text-xs">
                      {JSON.stringify(data.clientEvents ?? [], null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t("auditTitle")}
                    </div>
                    <pre className="max-h-72 overflow-auto rounded-md border p-2 text-xs">
                      {JSON.stringify(data.auditTimeline, null, 2)}
                    </pre>
                  </div>
                </div>
              </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}
