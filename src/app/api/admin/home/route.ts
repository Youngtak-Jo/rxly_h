import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { loadOverviewData, parseOverviewRangeFromRequest } from "@/lib/admin/overview"
import { listIncidents } from "@/lib/admin/incidents"
import type { AdminHomeResponse } from "@/types/admin"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const range = parseOverviewRangeFromRequest(req.url)
    const { response } = await loadOverviewData(range)
    const incidents = await listIncidents({
      from: range.from,
      to: range.to,
      severity: "all",
      status: "all",
      priority: "all",
      owner: "",
      rule: "",
      q: "",
      order: "desc",
      cursor: "0",
      limit: "8",
    })

    const urgentIncidents = incidents.rows.filter((row) => row.status !== "RESOLVED" && row.status !== "DISMISSED")

    const payload: AdminHomeResponse = {
      ...response,
      urgentIncidents,
    }

    return adminJson(payload)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to load admin home", error)
    return adminJson({ error: "Failed to load admin home" }, 500)
  }
}
