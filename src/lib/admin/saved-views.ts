import { prisma } from "@/lib/prisma"
import type { AdminSavedView } from "@/types/admin"

function mapSavedView(
  row: {
    id: string
    adminUserId: string
    pageKey: string
    name: string
    params: unknown
    isDefault: boolean
    createdAt: Date
    updatedAt: Date
  }
): AdminSavedView {
  return {
    id: row.id,
    adminUserId: row.adminUserId,
    pageKey: row.pageKey,
    name: row.name,
    params:
      row.params && typeof row.params === "object" && !Array.isArray(row.params)
        ? (row.params as Record<string, string>)
        : {},
    isDefault: row.isDefault,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listSavedViews(input: {
  adminUserId: string
  pageKey: string
}) {
  const rows = await prisma.adminSavedView.findMany({
    where: {
      adminUserId: input.adminUserId,
      pageKey: input.pageKey,
    },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  })

  return rows.map(mapSavedView)
}

export async function createSavedView(input: {
  adminUserId: string
  pageKey: string
  name: string
  params: Record<string, string>
  isDefault?: boolean
}) {
  if (input.isDefault) {
    await prisma.adminSavedView.updateMany({
      where: {
        adminUserId: input.adminUserId,
        pageKey: input.pageKey,
      },
      data: {
        isDefault: false,
      },
    })
  }

  const row = await prisma.adminSavedView.create({
    data: {
      adminUserId: input.adminUserId,
      pageKey: input.pageKey,
      name: input.name,
      params: input.params,
      isDefault: !!input.isDefault,
    },
  })

  return mapSavedView(row)
}

export async function deleteSavedView(input: {
  adminUserId: string
  savedViewId: string
}) {
  const existing = await prisma.adminSavedView.findFirst({
    where: {
      id: input.savedViewId,
      adminUserId: input.adminUserId,
    },
    select: { id: true },
  })

  if (!existing) return false

  await prisma.adminSavedView.delete({
    where: {
      id: input.savedViewId,
    },
  })

  return true
}
