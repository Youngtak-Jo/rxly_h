import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

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

    const handout = await prisma.patientHandout.findUnique({
      where: { sessionId: id },
    })

    logAudit({
      userId: user.id,
      action: "READ",
      resource: "patient_handout",
      sessionId: id,
    })

    return NextResponse.json(handout)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch patient handout:", error)
    return NextResponse.json(null, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth()
    await requireSessionOwnership(id, user.id)

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const body = await req.json()

    if (!body || !Array.isArray(body.conditions) || !Array.isArray(body.entries)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const language = body.language === "ko" ? "ko" : "en"
    const generatedAt = body.generatedAt ? new Date(body.generatedAt) : new Date()

    const handout = await prisma.patientHandout.upsert({
      where: { sessionId: id },
      update: {
        language,
        conditions: body.conditions,
        entries: body.entries,
        generatedAt,
      },
      create: {
        sessionId: id,
        language,
        conditions: body.conditions,
        entries: body.entries,
        generatedAt,
      },
    })

    logAudit({
      userId: user.id,
      action: "UPDATE",
      resource: "patient_handout",
      sessionId: id,
    })

    return NextResponse.json(handout)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to update patient handout:", error)
    return NextResponse.json(
      { error: "Failed to update patient handout" },
      { status: 500 }
    )
  }
}
