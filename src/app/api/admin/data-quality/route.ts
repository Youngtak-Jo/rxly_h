import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { parseAdminRange } from "@/lib/admin/metrics"
import { normalizeAdminFeature } from "@/lib/admin/feature"
import { loadAdminDataQualitySnapshot } from "@/lib/admin/data-quality"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const { from, to } = parseAdminRange(searchParams)
    const mode = searchParams.get("mode")
    const modeFilter = mode === "DOCTOR" || mode === "AI_DOCTOR" ? mode : null
    const feature = normalizeAdminFeature(searchParams.get("feature"))

    const { response } = await loadAdminDataQualitySnapshot({
      from,
      to,
      mode: modeFilter,
      feature,
    })

    return adminJson(response)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to load admin data quality", error)
    return adminJson({ error: "Failed to load data quality" }, 500)
  }
}
