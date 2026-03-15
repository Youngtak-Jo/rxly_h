import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { ensureSampleConsultationsForUser } from "@/lib/sample-consultations/server"
import { sortSessionsForList } from "@/lib/session-order"

export async function GET() {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    await ensureSampleConsultationsForUser(user.id)

    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
    })
    logAudit({ userId: user.id, action: "READ", resource: "session" })
    return NextResponse.json(sortSessionsForList(sessions).slice(0, 50))
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch sessions:", error)
    const message =
      process.env.NODE_ENV !== "production" && error instanceof Error
        ? error.message
        : "Failed to fetch sessions"
    return NextResponse.json({ error: message }, { status: 500 })
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
        id: body.id || undefined,
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
