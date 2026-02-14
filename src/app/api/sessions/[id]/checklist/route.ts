import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { checklistCreateSchema, checklistPatchSchema } from "@/lib/validations"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth()
    await requireSessionOwnership(id, user.id)

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const items = await prisma.checklistItem.findMany({
      where: { sessionId: id },
      orderBy: { sortOrder: "asc" },
    })
    logAudit({ userId: user.id, action: "READ", resource: "checklist", sessionId: id })
    return NextResponse.json(items)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch checklist:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth()
    await requireSessionOwnership(id, user.id)

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const raw = await req.json()
    const parsed = checklistCreateSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const item = await prisma.$transaction(async (tx) => {
      const count = await tx.checklistItem.count({
        where: { sessionId: id },
      })
      return tx.checklistItem.create({
        data: {
          sessionId: id,
          label: parsed.data.label,
          isChecked: parsed.data.isChecked,
          isAutoChecked: parsed.data.isAutoChecked,
          doctorNote: parsed.data.doctorNote || null,
          sortOrder: count,
          source: parsed.data.source,
        },
      })
    })

    logAudit({ userId: user.id, action: "CREATE", resource: "checklist", resourceId: item.id, sessionId: id })
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to create checklist item:", error)
    return NextResponse.json(
      { error: "Failed to create checklist item" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth()
    await requireSessionOwnership(id, user.id)

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const raw = await req.json()
    const parsed = checklistPatchSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const item = await prisma.checklistItem.update({
      where: { id: parsed.data.itemId, sessionId: id },
      data: {
        isChecked: parsed.data.isChecked,
        isAutoChecked: parsed.data.isAutoChecked,
        doctorNote: parsed.data.doctorNote,
        sortOrder: parsed.data.sortOrder,
      },
    })

    logAudit({ userId: user.id, action: "UPDATE", resource: "checklist", sessionId: id })
    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to update checklist item:", error)
    return NextResponse.json(
      { error: "Failed to update checklist item" },
      { status: 500 }
    )
  }
}
