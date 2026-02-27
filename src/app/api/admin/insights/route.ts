import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { loadOverviewData, parseOverviewRangeFromRequest } from "@/lib/admin/overview"
import type { AdminInsightsResponse } from "@/types/admin"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const range = parseOverviewRangeFromRequest(req.url)
    const skipCache = req.headers.get("x-admin-refresh") === "1"
    const { alerts } = await loadOverviewData(range, { skipCache })

    const response: AdminInsightsResponse = {
      generatedAt: new Date().toISOString(),
      alerts,
    }

    return adminJson(response)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to build admin insights", error)
    return adminJson({ error: "Failed to build admin insights" }, 500)
  }
}
