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

    const [insights, checklistItems] = await Promise.all([
      prisma.insights.findUnique({
        where: { sessionId: id },
      }),
      prisma.checklistItem.findMany({
        where: { sessionId: id },
        orderBy: { sortOrder: "asc" },
      }),
    ])
    logAudit({ userId: user.id, action: "READ", resource: "insights", sessionId: id })
    return NextResponse.json({ ...insights, checklistItems })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch insights:", error)
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

    const diagnosticKeywords = body.diagnosticKeywords !== undefined
      ? body.diagnosticKeywords
      : undefined

    const insights = await prisma.$transaction(async (tx) => {
      const result = await tx.insights.upsert({
        where: { sessionId: id },
        update: {
          summary: body.summary,
          keyFindings: body.keyFindings,
          redFlags: body.redFlags,
          lastProcessedAt: new Date(),
          ...(diagnosticKeywords !== undefined && { diagnosticKeywords }),
        },
        create: {
          sessionId: id,
          summary: body.summary || "",
          keyFindings: body.keyFindings || [],
          redFlags: body.redFlags || [],
          lastProcessedAt: new Date(),
          ...(diagnosticKeywords !== undefined && { diagnosticKeywords }),
        },
      })

      // Sync checklist items if provided
      if (body.checklistItems && Array.isArray(body.checklistItems)) {
        await tx.checklistItem.deleteMany({
          where: { sessionId: id },
        })

        if (body.checklistItems.length > 0) {
          await tx.checklistItem.createMany({
            data: body.checklistItems.map(
              (
                item: {
                  label: string
                  isChecked: boolean
                  isAutoChecked: boolean
                  doctorNote: string | null
                  sortOrder: number
                  source: string
                },
                index: number
              ) => ({
                sessionId: id,
                label: item.label,
                isChecked: item.isChecked ?? false,
                isAutoChecked: item.isAutoChecked ?? false,
                doctorNote: item.doctorNote ?? null,
                sortOrder: item.sortOrder ?? index,
                source: item.source === "MANUAL" ? "MANUAL" : "AI",
              })
            ),
          })
        }
      }

      return result
    })

    logAudit({ userId: user.id, action: "UPDATE", resource: "insights", sessionId: id })
    return NextResponse.json(insights)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to update insights:", error)
    return NextResponse.json(
      { error: "Failed to update insights" },
      { status: 500 }
    )
  }
}
