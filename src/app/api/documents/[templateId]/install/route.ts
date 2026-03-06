import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { documentInstallSchema } from "@/lib/documents/schema"
import {
  installDocumentForUser,
  uninstallDocumentForUser,
} from "@/lib/documents/server"
import { logAudit } from "@/lib/audit"
import { normalizeUiLocale } from "@/i18n/config"
import { resolveServerUiLocale } from "@/i18n/server"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params
  try {
    const user = await requireAuth()
    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()
    const url = new URL(req.url)
    const locale =
      normalizeUiLocale(url.searchParams.get("locale")) ??
      (await resolveServerUiLocale())

    const parsed = documentInstallSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid install payload" }, { status: 400 })
    }

    const workspace = await installDocumentForUser(
      user.id,
      templateId,
      parsed.data.versionId,
      locale
    )

    logAudit({
      userId: user.id,
      action: "CREATE",
      resource: "document_install",
      resourceId: templateId,
      metadata: {
        versionId: parsed.data.versionId ?? null,
      },
    })

    return NextResponse.json(workspace)
  } catch (error) {
    if (error instanceof NextResponse) return error
    if (error instanceof Error && /not found/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    logger.error("Failed to install document", error)
    return NextResponse.json(
      { error: "Failed to install document" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params
  try {
    const user = await requireAuth()
    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()
    const url = new URL(req.url)
    const locale =
      normalizeUiLocale(url.searchParams.get("locale")) ??
      (await resolveServerUiLocale())

    const workspace = await uninstallDocumentForUser(user.id, templateId, locale)
    logAudit({
      userId: user.id,
      action: "DELETE",
      resource: "document_install",
      resourceId: templateId,
    })
    return NextResponse.json(workspace)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to uninstall document", error)
    return NextResponse.json(
      { error: "Failed to uninstall document" },
      { status: 500 }
    )
  }
}
