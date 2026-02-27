import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { createSavedView, listSavedViews } from "@/lib/admin/saved-views"
import type { AdminSavedViewsResponse } from "@/types/admin"
import { logger } from "@/lib/logger"

const createSchema = z.object({
  pageKey: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(120),
  params: z.record(z.string(), z.string()).default({}),
  isDefault: z.boolean().optional(),
})

export async function GET(req: Request) {
  try {
    const user = await requireAdmin()

    const { searchParams } = new URL(req.url)
    const pageKey = (searchParams.get("pageKey") || "").trim()
    if (!pageKey) {
      return adminJson({ error: "pageKey is required" }, 400)
    }

    const rows = await listSavedViews({
      adminUserId: user.id,
      pageKey,
    })

    const response: AdminSavedViewsResponse = {
      rows,
    }

    return adminJson(response)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to list saved views", error)
    return adminJson({ error: "Failed to list saved views" }, 500)
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAdmin()

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return adminJson({ error: "Invalid payload" }, 400)
    }

    const view = await createSavedView({
      adminUserId: user.id,
      pageKey: parsed.data.pageKey,
      name: parsed.data.name,
      params: parsed.data.params,
      isDefault: parsed.data.isDefault,
    })

    return adminJson(view, 201)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to create saved view", error)
    return adminJson({ error: "Failed to create saved view" }, 500)
  }
}
