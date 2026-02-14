import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

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

    const { messages } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      )
    }

    const created = await prisma.researchMessage.createMany({
      data: messages.map(
        (m: { role: string; content: string; citations?: unknown[] }) => ({
          sessionId: id,
          role: m.role,
          content: m.content,
          citations: JSON.stringify(m.citations || []),
        })
      ),
    })

    logAudit({ userId: user.id, action: "CREATE", resource: "research", sessionId: id })
    return NextResponse.json({ count: created.count })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to save research messages:", error)
    return NextResponse.json(
      { error: "Failed to save research messages" },
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
    await requireSessionOwnership(id, user.id)

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    await prisma.researchMessage.deleteMany({
      where: { sessionId: id },
    })

    logAudit({ userId: user.id, action: "DELETE", resource: "research", sessionId: id })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to delete research messages:", error)
    return NextResponse.json(
      { error: "Failed to delete research messages" },
      { status: 500 }
    )
  }
}
