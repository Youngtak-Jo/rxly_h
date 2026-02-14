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

    const record = await prisma.consultationRecord.upsert({
      where: { sessionId: id },
      update: {
        patientName: body.patientName,
        chiefComplaint: body.chiefComplaint,
        hpiText: body.hpiText,
        medications: body.medications,
        rosText: body.rosText,
        pmh: body.pmh,
        socialHistory: body.socialHistory,
        familyHistory: body.familyHistory,
        vitals: body.vitals,
        physicalExam: body.physicalExam,
        labsStudies: body.labsStudies,
        assessment: body.assessment,
        plan: body.plan,
      },
      create: {
        sessionId: id,
        date: new Date(),
        patientName: body.patientName,
        chiefComplaint: body.chiefComplaint,
        hpiText: body.hpiText,
        medications: body.medications,
        rosText: body.rosText,
        pmh: body.pmh,
        socialHistory: body.socialHistory,
        familyHistory: body.familyHistory,
        vitals: body.vitals,
        physicalExam: body.physicalExam,
        labsStudies: body.labsStudies,
        assessment: body.assessment,
        plan: body.plan,
      },
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
