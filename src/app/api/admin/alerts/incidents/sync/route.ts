import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { loadOverviewData, parseOverviewRangeFromRequest } from "@/lib/admin/overview"
import { syncIncidentsFromAlerts } from "@/lib/admin/incidents"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const adminUser = await requireAdmin()

    const range = parseOverviewRangeFromRequest(req.url)
    const { alerts } = await loadOverviewData(range, { skipCache: true })
    const result = await syncIncidentsFromAlerts({
      alerts,
      actorId: adminUser.id,
    })

    return adminJson({
      success: true,
      ...result,
      syncedAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to sync admin incidents", error)
    return adminJson({ error: "Failed to sync incidents" }, 500)
  }
}
