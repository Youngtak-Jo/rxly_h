import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { loadOverviewData, parseOverviewRangeFromRequest } from "@/lib/admin/overview"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const range = parseOverviewRangeFromRequest(req.url)
    const skipCache = req.headers.get("x-admin-refresh") === "1"
    const { response } = await loadOverviewData(range, { skipCache })

    return adminJson(response)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to build admin overview", error)
    return adminJson({ error: "Failed to build admin overview" }, 500)
  }
}
