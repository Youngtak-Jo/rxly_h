"use client"

import { useMemo } from "react"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
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
import { parseAdminFilters, toAdminApiParams } from "@/lib/admin/filters"
import { useAdminQuery } from "@/hooks/use-admin-query"
import { useAdminRefreshToken } from "@/components/admin/admin-shell"
import type { AdminComplianceResponse } from "@/types/admin"
import { fmtDateTime } from "@/components/admin/admin-utils"

export function AdminCompliance() {
  const t = useTranslations("AdminCompliance")
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseAdminFilters(searchParams), [searchParams])
  const refreshToken = useAdminRefreshToken()

  const apiQuery = useMemo(
    () => toAdminApiParams({ ...filters, q: "" }).toString(),
    [filters]
  )

  const { data, error, isLoading, isRefreshing } = useAdminQuery<AdminComplianceResponse>({
    cacheKey: `admin:compliance:${apiQuery}`,
    url: `/api/admin/compliance?${apiQuery}`,
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
            <CardTitle className="text-base">{t("phiRevealTitle")}</CardTitle>
            <CardDescription>{t("phiRevealDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.revealLogs.length ? (
              <AdminEmptyState
                title={t("phiRevealNoDataTitle")}
                description={t("phiRevealNoDataDescription")}
              />
            ) : (
              <div className="space-y-2">
                {data.revealLogs.map((log) => (
                  <div key={log.id} className="rounded-md border p-2 text-xs">
                    <div className="font-medium">{log.entityType || t("unknown")}:{log.fieldPath || "-"}</div>
                    <div className="text-muted-foreground">{t("entity")}: {log.entityId || "-"}</div>
                    <div className="text-muted-foreground">{t("by")}: {log.adminUserId}</div>
                    <div className="text-muted-foreground">{t("reason")}: {log.reason || "-"}</div>
                    <div className="text-muted-foreground">{fmtDateTime(log.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("exportSignalsTitle")}</CardTitle>
            <CardDescription>{t("exportSignalsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.exportSignals.length ? (
              <AdminEmptyState
                title={t("exportSignalsNoDataTitle")}
                description={t("exportSignalsNoDataDescription")}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columns.user")}</TableHead>
                    <TableHead>{t("columns.exports")}</TableHead>
                    <TableHead>{t("columns.avgAccess")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.exportSignals.map((signal) => (
                    <TableRow key={signal.userId}>
                      <TableCell>{signal.userId}</TableCell>
                      <TableCell>{signal.exportCount}</TableCell>
                      <TableCell>{signal.avgAccessCount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
