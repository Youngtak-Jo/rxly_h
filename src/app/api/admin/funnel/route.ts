import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { loadOverviewData, parseOverviewRangeFromRequest } from "@/lib/admin/overview"
import { buildFunnelDropoffs } from "@/lib/admin/metrics"
import type { AdminFunnelResponse } from "@/types/admin"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const range = parseOverviewRangeFromRequest(req.url)
    const { response } = await loadOverviewData(range)

    const payload: AdminFunnelResponse = {
      from: response.from,
      to: response.to,
      steps: response.funnel,
      dropoffs: buildFunnelDropoffs(response.funnel),
    }

    return adminJson(payload)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to load admin funnel", error)
    return adminJson({ error: "Failed to load funnel" }, 500)
  }
}
