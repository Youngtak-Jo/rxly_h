"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { fmtDateTime, toPercent } from "@/components/admin/admin-utils"
import { useAdminRefreshToken } from "@/components/admin/admin-shell"
import { adminFetchJson, useAdminQuery } from "@/hooks/use-admin-query"
import {
  filtersToSearchParams,
  parseAdminFilters,
  toAdminApiParams,
} from "@/lib/admin/filters"
import {
  getAdminRiskBandLabel,
  getAdminRuleLabel,
} from "@/lib/admin/localization"
import type { AdminUserRow, AdminUsersResponse } from "@/types/admin"

function buildPreviousRange(
  fromIso: string,
  toIso: string
): { from: string; to: string } {
  const from = new Date(fromIso)
  const to = new Date(toIso)
  const durationMs = Math.max(60_000, to.getTime() - from.getTime())
  const prevTo = from
  const prevFrom = new Date(from.getTime() - durationMs)
  return {
    from: prevFrom.toISOString(),
    to: prevTo.toISOString(),
  }
}

function formatDelta(value: number): string {
  if (value > 0) return `+${value}`
  return String(value)
}

export function AdminUsers() {
  const t = useTranslations("AdminUsers")
  const tCommon = useTranslations("AdminCommon")
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseAdminFilters(searchParams), [searchParams])
  const refreshToken = useAdminRefreshToken()

  const [rows, setRows] = useState<AdminUserRow[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const baseParams = useMemo(
    () => toAdminApiParams(filters, { limit: "25" }),
    [filters]
  )
  const baseQuery = baseParams.toString()
  const previousQuery = useMemo(() => {
    const previous = buildPreviousRange(filters.from, filters.to)
    return toAdminApiParams(
      {
        ...filters,
        from: previous.from,
        to: previous.to,
      },
      { limit: "1" }
    ).toString()
  }, [filters])
  const filterQuery = useMemo(
    () => filtersToSearchParams(filters).toString(),
    [filters]
  )

  const { data, error, isLoading, isRefreshing } = useAdminQuery<AdminUsersResponse>({
    cacheKey: `admin:users:${baseQuery}`,
    url: `/api/admin/users?${baseQuery}`,
    refreshToken,
  })
  const { data: previousData } = useAdminQuery<AdminUsersResponse>({
    cacheKey: `admin:users:previous:${previousQuery}`,
    url: `/api/admin/users?${previousQuery}`,
    refreshToken,
  })

  useEffect(() => {
    if (!data) return
    setRows(data.rows)
    setNextCursor(data.nextCursor)
  }, [data])

  const isInitialLoading = isLoading && !data && rows.length === 0
  const totalCount = data?.totalCount ?? rows.length
  const previousTotalCount = previousData?.totalCount ?? 0
  const countDelta = totalCount - previousTotalCount

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return

    setIsLoadingMore(true)
    try {
      const params = new URLSearchParams(baseQuery)
      params.set("cursor", nextCursor)
      const query = params.toString()
      const response = await adminFetchJson<AdminUsersResponse>({
        cacheKey: `admin:users:${query}`,
        url: `/api/admin/users?${query}`,
        force: true,
      })

      setRows((prev) => [...prev, ...response.rows])
      setNextCursor(response.nextCursor)
    } finally {
      setIsLoadingMore(false)
    }
  }, [baseQuery, isLoadingMore, nextCursor])

  return (
    <section className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          {isRefreshing ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("description")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("periodComparison", {
            delta: formatDelta(countDelta),
            previousTotalCount,
            totalCount,
          })}
        </p>
      </div>

      {error ? (
        <AdminEmptyState title={t("failed")} description={error} />
      ) : null}

      {isInitialLoading ? <AdminLoadingState label={t("loading")} /> : null}

      {!isInitialLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columns.user")}</TableHead>
                    <TableHead>{t("columns.sessions")}</TableHead>
                    <TableHead>{t("columns.aiCalls")}</TableHead>
                    <TableHead>{t("columns.recordFinalization")}</TableHead>
                    <TableHead>{t("columns.risk")}</TableHead>
                    <TableHead>{t("columns.lastActive")}</TableHead>
                    <TableHead>{t("columns.flags")}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <div className="text-xs font-medium">
                          {user.displayName || user.email || user.userId}
                        </div>
                        <div className="text-xs text-muted-foreground">{user.userId}</div>
                      </TableCell>
                      <TableCell>{user.sessionCount}</TableCell>
                      <TableCell>{user.aiCallCount}</TableCell>
                      <TableCell>{toPercent(user.completionRate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="mr-1">
                          {getAdminRiskBandLabel(tCommon, user.riskBand)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{user.riskScore.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>{fmtDateTime(user.lastActiveAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.riskFlags.length === 0 ? (
                            <span className="text-xs text-muted-foreground">-</span>
                          ) : (
                            user.riskFlags.map((flag) => (
                              <Badge key={flag} variant="outline" className="text-[10px]">
                                {getAdminRuleLabel(tCommon, flag)}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/users/${user.userId}?${filterQuery}`}>
                            {t("open")}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {!isLoading && rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <AdminEmptyState
                          title={t("noUsersTitle")}
                          description={t("noUsersDescription")}
                        />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>

            <div className="mt-3 flex items-center gap-2">
              {nextCursor ? (
                <Button variant="outline" onClick={() => void loadMore()} disabled={isLoadingMore}>
                  {isLoadingMore ? <Loader2 className="size-4 animate-spin" /> : null}
                  {isLoadingMore ? t("loading") : t("loadMore")}
                </Button>
              ) : null}
              {isLoading && rows.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  {t("loading")}
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}
