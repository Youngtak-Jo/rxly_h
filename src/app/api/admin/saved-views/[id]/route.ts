import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { deleteSavedView } from "@/lib/admin/saved-views"
import { logger } from "@/lib/logger"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const user = await requireAdmin()

    const ok = await deleteSavedView({
      adminUserId: user.id,
      savedViewId: id,
    })

    if (!ok) {
      return adminJson({ error: "Saved view not found" }, 404)
    }

    return adminJson({ success: true })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to delete saved view", error)
    return adminJson({ error: "Failed to delete saved view" }, 500)
  }
}
