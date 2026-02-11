import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const items = await prisma.checklistItem.findMany({
      where: { sessionId: id },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error("Failed to fetch checklist:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await req.json()

    const count = await prisma.checklistItem.count({
      where: { sessionId: id },
    })

    const item = await prisma.checklistItem.create({
      data: {
        sessionId: id,
        label: body.label,
        isChecked: body.isChecked || false,
        isAutoChecked: body.isAutoChecked || false,
        doctorNote: body.doctorNote || null,
        sortOrder: count,
        source: body.source || "MANUAL",
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Failed to create checklist item:", error)
    return NextResponse.json(
      { error: "Failed to create checklist item" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await req.json()

    if (!body.itemId) {
      return NextResponse.json(
        { error: "itemId is required" },
        { status: 400 }
      )
    }

    const item = await prisma.checklistItem.update({
      where: { id: body.itemId },
      data: {
        isChecked: body.isChecked,
        isAutoChecked: body.isAutoChecked,
        doctorNote: body.doctorNote,
        sortOrder: body.sortOrder,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("Failed to update checklist item:", error)
    return NextResponse.json(
      { error: "Failed to update checklist item" },
      { status: 500 }
    )
  }
}
