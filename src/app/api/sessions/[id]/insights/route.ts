import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const [insights, checklistItems] = await Promise.all([
      prisma.insights.findUnique({
        where: { sessionId: id },
      }),
      prisma.checklistItem.findMany({
        where: { sessionId: id },
        orderBy: { sortOrder: "asc" },
      }),
    ])
    return NextResponse.json({ ...insights, checklistItems })
  } catch (error) {
    console.error("Failed to fetch insights:", error)
    return NextResponse.json(null, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await req.json()

    const insights = await prisma.insights.upsert({
      where: { sessionId: id },
      update: {
        summary: body.summary,
        keyFindings: body.keyFindings,
        redFlags: body.redFlags,
        lastProcessedAt: new Date(),
      },
      create: {
        sessionId: id,
        summary: body.summary || "",
        keyFindings: body.keyFindings || [],
        redFlags: body.redFlags || [],
        lastProcessedAt: new Date(),
      },
    })

    // Sync checklist items if provided
    if (body.checklistItems && Array.isArray(body.checklistItems)) {
      await prisma.checklistItem.deleteMany({
        where: { sessionId: id },
      })

      if (body.checklistItems.length > 0) {
        await prisma.checklistItem.createMany({
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

    return NextResponse.json(insights)
  } catch (error) {
    console.error("Failed to update insights:", error)
    return NextResponse.json(
      { error: "Failed to update insights" },
      { status: 500 }
    )
  }
}
