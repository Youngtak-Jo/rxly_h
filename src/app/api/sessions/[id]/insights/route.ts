import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { insightsUpdateSchema } from "@/lib/validations"

interface IncomingChecklistItem {
  id?: string
  label: string
  isChecked?: boolean
  isAutoChecked?: boolean
  doctorNote?: string | null
  sortOrder?: number
  source?: "AI" | "MANUAL"
}

function dedupeChecklistItems(items: IncomingChecklistItem[]): IncomingChecklistItem[] {
  const seenIds = new Set<string>()
  const dedupedReversed: IncomingChecklistItem[] = []

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

    const insights = await prisma.insights.findUnique({
      where: { sessionId: id },
    })
    const checklistItems = await prisma.checklistItem.findMany({
      where: { sessionId: id },
      orderBy: { sortOrder: "asc" },
    })
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

    const raw = await req.json()
    const parsed = insightsUpdateSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const body = parsed.data

    const diagnosticKeywords = body.diagnosticKeywords !== undefined
      ? (body.diagnosticKeywords as Prisma.InputJsonValue)
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
        const dedupedItems = dedupeChecklistItems(body.checklistItems)
        const legacyOnly = dedupedItems.length > 0 && dedupedItems.every((item) => !item.id)

        if (legacyOnly) {
          await tx.checklistItem.deleteMany({ where: { sessionId: id } })
          await tx.checklistItem.createMany({
            data: dedupedItems.map((item, index) => ({
              sessionId: id,
              label: item.label,
              isChecked: item.isChecked ?? false,
              isAutoChecked: item.isAutoChecked ?? false,
              doctorNote: item.doctorNote ?? null,
              sortOrder: item.sortOrder ?? index,
              source: item.source === "MANUAL" ? "MANUAL" : "AI",
            })),
          })
          return result
        }

        const existingItems = await tx.checklistItem.findMany({
          where: { sessionId: id },
          select: { id: true },
        })
        const existingIdSet = new Set(existingItems.map((item) => item.id))
        const incomingIds = dedupedItems
          .map((item) => item.id)
          .filter((value): value is string => !!value)

        await tx.checklistItem.deleteMany({
          where: {
            sessionId: id,
            id: { notIn: incomingIds.length > 0 ? incomingIds : ["__never__"] },
          },
        })

        await Promise.all(
          dedupedItems.map((item, index) => {
            const sortOrder = item.sortOrder ?? index
            const baseData = {
              label: item.label,
              isChecked: item.isChecked ?? false,
              isAutoChecked: item.isAutoChecked ?? false,
              doctorNote: item.doctorNote ?? null,
              sortOrder,
              source: item.source === "MANUAL" ? "MANUAL" : "AI",
            } as const

            if (item.id && existingIdSet.has(item.id)) {
              return tx.checklistItem.update({
                where: { id: item.id, sessionId: id },
                data: baseData,
              })
            }

            return tx.checklistItem.create({
              data: {
                ...(item.id ? { id: item.id } : {}),
                sessionId: id,
                ...baseData,
              },
            })
          })
        )
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
