import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { diagnosesUpdateSchema } from "@/lib/validations"

interface IncomingDiagnosis {
  id?: string
  icdCode: string
  icdUri?: string | null
  diseaseName: string
  confidence: string
  evidence: string
  citations?: unknown[]
  sortOrder?: number
}

function toPrismaConfidence(confidence: string): "HIGH" | "MODERATE" | "LOW" {
  if (confidence.toUpperCase() === "HIGH") return "HIGH"
  if (confidence.toUpperCase() === "LOW") return "LOW"
  return "MODERATE"
}

function dedupeDiagnoses(items: IncomingDiagnosis[]): IncomingDiagnosis[] {
  const seenIds = new Set<string>()
  const dedupedReversed: IncomingDiagnosis[] = []

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]
    if (item.id) {
      if (seenIds.has(item.id)) continue
      seenIds.add(item.id)
    }
    dedupedReversed.push(item)
  }

  return dedupedReversed.reverse()
}

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
      const dedupedDiagnoses = dedupeDiagnoses(diagnoses)
      const legacyOnly = dedupedDiagnoses.length > 0 && dedupedDiagnoses.every((dx) => !dx.id)

      if (legacyOnly) {
        await tx.diagnosis.deleteMany({ where: { sessionId: id } })
        await tx.diagnosis.createMany({
          data: dedupedDiagnoses.map((dx, index) => ({
            sessionId: id,
            icdCode: dx.icdCode,
            icdUri: dx.icdUri || null,
            diseaseName: dx.diseaseName,
            confidence: toPrismaConfidence(dx.confidence),
            evidence: dx.evidence,
            citations: (dx.citations || []) as Prisma.InputJsonValue,
            sortOrder: dx.sortOrder ?? index,
          })),
        })
        return
      }

      const existingDiagnoses = await tx.diagnosis.findMany({
        where: { sessionId: id },
        select: { id: true },
      })
      const existingIdSet = new Set(existingDiagnoses.map((item) => item.id))
      const incomingIds = dedupedDiagnoses
        .map((dx) => dx.id)
        .filter((value): value is string => !!value)

      await tx.diagnosis.deleteMany({
        where: {
          sessionId: id,
          id: { notIn: incomingIds.length > 0 ? incomingIds : ["__never__"] },
        },
      })

      await Promise.all(
        dedupedDiagnoses.map((dx, index) => {
          const baseData = {
            icdCode: dx.icdCode,
            icdUri: dx.icdUri || null,
            diseaseName: dx.diseaseName,
            confidence: toPrismaConfidence(dx.confidence),
            evidence: dx.evidence,
            citations: (dx.citations || []) as Prisma.InputJsonValue,
            sortOrder: dx.sortOrder ?? index,
          } as const

          if (dx.id && existingIdSet.has(dx.id)) {
            return tx.diagnosis.update({
              where: { id: dx.id, sessionId: id },
              data: baseData,
            })
          }

          return tx.diagnosis.create({
            data: {
              ...(dx.id ? { id: dx.id } : {}),
              sessionId: id,
              ...baseData,
            },
          })
        })
      )
    },
      { maxWait: 15000, timeout: 30000 })

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
