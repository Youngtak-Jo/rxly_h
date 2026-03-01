import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { parseOverviewRangeFromRequest } from "@/lib/admin/overview"
import { loadAdminHomeData } from "@/lib/admin/home"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const range = parseOverviewRangeFromRequest(req.url)
    const payload = await loadAdminHomeData(range)

    return adminJson(payload)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to load admin home", error)
    return adminJson({ error: "Failed to load admin home" }, 500)
  }
}
