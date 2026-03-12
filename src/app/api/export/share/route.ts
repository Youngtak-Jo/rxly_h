import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import {
  ExportShareError,
  getActivePublicDocumentShareForUser,
  replacePublicDocumentShareForUser,
  serializePublicDocumentShare,
} from "@/lib/export-share"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

function getRequestOrigin(req: Request): string {
  return new URL(req.url).origin
}

export async function GET(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("sessionId")?.trim() ?? ""
    const sessionDocumentId =
      searchParams.get("sessionDocumentId")?.trim() ?? ""

    if (!sessionId || !sessionDocumentId) {
      return NextResponse.json(
        { error: "Missing sessionId or sessionDocumentId" },
        { status: 400 }
      )
    }

    const share = await getActivePublicDocumentShareForUser({
      userId: user.id,
      sessionId,
      sessionDocumentId,
    })

    logAudit({
      userId: user.id,
      action: "READ",
      resource: "patient_document_share",
      sessionId,
      resourceId: sessionDocumentId,
    })

    return NextResponse.json(
      share ? serializePublicDocumentShare(share, getRequestOrigin(req)) : null
    )
  } catch (error) {
    if (error instanceof NextResponse) return error
    if (error instanceof ExportShareError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    logger.error("Failed to load patient document share:", error)
    return NextResponse.json(
      { error: "Failed to load patient document share" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const body = (await req.json()) as Record<string, unknown>
    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.trim() : ""
    const sessionDocumentId =
      typeof body.sessionDocumentId === "string"
        ? body.sessionDocumentId.trim()
        : ""
    const title = typeof body.title === "string" ? body.title : ""
    const filename = typeof body.filename === "string" ? body.filename : ""
    const standaloneHtml =
      typeof body.standaloneHtml === "string" ? body.standaloneHtml : ""

    if (!sessionId || !sessionDocumentId || !standaloneHtml.trim()) {
      return NextResponse.json(
        { error: "Missing required share payload" },
        { status: 400 }
      )
    }

    const share = await replacePublicDocumentShareForUser({
      userId: user.id,
      sessionId,
      sessionDocumentId,
      title,
      standaloneHtml,
    })

    logAudit({
      userId: user.id,
      action: "CREATE",
      resource: "patient_document_share",
      resourceId: share.id,
      sessionId,
      metadata: {
        sessionDocumentId,
        filename,
        channel: "patient_share",
      },
    })

    return NextResponse.json(
      serializePublicDocumentShare(share, getRequestOrigin(req))
    )
  } catch (error) {
    if (error instanceof NextResponse) return error
    if (error instanceof ExportShareError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    logger.error("Failed to create patient document share:", error)
    return NextResponse.json(
      { error: "Failed to create patient document share" },
      { status: 500 }
    )
  }
}
