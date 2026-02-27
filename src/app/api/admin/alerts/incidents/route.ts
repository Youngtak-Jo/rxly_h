import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { parseAdminRange } from "@/lib/admin/metrics"
import { parseAdminFilters } from "@/lib/admin/filters"
import { listIncidents } from "@/lib/admin/incidents"
import type { AdminIncidentsResponse } from "@/types/admin"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const { from, to } = parseAdminRange(searchParams)
    const filters = parseAdminFilters(searchParams)

    const result = await listIncidents({
      from,
      to,
      severity: filters.severity,
      status: filters.status,
      priority: filters.priority,
      owner: filters.owner,
      rule: filters.rule,
      q: filters.q,
      order: filters.order,
      cursor: searchParams.get("cursor"),
      limit: searchParams.get("limit"),
    })

    const response: AdminIncidentsResponse = {
      rows: result.rows,
      totalCount: result.totalCount,
      nextCursor: result.nextCursor,
      openCount: result.openCount,
    }

    return adminJson(response)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to list admin incidents", error)
    return adminJson({ error: "Failed to list incidents" }, 500)
  }
}
