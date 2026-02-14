import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

export async function GET() {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      take: 50,
    })
    logAudit({ userId: user.id, action: "READ", resource: "session" })
    return NextResponse.json(sessions)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch sessions:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const body = await req.json()

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        title: body.title || "New Consultation",
        patientName: body.patientName || null,
        insights: {
          create: {
            summary: "",
            keyFindings: [],
            redFlags: [],
          },
        },
        record: {
          create: {
            date: new Date(),
          },
        },
      },
      include: {
        insights: true,
        record: true,
      },
    })

    logAudit({ userId: user.id, action: "CREATE", resource: "session", resourceId: session.id })
    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to create session:", error)
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    )
  }
}
