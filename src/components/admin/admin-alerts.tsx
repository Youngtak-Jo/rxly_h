"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminLoadingState } from "@/components/admin/admin-loading-state"
import { severityBadgeVariant } from "@/components/admin/admin-utils"
import { useAdminRefreshToken } from "@/components/admin/admin-shell"
import { useAdminQuery } from "@/hooks/use-admin-query"
import {
  filtersToSearchParams,
  parseAdminFilters,
  toAdminApiParams,
} from "@/lib/admin/filters"
import {
  getAdminAlertCopy,
  getAdminRuleLabel,
  getAdminSeverityLabel,
} from "@/lib/admin/localization"
import type { AdminInsightsResponse } from "@/types/admin"

export function AdminAlerts() {
  const t = useTranslations("AdminAlerts")
  const tCommon = useTranslations("AdminCommon")
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseAdminFilters(searchParams), [searchParams])
  const refreshToken = useAdminRefreshToken()
  const [selectedSeverity, setSelectedSeverity] = useState<
    "all" | "high" | "medium" | "low" | "positive"
  >("all")
  const [selectedRule, setSelectedRule] = useState<string>("all")

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

  const { data, error, isLoading, isRefreshing } = useAdminQuery<AdminInsightsResponse>({
    cacheKey: `admin:alerts:${apiQuery}`,
    url: `/api/admin/insights?${apiQuery}`,
    refreshToken,
  })
  const rules = useMemo(() => {
    return Array.from(new Set((data?.alerts || []).map((alert) => alert.rule))).sort((a, b) =>
      a.localeCompare(b)
    )
  }, [data?.alerts])

  const filteredAlerts = useMemo(() => {
    const severityRank: Record<string, number> = {
      high: 0,
      medium: 1,
      low: 2,
      positive: 3,
    }

    return (data?.alerts || [])
      .filter((alert) =>
        selectedSeverity === "all" ? true : alert.severity === selectedSeverity
      )
      .filter((alert) => (selectedRule === "all" ? true : alert.rule === selectedRule))
      .sort((a, b) => {
        const severityDiff =
          (severityRank[a.severity] ?? 99) - (severityRank[b.severity] ?? 99)
        if (severityDiff !== 0) return severityDiff
        return a.rule.localeCompare(b.rule)
      })
  }, [data?.alerts, selectedRule, selectedSeverity])

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

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle className="text-base">{t("queueTitle")}</CardTitle>
              <CardDescription>
                {t("queueDescription")}
              </CardDescription>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Select
                value={selectedSeverity}
                onValueChange={(value) =>
                  setSelectedSeverity(
                    value as "all" | "high" | "medium" | "low" | "positive"
                  )
                }
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder={t("severityPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {getAdminSeverityLabel(tCommon, "all")}
                  </SelectItem>
                  <SelectItem value="high">
                    {getAdminSeverityLabel(tCommon, "high")}
                  </SelectItem>
                  <SelectItem value="medium">
                    {getAdminSeverityLabel(tCommon, "medium")}
                  </SelectItem>
                  <SelectItem value="low">
                    {getAdminSeverityLabel(tCommon, "low")}
                  </SelectItem>
                  <SelectItem value="positive">
                    {getAdminSeverityLabel(tCommon, "positive")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedRule} onValueChange={setSelectedRule}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder={t("rulePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allRules")}</SelectItem>
                  {rules.map((rule) => (
                    <SelectItem key={rule} value={rule}>
                      {getAdminRuleLabel(tCommon, rule)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {isInitialLoading ? (
            <AdminEmptyState
              title={t("loadingTitle")}
              description={t("loadingDescription")}
            />
          ) : filteredAlerts.length === 0 ? (
            <AdminEmptyState
              title={t("emptyTitle")}
              description={t("emptyDescription")}
            />
          ) : (
            filteredAlerts.map((alert) => {
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
                          {t("openUser")}
                        </Link>
                      </Button>
                    ) : null}

                    {alert.sessionId ? (
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/admin/sessions/${alert.sessionId}?${filterQuery}`}
                        >
                          {t("openSession")}
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </section>
  )
}
