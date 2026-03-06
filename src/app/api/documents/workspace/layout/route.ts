import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { updateWorkspaceTabOrder } from "@/lib/documents/server"
import { documentWorkspaceLayoutPatchSchema } from "@/lib/documents/schema"
import { logAudit } from "@/lib/audit"
import { normalizeUiLocale } from "@/i18n/config"
import { resolveServerUiLocale } from "@/i18n/server"

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth()
    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()
    const url = new URL(req.url)
    const locale =
      normalizeUiLocale(url.searchParams.get("locale")) ??
      (await resolveServerUiLocale())

    const parsed = documentWorkspaceLayoutPatchSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid layout payload" }, { status: 400 })
    }

    const snapshot = await updateWorkspaceTabOrder(
      user.id,
      parsed.data.tabOrder,
      locale
    )
    logAudit({
      userId: user.id,
      action: "UPDATE",
      resource: "document_workspace_layout",
      metadata: {
        tabCount: snapshot.tabOrder.length,
      },
    })
    return NextResponse.json(snapshot)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to update document workspace layout", error)
    return NextResponse.json(
      { error: "Failed to update document workspace layout" },
      { status: 500 }
    )
  }
}
