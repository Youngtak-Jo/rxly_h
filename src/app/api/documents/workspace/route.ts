import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { getDocumentWorkspaceSnapshot } from "@/lib/documents/server"
import { logAudit } from "@/lib/audit"

export async function GET() {
  try {
    const user = await requireAuth()
    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const snapshot = await getDocumentWorkspaceSnapshot(user.id)
    logAudit({
      userId: user.id,
      action: "READ",
      resource: "document_workspace_layout",
    })
    return NextResponse.json(snapshot)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch document workspace", error)
    const message =
      process.env.NODE_ENV !== "production" && error instanceof Error
        ? error.message
        : "Failed to fetch document workspace"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
