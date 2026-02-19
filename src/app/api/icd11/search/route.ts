import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { searchIcd11 } from "@/lib/connectors/icd11"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const { searchParams } = new URL(req.url)
    const q = (searchParams.get("q") || "").trim()

    if (q.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const results = await searchIcd11(q, 10)
    return NextResponse.json({ results })
  } catch (error) {
    logger.error("ICD-11 search failed:", error)
    // Non-fatal endpoint: return an empty list so UI can continue.
    return NextResponse.json({ results: [] })
  }
}
