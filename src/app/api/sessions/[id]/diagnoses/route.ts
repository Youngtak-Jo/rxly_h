import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { diagnosesUpdateSchema } from "@/lib/validations"

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

    const diagnoses = await prisma.diagnosis.findMany({
      where: { sessionId: id },
      orderBy: { sortOrder: "asc" },
    })
    logAudit({ userId: user.id, action: "READ", resource: "diagnosis", sessionId: id })
    return NextResponse.json(diagnoses)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch diagnoses:", error)
    return NextResponse.json([], { status: 500 })
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

    const raw = await req.json()
    const parsed = diagnosesUpdateSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const { diagnoses } = parsed.data

    await prisma.$transaction(async (tx) => {
      await tx.diagnosis.deleteMany({
        where: { sessionId: id },
      })

      if (diagnoses && diagnoses.length > 0) {
        await tx.diagnosis.createMany({
          data: diagnoses.map(
            (
              dx,
              index
            ) => ({
              sessionId: id,
              icdCode: dx.icdCode,
              icdUri: dx.icdUri || null,
              diseaseName: dx.diseaseName,
              confidence:
                dx.confidence?.toUpperCase() === "HIGH"
                  ? "HIGH"
                  : dx.confidence?.toUpperCase() === "LOW"
                    ? "LOW"
                    : "MODERATE",
              evidence: dx.evidence,
              citations: (dx.citations || []) as Prisma.InputJsonValue,
              sortOrder: dx.sortOrder ?? index,
            })
          ),
        })
      }
    })

    logAudit({ userId: user.id, action: "UPDATE", resource: "diagnosis", sessionId: id })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to update diagnoses:", error)
    return NextResponse.json(
      { error: "Failed to update diagnoses" },
      { status: 500 }
    )
  }
}
