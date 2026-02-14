import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const session = await prisma.session.findUnique({
      where: { id, userId: user.id },
      include: {
        insights: true,
        record: true,
        checklistItems: { orderBy: { sortOrder: "asc" } },
      },
    })
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }
    logAudit({ userId: user.id, action: "READ", resource: "session", resourceId: id })
    return NextResponse.json(session)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch session:", error)
    return NextResponse.json(
      { error: "Failed to fetch session" },
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

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const existing = await prisma.session.findUnique({
      where: { id, userId: user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const body = await req.json()
    const session = await prisma.session.update({
      where: { id },
      data: {
        title: body.title,
        patientName: body.patientName,
      },
    })
    logAudit({ userId: user.id, action: "UPDATE", resource: "session", resourceId: id })
    return NextResponse.json(session)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to update session:", error)
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const existing = await prisma.session.findUnique({
      where: { id, userId: user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    await prisma.session.delete({ where: { id } })
    logAudit({ userId: user.id, action: "DELETE", resource: "session", resourceId: id })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to delete session:", error)
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    )
  }
}
