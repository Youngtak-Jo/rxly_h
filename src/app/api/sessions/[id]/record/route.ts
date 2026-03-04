import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { recordUpdateSchema } from "@/lib/validations"

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

    const record = await prisma.consultationRecord.findUnique({
      where: { sessionId: id },
    })
    logAudit({ userId: user.id, action: "READ", resource: "record", sessionId: id })
    return NextResponse.json(record)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch record:", error)
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
    const parsed = recordUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const recordData = {
      patientName: parsed.data.patientName,
      chiefComplaint: parsed.data.chiefComplaint,
      hpiText: parsed.data.hpiText,
      medications: parsed.data.medications,
      rosText: parsed.data.rosText,
      pmh: parsed.data.pmh,
      socialHistory: parsed.data.socialHistory,
      familyHistory: parsed.data.familyHistory,
      vitals: parsed.data.vitals === null
        ? Prisma.JsonNull
        : parsed.data.vitals !== undefined
          ? (parsed.data.vitals as Prisma.InputJsonValue)
          : undefined,
      physicalExam: parsed.data.physicalExam,
      labsStudies: parsed.data.labsStudies,
      assessment: parsed.data.assessment,
      plan: parsed.data.plan,
    }

    const record = await prisma.consultationRecord.upsert({
      where: { sessionId: id },
      update: recordData,
      create: { sessionId: id, date: new Date(), ...recordData },
    })

    logAudit({ userId: user.id, action: "UPDATE", resource: "record", sessionId: id })
    return NextResponse.json(record)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to update record:", error)
    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 }
    )
  }
}

