import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { documentCatalogQuerySchema } from "@/lib/documents/schema"
import { getDocumentCatalog } from "@/lib/documents/server"
import { logAudit } from "@/lib/audit"

export async function GET(req: Request) {
  try {
    const user = await requireAuth()
    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const url = new URL(req.url)
    const parsed = documentCatalogQuerySchema.safeParse({
      q: url.searchParams.get("q") ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 })
    }

    const items = await getDocumentCatalog(user.id, parsed.data.q)
    logAudit({
      userId: user.id,
      action: "READ",
      resource: "document_template",
      metadata: {
        count: items.length,
      },
    })
    return NextResponse.json({ items })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch document catalog", error)
    const message =
      process.env.NODE_ENV !== "production" && error instanceof Error
        ? error.message
        : "Failed to fetch document catalog"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
